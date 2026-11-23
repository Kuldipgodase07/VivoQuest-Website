import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly hmacSecret = process.env.HMAC_SECRET || 'vivoquest_phone_hmac_secret_2026';
  private readonly encKey = crypto.scryptSync(this.hmacSecret, 'vivoquest_salt_aes', 32);

  hashPhone(phoneE164: string): string {
    return crypto.createHmac('sha256', this.hmacSecret)
      .update(phoneE164.trim())
      .digest('hex');
  }

  hashCode(code: string, salt: string): string {
    return crypto.createHmac('sha256', salt)
      .update(code)
      .digest('hex');
  }

  generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  generateOtp(): string {
    // 6-digit numerical code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  hashSha256(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  computeAuditHash(prevHash: string | null, payload: Record<string, any>): string {
    const serialized = JSON.stringify(payload, Object.keys(payload).sort());
    return this.hashSha256((prevHash || 'ROOT_GENESIS_EVENT') + ':' + serialized);
  }

  encryptField(plainText: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encKey, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  decryptField(cipherText: string): string {
    try {
      const parts = cipherText.split(':');
      if (parts.length !== 3) return cipherText;
      const [ivHex, authTagHex, encrypted] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.encKey, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (e) {
      return cipherText;
    }
  }
}
