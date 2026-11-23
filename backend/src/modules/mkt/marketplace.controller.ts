import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { CurrentUser } from '../../common/decorators/auth.decorators';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Marketplace')
@Controller('v1/mkt')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('products')
  @ApiOperation({ summary: 'List marketplace products' })
  async getProducts(@Query('categoryId') categoryId?: string) {
    return this.marketplaceService.getProducts(categoryId);
  }

  @Post('products')
  @ApiOperation({ summary: 'Add product to marketplace (sellers/admin)' })
  async createProduct(@Body() body: any, @CurrentUser('id') userId: string) {
    return this.marketplaceService.createProduct(body, userId);
  }

  @Get('categories')
  @ApiOperation({ summary: 'List product categories' })
  async getCategories() {
    return this.marketplaceService.getCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create category' })
  async createCategory(@Body() body: any, @CurrentUser('id') userId: string) {
    return this.marketplaceService.createCategory(body, userId);
  }

  @Get('carts')
  @ApiOperation({ summary: 'Get current user cart' })
  async getCart(@CurrentUser('id') userId: string) {
    return this.marketplaceService.getCart(userId);
  }

  @Post('carts')
  @ApiOperation({ summary: 'Update cart items' })
  async updateCart(@Body() body: { items: any[] }, @CurrentUser('id') userId: string) {
    return this.marketplaceService.updateCart(userId, body.items || []);
  }

  @Post('orders')
  @ApiOperation({ summary: 'Checkout cart and create order with payment intent' })
  async createOrder(@Body() body: any, @CurrentUser('id') userId: string) {
    return this.marketplaceService.createOrder(userId, body);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get order details and items' })
  async getOrder(@Param('id') orderId: string) {
    return this.marketplaceService.getOrder(orderId);
  }

  @Get('orders/:id/invoice')
  @ApiOperation({ summary: 'Get order tax invoice' })
  async getOrderInvoice(@Param('id') orderId: string) {
    return this.marketplaceService.getOrderInvoice(orderId);
  }
}
