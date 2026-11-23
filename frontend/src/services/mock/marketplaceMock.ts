import { ProductItem } from '../../types';

export const mockCatalog: ProductItem[] = [
  { id: "prod_01", name: "Digital Blood Pressure Monitor (Bluetooth)", category: "Diagnostics", price: 1899, description: "Clinically certified upper-arm BP monitor with automatic cloud sync.", inStock: true },
  { id: "prod_02", name: "Clinical Finger Pulse Oximeter", category: "Diagnostics", price: 999, description: "High-precision SpO2 and pulse rate monitor with OLED display.", inStock: true },
  { id: "prod_03", name: "5L Medical Oxygen Concentrator", category: "Respiratory", price: 34999, description: "Continuous flow medical grade 93% pure oxygen concentrator.", inStock: true, requiresNurseApproval: true },
  { id: "prod_04", name: "Lightweight Folding Wheelchair", category: "Mobility", price: 5499, description: "Ergonomic aluminum frame wheelchair with dual handbrakes.", inStock: true },
  { id: "prod_05", name: "Advanced Post-Surgical Wound Dressing Kit", category: "Wound Care", price: 799, description: "Sterile silver antimicrobial dressings and saline cleansing solution.", inStock: true, requiresNurseApproval: true },
  { id: "prod_06", name: "Adult Influenza Quadrivalent Vaccine Dose", category: "Vaccines", price: 1450, description: "Annual flu protection administered at home by certified nurse.", inStock: true, requiresNurseApproval: true }
];
