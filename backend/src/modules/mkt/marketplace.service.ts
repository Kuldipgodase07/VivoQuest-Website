import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { ObjectId } from 'mongodb';

@Injectable()
export class MarketplaceService {
  constructor(private readonly db: DatabaseService) {}

  async getProducts(categoryId?: string) {
    const filter: any = { status: 'active', deletedAt: null };
    if (categoryId && ObjectId.isValid(categoryId)) filter.categoryId = new ObjectId(categoryId);
    return this.db.getCollection('mkt_products').find(filter).toArray();
  }

  async createProduct(data: any, userId: string) {
    const now = new Date();
    const doc = {
      _id: new ObjectId(),
      name: data.name,
      sku: data.sku || `SKU-${Date.now()}`,
      categoryId: data.categoryId ? new ObjectId(data.categoryId) : null,
      sellerId: data.sellerId ? new ObjectId(data.sellerId) : null,
      description: data.description || null,
      priceMinor: Math.round(Number(data.priceMinor)), // Integer paise
      currency: data.currency || 'INR',
      stockQuantity: data.stockQuantity || 10,
      status: data.status || 'active',
      hsnSac: data.hsnSac || '9018',
      gstRatePercent: data.gstRatePercent || 12.0,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      deletedAt: null
    };
    await this.db.getCollection('mkt_products').insertOne(doc);
    return doc;
  }

  async getCategories() {
    return this.db.getCollection('mkt_categories').find({ deletedAt: null }).toArray();
  }

  async createCategory(data: any, userId: string) {
    const now = new Date();
    const doc = {
      _id: new ObjectId(),
      slug: data.slug,
      name: data.name,
      description: data.description || null,
      parentId: null,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      deletedAt: null
    };
    await this.db.getCollection('mkt_categories').insertOne(doc);
    return doc;
  }

  async getCart(userId: string) {
    const cart = await this.db.getCollection('mkt_carts').findOne({ userId: new ObjectId(userId) });
    return cart || { userId, items: [] };
  }

  async updateCart(userId: string, items: Array<{ productId: string; quantity: number }>) {
    const now = new Date();
    const formattedItems = items.map(item => ({
      productId: new ObjectId(item.productId),
      quantity: Number(item.quantity)
    }));

    const updateRes = await this.db.getCollection('mkt_carts').findOneAndUpdate(
      { userId: new ObjectId(userId) },
      {
        $set: {
          items: formattedItems,
          updatedAt: now,
          schemaVersion: 1
        },
        $setOnInsert: {
          createdAt: now,
          createdBy: userId,
          deletedAt: null
        }
      },
      { upsert: true, returnDocument: 'after' }
    );

    return updateRes;
  }

  async createOrder(userId: string, data: { items: Array<{ productId: string; quantity: number }>; currency?: string; shippingAddress?: any }) {
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException({ code: 'ORDER_ITEMS_EMPTY', detail: 'Order must contain at least one item.' });
    }

    const currency = data.currency || 'INR';
    const now = new Date();

    // Fetch products
    const productIds = data.items.map(i => new ObjectId(i.productId));
    const products = await this.db.getCollection('mkt_products').find({ _id: { $in: productIds } }).toArray();

    const productMap = new Map(products.map(p => [String(p._id), p]));

    let subtotalMinor = 0;
    let taxMinor = 0;
    const orderItemsToInsert: any[] = [];

    const orderId = new ObjectId();
    const orderNo = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    for (const item of data.items) {
      const prod = productMap.get(item.productId);
      if (!prod) continue;
      const unitPriceMinor = prod.priceMinor;
      const lineTotalMinor = unitPriceMinor * item.quantity;
      const gstRate = (prod.gstRatePercent || 12.0) / 100.0;
      const lineTaxMinor = Math.round(lineTotalMinor * gstRate);

      subtotalMinor += lineTotalMinor;
      taxMinor += lineTaxMinor;

      orderItemsToInsert.push({
        _id: new ObjectId(),
        orderId,
        productId: prod._id,
        quantity: item.quantity,
        unitPriceMinor,
        totalMinor: lineTotalMinor,
        taxMinor: lineTaxMinor,
        hsnSac: prod.hsnSac || '9018',
        schemaVersion: 1,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        deletedAt: null
      });
    }

    const totalMinor = subtotalMinor + taxMinor;

    const orderDoc = {
      _id: orderId,
      orderNo,
      buyerId: new ObjectId(userId),
      totalMinor,
      subtotalMinor,
      taxMinor,
      currency,
      status: 'pending',
      shippingAddress: data.shippingAddress || null,
      billingAddress: data.shippingAddress || null,
      invoiceId: null,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      deletedAt: null
    };

    await this.db.getCollection('mkt_orders').insertOne(orderDoc);
    if (orderItemsToInsert.length > 0) {
      await this.db.getCollection('mkt_order_items').insertMany(orderItemsToInsert);
    }

    // Clear user cart
    await this.db.getCollection('mkt_carts').updateOne(
      { userId: new ObjectId(userId) },
      { $set: { items: [], updatedAt: now } }
    );

    // Section 7: "POST /mkt/orders creates mkt_orders (status pending) and a pay_payment_intents row; the gateway order is created with an idempotency key; INR goes to Razorpay, other currencies to Stripe."
    const gateway = currency === 'INR' ? 'razorpay' : 'stripe';
    const gatewayOrderId = gateway === 'razorpay'
      ? `order_rzp_${orderNo}`
      : `pi_stripe_${orderNo}`;

    const paymentIntentDoc = {
      _id: new ObjectId(),
      orderId,
      gateway,
      gatewayOrderId,
      amountMinor: totalMinor,
      currency,
      status: 'created',
      idempotencyKey: `mkt_order_${orderNo}`,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      deletedAt: null
    };

    await this.db.getCollection('pay_payment_intents').insertOne(paymentIntentDoc);

    return {
      order: orderDoc,
      paymentIntent: {
        id: String(paymentIntentDoc._id),
        gateway,
        gatewayOrderId,
        amountMinor: totalMinor,
        currency,
        key: gateway === 'razorpay' ? process.env.RAZORPAY_KEY_ID || 'rzp_test_sample' : 'pk_test_sample'
      }
    };
  }

  async getOrder(id: string) {
    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { orderNo: id };
    const order = await this.db.getCollection('mkt_orders').findOne(filter);
    if (!order) throw new NotFoundException({ code: 'ORDER_NOT_FOUND', detail: 'Order not found' });
    const items = await this.db.getCollection('mkt_order_items').find({ orderId: order._id }).toArray();
    return { ...order, items };
  }

  async getOrderInvoice(orderId: string) {
    const filter = ObjectId.isValid(orderId) ? { orderId: new ObjectId(orderId) } : { orderId };
    const invoice = await this.db.getCollection('pay_invoices').findOne(filter);
    if (!invoice) throw new NotFoundException({ code: 'INVOICE_NOT_FOUND', detail: 'Invoice not yet issued for this order' });
    return invoice;
  }
}
