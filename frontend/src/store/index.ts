import { UserSession, Role, CartItem, ProductItem, OrderRecord } from '../types';

class Store {
  private listeners: Set<() => void> = new Set();
  
  public session: UserSession | null = null;
  public cart: CartItem[] = [];
  public lastOrder: OrderRecord | null = null;
  public currentCity: string = 'Mumbai';

  constructor() {
    if (typeof window !== 'undefined') {
      const savedSession = sessionStorage.getItem('vq_session') || localStorage.getItem('vq_session');
      if (savedSession) {
        try { this.session = JSON.parse(savedSession); } catch {}
      }
      const savedCart = sessionStorage.getItem('vq_cart') || localStorage.getItem('vq_cart');
      if (savedCart) {
        try { this.cart = JSON.parse(savedCart); } catch {}
      }
      const savedOrder = sessionStorage.getItem('vq_last_order') || localStorage.getItem('vq_last_order');
      if (savedOrder) {
        try { this.lastOrder = JSON.parse(savedOrder); } catch {}
      }
      const savedCity = sessionStorage.getItem('vq_city');
      if (savedCity) {
        this.currentCity = savedCity;
      }
    }
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  setCity(city: string) {
    this.currentCity = city;
    sessionStorage.setItem('vq_city', city);
    this.notify();
  }

  setSession(session: UserSession | null) {
    this.session = session;
    if (session) {
      sessionStorage.setItem('vq_session', JSON.stringify(session));
      localStorage.setItem('vq_session', JSON.stringify(session));
    } else {
      sessionStorage.removeItem('vq_session');
      sessionStorage.removeItem('vq_token');
      localStorage.removeItem('vq_session');
      localStorage.removeItem('vq_token');
    }
    this.notify();
  }

  setRole(role: Role): boolean {
    if (this.session) {
      const isAllowed =
        this.session.roles?.includes(role) ||
        this.session.roles?.includes('admin') ||
        this.session.role === 'admin';

      if (!isAllowed) {
        console.warn(`[RBAC] Access denied: User '${this.session.name}' cannot switch to role '${role}'.`);
        return false;
      }
      this.session = { ...this.session, role };
      sessionStorage.setItem('vq_session', JSON.stringify(this.session));
      localStorage.setItem('vq_session', JSON.stringify(this.session));
      this.notify();
      return true;
    }
    return false;
  }

  addToCart(product: ProductItem, quantity: number = 1) {
    const existing = this.cart.find(item => item.product.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.cart.push({ product, quantity });
    }
    sessionStorage.setItem('vq_cart', JSON.stringify(this.cart));
    this.notify();
  }

  removeFromCart(productId: string) {
    this.cart = this.cart.filter(item => item.product.id !== productId);
    sessionStorage.setItem('vq_cart', JSON.stringify(this.cart));
    this.notify();
  }

  clearCart() {
    this.cart = [];
    sessionStorage.removeItem('vq_cart');
    this.notify();
  }

  setLastOrder(order: OrderRecord) {
    this.lastOrder = order;
    sessionStorage.setItem('vq_last_order', JSON.stringify(order));
    this.notify();
  }
}

export const store = new Store();
