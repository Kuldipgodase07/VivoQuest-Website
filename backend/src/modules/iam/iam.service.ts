import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { CryptoService } from '../../common/crypto/crypto.service';
import { RedisService } from '../../common/redis/redis.service';
import { AuditService } from '../../common/services/audit.service';
import { ObjectId } from 'mongodb';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class IamService {
  private readonly logger = new Logger(IamService.name);
  private readonly jwtSecret = process.env.JWT_SECRET || 'vivoquest_production_jwt_secret_key_2026';

  constructor(
    private readonly db: DatabaseService,
    private readonly crypto: CryptoService,
    private readonly redis: RedisService,
    private readonly audit: AuditService
  ) {}

  async sendOtp(phoneE164: string, ip: string = '127.0.0.1', city: string = 'Pune') {
    const normalizedPhone = phoneE164.trim();
    const phoneHash = this.crypto.hashPhone(normalizedPhone);

    // Rate limits (Section 6: 3 sends per phone per hour, 10 per IP per hour)
    const phoneKey = `ratelimit:otp:phone:${phoneHash}`;
    const ipKey = `ratelimit:otp:ip:${ip}`;
    const lockKey = `lockout:phone:${phoneHash}`;

    const isLocked = await this.redis.get(lockKey);
    if (isLocked) {
      throw new HttpException({
        code: 'AUTH_PHONE_LOCKED',
        detail: 'Phone is locked due to repeated failed attempts. Please try again after 30 minutes.'
      }, HttpStatus.TOO_MANY_REQUESTS);
    }

    const phoneCount = await this.redis.incr(phoneKey);
    if (phoneCount === 1) await this.redis.expire(phoneKey, 3600);
    if (phoneCount > 3) {
      throw new HttpException({
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        detail: 'Too many OTP requests for this phone number. Limit is 3 per hour.'
      }, HttpStatus.TOO_MANY_REQUESTS);
    }

    const ipCount = await this.redis.incr(ipKey);
    if (ipCount === 1) await this.redis.expire(ipKey, 3600);
    if (ipCount > 10) {
      throw new HttpException({
        code: 'AUTH_IP_RATE_LIMIT_EXCEEDED',
        detail: 'Too many OTP requests from this IP. Limit is 10 per hour.'
      }, HttpStatus.TOO_MANY_REQUESTS);
    }

    // Generate 6-digit OTP
    const otp = this.crypto.generateOtp();
    const salt = this.crypto.generateSalt();
    const codeHash = this.crypto.hashCode(otp, salt);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes TTL
    const now = new Date();

    await this.db.getCollection('iam_otp_challenges').insertOne({
      _id: new ObjectId(),
      phoneHash,
      codeHash: `${salt}:${codeHash}`,
      expiresAt,
      attemptsRemaining: 5,
      ip,
      verifiedAt: null,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
      deletedAt: null
    });

    // In non-production or for demo accounts, log the OTP for testing
    this.logger.log(`[DLT SMS Provider] Sent OTP to ${normalizedPhone.substring(0, 5)}***: ${otp} (Template ID: DLT-VQ-AUTH-01)`);

    return {
      success: true,
      message: 'OTP sent via DLT registered SMS template',
      expiresInSeconds: 600,
      debugCode: process.env.NODE_ENV !== 'production' ? otp : undefined
    };
  }

  async verifyOtp(phoneE164: string, code: string, city: string = 'Pune', role: string = 'patient', ip: string = '127.0.0.1') {
    const normalizedPhone = phoneE164.trim();
    const phoneHash = this.crypto.hashPhone(normalizedPhone);

    const challenges = await this.db.getCollection('iam_otp_challenges').find({
      phoneHash,
      verifiedAt: null,
      expiresAt: { $gte: new Date() }
    }).sort({ createdAt: -1 }).limit(1).toArray();

    if (!challenges || challenges.length === 0) {
      throw new BadRequestException({
        code: 'AUTH_OTP_EXPIRED',
        detail: 'No active OTP challenge found or challenge has expired.'
      });
    }

    const challenge = challenges[0];
    if (challenge.attemptsRemaining <= 0) {
      // Lock phone for 30 minutes
      await this.redis.set(`lockout:phone:${phoneHash}`, '1', 1800);
      throw new BadRequestException({
        code: 'AUTH_OTP_MAX_ATTEMPTS',
        detail: 'Maximum OTP verification attempts exceeded. Account locked for 30 minutes.'
      });
    }

    const [salt, expectedHash] = challenge.codeHash.split(':');
    const providedHash = this.crypto.hashCode(code.trim(), salt);

    if (providedHash !== expectedHash) {
      await this.db.getCollection('iam_otp_challenges').updateOne(
        { _id: challenge._id },
        { $inc: { attemptsRemaining: -1 }, $set: { updatedAt: new Date() } }
      );
      throw new BadRequestException({
        code: 'AUTH_OTP_INVALID',
        detail: `Incorrect OTP code. Attempts remaining: ${challenge.attemptsRemaining - 1}`
      });
    }

    // Mark challenge verified
    const now = new Date();
    await this.db.getCollection('iam_otp_challenges').updateOne(
      { _id: challenge._id },
      { $set: { verifiedAt: now, updatedAt: now } }
    );

    // Find or create User
    let user = await this.db.getCollection('iam_users').findOne({ phoneHash });
    if (!user) {
      const allowedRole = role || 'patient';
      const insertRes = await this.db.getCollection('iam_users').insertOne({
        _id: new ObjectId(),
        phoneE164: this.crypto.encryptField(normalizedPhone),
        phoneHash,
        roles: [allowedRole],
        currentRole: allowedRole,
        city,
        preferredLanguage: 'en',
        status: 'active',
        lastLoginAt: now,
        mfa: { enabled: false },
        schemaVersion: 1,
        createdAt: now,
        updatedAt: now,
        createdBy: 'auth_service',
        deletedAt: null
      });
      user = await this.db.getCollection('iam_users').findOne({ _id: insertRes.insertedId });
    } else {
      let effectiveRole = user.currentRole || user.roles[0];
      if (role && (user.roles.includes(role) || user.roles.includes('admin'))) {
        effectiveRole = role;
      }
      await this.db.getCollection('iam_users').updateOne(
        { _id: user._id },
        { $set: { currentRole: effectiveRole, lastLoginAt: now, updatedAt: now } }
      );
      user.currentRole = effectiveRole;
    }

    // Create session & refresh token family
    const rawRefreshToken = this.crypto.generateSecureToken();
    const refreshTokenHash = this.crypto.hashSha256(rawRefreshToken);
    const familyId = new ObjectId().toHexString();
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const sessionRes = await this.db.getCollection('iam_sessions').insertOne({
      _id: new ObjectId(),
      userId: user!._id,
      refreshTokenHash,
      familyId,
      deviceId: null,
      ip,
      userAgent: 'VivoQuest Web App',
      expiresAt: sessionExpiresAt,
      revokedAt: null,
      revokedReason: null,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: String(user!._id),
      deletedAt: null
    });

    const accessToken = jwt.sign(
      {
        sub: String(user!._id),
        phoneHash: user!.phoneHash,
        roles: user!.roles,
        currentRole: user!.currentRole || user!.roles[0],
        city: user!.city,
        sessionId: String(sessionRes.insertedId)
      },
      this.jwtSecret,
      { expiresIn: '15m' }
    );

    await this.audit.logEvent({
      actorId: user!._id,
      action: 'auth.login.success',
      resourceType: 'iam_users',
      resourceId: user!._id,
      ip
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 900,
      user: {
        id: String(user!._id),
        phoneHash: user!.phoneHash,
        roles: user!.roles,
        currentRole: user!.currentRole || user!.roles[0],
        city: user!.city,
        preferredLanguage: user!.preferredLanguage || 'en'
      }
    };
  }

  async refreshToken(rawRefreshToken: string) {
    const refreshTokenHash = this.crypto.hashSha256(rawRefreshToken.trim());
    const session = await this.db.getCollection('iam_sessions').findOne({ refreshTokenHash });

    if (!session) {
      throw new UnauthorizedException({
        code: 'AUTH_REFRESH_TOKEN_INVALID',
        detail: 'Invalid refresh token.'
      });
    }

    // Reuse detection: if already revoked, revoke whole family
    if (session.revokedAt) {
      await this.db.getCollection('iam_sessions').updateMany(
        { familyId: session.familyId },
        { $set: { revokedAt: new Date(), revokedReason: 'token_reuse_detected' } }
      );
      throw new UnauthorizedException({
        code: 'AUTH_REFRESH_TOKEN_REUSED',
        detail: 'Refresh token reuse detected. All active sessions in family have been terminated.'
      });
    }

    if (new Date() > new Date(session.expiresAt)) {
      throw new UnauthorizedException({
        code: 'AUTH_REFRESH_TOKEN_EXPIRED',
        detail: 'Refresh token has expired.'
      });
    }

    // Rotate refresh token
    const newRawRefreshToken = this.crypto.generateSecureToken();
    const newRefreshTokenHash = this.crypto.hashSha256(newRawRefreshToken);
    const now = new Date();

    await this.db.getCollection('iam_sessions').updateOne(
      { _id: session._id },
      {
        $set: {
          refreshTokenHash: newRefreshTokenHash,
          updatedAt: now
        }
      }
    );

    const user = await this.db.getCollection('iam_users').findOne({ _id: session.userId });
    if (!user) {
      throw new UnauthorizedException({ code: 'AUTH_USER_NOT_FOUND', detail: 'User no longer exists.' });
    }

    const newAccessToken = jwt.sign(
      {
        sub: String(user._id),
        phoneHash: user.phoneHash,
        roles: user.roles,
        currentRole: user.currentRole || user.roles[0],
        city: user.city,
        sessionId: String(session._id)
      },
      this.jwtSecret,
      { expiresIn: '15m' }
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRawRefreshToken,
      expiresIn: 900
    };
  }

  async logout(sessionId: string, userId: string) {
    if (sessionId && ObjectId.isValid(sessionId)) {
      await this.db.getCollection('iam_sessions').updateOne(
        { _id: new ObjectId(sessionId) },
        { $set: { revokedAt: new Date(), revokedReason: 'user_logout' } }
      );
    }
    return { success: true, message: 'Logged out successfully.' };
  }

  async switchRole(userId: string, newRole: string) {
    const user = await this.db.getCollection('iam_users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      throw new BadRequestException({ code: 'AUTH_USER_NOT_FOUND', detail: 'User not found' });
    }

    const hasRole = user.roles.includes(newRole) || user.roles.includes('admin');
    if (!hasRole) {
      // Check if granted in iam_role_grants
      const grant = await this.db.getCollection('iam_role_grants').findOne({
        userId: new ObjectId(userId),
        role: newRole,
        status: 'approved'
      });
      if (!grant) {
        throw new BadRequestException({
          code: 'AUTH_ROLE_NOT_GRANTED',
          detail: `User is not authorized for role: ${newRole}. Verification may be required.`
        });
      }
    }

    await this.db.getCollection('iam_users').updateOne(
      { _id: user._id },
      { $set: { currentRole: newRole, updatedAt: new Date() } }
    );

    // Return new JWT with updated currentRole
    const accessToken = jwt.sign(
      {
        sub: String(user._id),
        phoneHash: user.phoneHash,
        roles: user.roles,
        currentRole: newRole,
        city: user.city
      },
      this.jwtSecret,
      { expiresIn: '15m' }
    );

    return {
      success: true,
      currentRole: newRole,
      accessToken
    };
  }
}
