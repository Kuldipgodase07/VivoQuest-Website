import { useState, useEffect } from 'react';
import { store } from '../store';
import { CartItem, ProductItem } from '../types';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>(store.cart);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setCart([...store.cart]);
    });
    return () => { unsub(); };
  }, []);

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cart,
    count,
    total,
    addToCart: (p: ProductItem, q?: number) => store.addToCart(p, q),
    removeFromCart: (id: string) => store.removeFromCart(id),
    clearCart: () => store.clearCart()
  };
}
