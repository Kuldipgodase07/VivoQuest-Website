export type Role =
  | 'patient'
  | 'caregiver'
  | 'nurse'
  | 'clinician'
  | 'remote-desk'
  | 'discharge-planner'
  | 'health-plan'
  | 'vaccination'
  | 'marketplace'
  | 'admin';

export interface UserSession {
  id: string;
  phone: string;
  name: string;
  role: Role;
  roles?: Role[];
  token?: string;
  isAuthenticated: boolean;
}

export interface TableColumn<T = any> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  inStock: boolean;
  requiresNurseApproval?: boolean;
}

export interface CartItem {
  product: ProductItem;
  quantity: number;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  items: CartItem[];
  status: 'Pending' | 'Approved' | 'Shipped' | 'Delivered' | 'Cancelled';
  customerName: string;
}
