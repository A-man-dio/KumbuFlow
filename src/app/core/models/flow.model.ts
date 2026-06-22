export type TransactionCategory =
  | 'alimentação'
  | 'transporte'
  | 'saúde'
  | 'lazer'
  | 'utilidades'
  | 'vestuário'
  | 'outros';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: Date;
  category: string;
}

export interface Flow {
  id: string;
  name: string;
  icon: string;
  totalAmount: number;
  spentAmount: number;
  transactions: Transaction[];
  isActive: boolean;
}

export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  'alimentação': 'Alimentação',
  'transporte': 'Transporte',
  'saúde': 'Saúde',
  'lazer': 'Lazer',
  'utilidades': 'Utilidades',
  'vestuário': 'Vestuário',
  'outros': 'Outros',
};

export const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  'alimentação': '#22C55E',
  'transporte': '#3B82F6',
  'saúde': '#EC4899',
  'lazer': '#A855F7',
  'utilidades': '#F59E0B',
  'vestuário': '#14B8A6',
  'outros': '#6B7280',
};

export const CATEGORIES: TransactionCategory[] = [
  'alimentação', 'transporte', 'saúde', 'lazer', 'utilidades', 'vestuário', 'outros'
];
