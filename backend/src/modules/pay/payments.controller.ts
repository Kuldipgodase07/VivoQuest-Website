import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Public, CurrentUser, RequireRoles } from '../../common/decorators/auth.decorators';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Payments & Finance')
@Controller('v1/pay')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('intents')
  @ApiOperation({ summary: 'Create payment session intent (Razorpay/Stripe)' })
  async createIntent(@Body() body: any, @CurrentUser('id') userId: string) {
    return this.paymentsService.createIntent(body, userId);
  }

  @Public()
  @Post('webhooks/razorpay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive signed Razorpay webhook notifications' })
  async handleRazorpayWebhook(
    @Body() body: any,
    @Headers('x-razorpay-signature') signature: string
  ) {
    return this.paymentsService.handleRazorpayWebhook(body, signature);
  }

  @Public()
  @Post('webhooks/stripe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive signed Stripe webhook notifications' })
  async handleStripeWebhook(
    @Body() body: any,
    @Headers('stripe-signature') signature: string
  ) {
    return this.paymentsService.handleStripeWebhook(body, signature);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List financial transactions' })
  async getTransactions() {
    return this.paymentsService.getTransactions();
  }

  @Post('refunds')
  @RequireRoles('finance', 'admin')
  @ApiOperation({ summary: 'Initiate refund request (Maker-Checker enforced)' })
  async createRefund(@Body() body: any, @CurrentUser('id') userId: string) {
    return this.paymentsService.createRefund(body, userId);
  }

  @Get('settlements')
  @RequireRoles('finance', 'admin')
  @ApiOperation({ summary: 'List daily gateway settlement batches' })
  async getSettlements() {
    return this.paymentsService.getSettlements();
  }

  @Post('reconciliation/runs')
  @RequireRoles('finance', 'admin')
  @ApiOperation({ summary: 'Execute automated 3-way reconciliation run' })
  async runReconciliation(@CurrentUser('id') userId: string) {
    return this.paymentsService.runReconciliation(userId);
  }

  @Get('receivables')
  @RequireRoles('finance', 'admin')
  @ApiOperation({ summary: 'Get aged accounts receivable buckets (0-30, 31-60, 61-90, 90+)' })
  async getReceivables() {
    return this.paymentsService.getReceivables();
  }
}
