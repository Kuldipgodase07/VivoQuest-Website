import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

// Common
import { DatabaseModule } from './common/database/database.module';
import { RedisModule } from './common/redis/redis.module';
import { CryptoModule } from './common/crypto/crypto.module';
import { AuthGuard } from './common/guards/auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { ProblemDetailsFilter } from './common/filters/problem-details.filter';
import { AuditService } from './common/services/audit.service';

// Modules
import { IamModule } from './modules/iam/iam.module';
import { ProfilesModule } from './modules/prf/profiles.module';
import { CareModule } from './modules/care/care.module';
import { AcoModule } from './modules/aco/aco.module';
import { VaccinationsModule } from './modules/vac/vaccinations.module';
import { MarketplaceModule } from './modules/mkt/marketplace.module';
import { PaymentsModule } from './modules/pay/payments.module';
import { ComplianceModule } from './modules/cmp/compliance.module';
import { AuditModule } from './modules/aud/audit.module';
import { ReportsModule } from './modules/rpt/reports.module';
import { NotificationsModule } from './modules/ntf/notifications.module';

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    CryptoModule,
    IamModule,
    ProfilesModule,
    CareModule,
    AcoModule,
    VaccinationsModule,
    MarketplaceModule,
    PaymentsModule,
    ComplianceModule,
    AuditModule,
    ReportsModule,
    NotificationsModule
  ],
  providers: [
    AuditService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestIdInterceptor
    },
    {
      provide: APP_FILTER,
      useClass: ProblemDetailsFilter
    }
  ]
})
export class AppModule {}
