/**
 * Domain models and lookup tables for KumbuFlow.
 *
 * The app uses an "envelope budgeting" model: a user distributes a fixed
 * card balance across named Flows (envelopes). Each Flow tracks how much
 * has been spent via a list of Transactions.
 */

/**
 * Legacy category type kept for the colour/label lookup tables below.
 * New transactions do NOT use this enum — their category is set to the
 * Flow's name directly (e.g. "Alimentação") so the detail page can group
 * them by flow without extra configuration.
 */
export type TransactionCategory =
  | 'alimentação'
  | 'transporte'
  | 'saúde'
  | 'lazer'
  | 'utilidades'
  | 'vestuário'
  | 'outros';

/** A single expense entry recorded inside a Flow. */
export interface Transaction {
  id: string;
  description: string;
  /** Amount in Kwanza (whole numbers only — no cents). */
  amount: number;
  date: Date;
  /**
   * Category string used for chart grouping and colour lookup.
   * For all new transactions this equals the parent Flow's name,
   * so the chart automatically groups by flow category.
   */
  category: string;
}

/**
 * A spending envelope — the core data unit of the app.
 *
 * Invariant: spentAmount should never exceed totalAmount.
 * FlowService enforces this with Math.min() when recording expenses.
 */
export interface Flow {
  id: string;
  /** Display name, also used as the transaction category label. */
  name: string;
  /** Emoji icon chosen by the user when creating the flow. */
  icon: string;
  /** Budget ceiling allocated from the card balance. */
  totalAmount: number;
  /** Running total of all recorded expenses. */
  spentAmount: number;
  transactions: Transaction[];
  /** Only one flow can be active at a time — enforced by FlowService. */
  isActive: boolean;
}

/**
 * Human-readable labels for the legacy category type.
 * Used to display category names in the chart legend.
 */
export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  'alimentação': 'Alimentação',
  'transporte': 'Transporte',
  'saúde': 'Saúde',
  'lazer': 'Lazer',
  'utilidades': 'Utilidades',
  'vestuário': 'Vestuário',
  'outros': 'Outros',
};

/**
 * Colour palette for each category, used in the doughnut chart and legend dots.
 * Colours are designed for good contrast on the dark (#080C14) background.
 */
export const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  'alimentação': '#22C55E',
  'transporte': '#3B82F6',
  'saúde': '#EC4899',
  'lazer': '#A855F7',
  'utilidades': '#F59E0B',
  'vestuário': '#14B8A6',
  'outros': '#6B7280',
};

/** Ordered list of all category keys, useful for iteration. */
export const CATEGORIES: TransactionCategory[] = [
  'alimentação', 'transporte', 'saúde', 'lazer', 'utilidades', 'vestuário', 'outros',
];
