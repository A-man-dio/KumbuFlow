import { Injectable, signal, computed } from '@angular/core';
import { Flow, Transaction, TransactionCategory } from '../models/flow.model';

/**
 * Pre-loaded demo data shown on first launch.
 * Covers a typical Angolan household budget for June 2026.
 * The card balance (460 000 Kz) equals the sum of all flow allocations.
 */
const INITIAL_FLOWS: Flow[] = [
  {
    id: '1',
    name: 'Alimentação',
    icon: '🛒',
    totalAmount: 80000,
    spentAmount: 35000,
    isActive: true, // starts as the active flow so new users see the FAB immediately
    transactions: [
      { id: 't1', description: 'Supermercado Kero',     amount: 15000, date: new Date('2026-06-01'), category: 'Alimentação' },
      { id: 't2', description: 'Mercearia do Bairro',   amount: 8000,  date: new Date('2026-06-08'), category: 'Alimentação' },
      { id: 't3', description: 'Padaria Central',       amount: 5000,  date: new Date('2026-06-12'), category: 'Alimentação' },
      { id: 't4', description: 'Restaurante Lua Branca',amount: 7000,  date: new Date('2026-06-18'), category: 'Alimentação' },
    ],
  },
  {
    id: '2',
    name: 'Renda',
    icon: '🏠',
    totalAmount: 150000,
    spentAmount: 150000, // fully spent — demonstrates the 100% / red water state
    isActive: false,
    transactions: [
      { id: 't5', description: 'Renda de Junho', amount: 150000, date: new Date('2026-06-01'), category: 'Renda' },
    ],
  },
  {
    id: '3',
    name: 'Transporte',
    icon: '🚗',
    totalAmount: 40000,
    spentAmount: 28000,
    isActive: false,
    transactions: [
      { id: 't6', description: 'Combustível',       amount: 18000, date: new Date('2026-06-03'), category: 'Transporte' },
      { id: 't7', description: 'Táxi Express',      amount: 5000,  date: new Date('2026-06-10'), category: 'Transporte' },
      { id: 't8', description: 'Manutenção carro',  amount: 5000,  date: new Date('2026-06-15'), category: 'Transporte' },
    ],
  },
  {
    id: '4',
    name: 'Lazer',
    icon: '🎉',
    totalAmount: 60000,
    spentAmount: 12000,
    isActive: false,
    transactions: [
      { id: 't9',  description: 'Cinema Belas Arts', amount: 5000, date: new Date('2026-06-07'), category: 'Lazer' },
      { id: 't10', description: 'Jantar em família', amount: 7000, date: new Date('2026-06-14'), category: 'Lazer' },
    ],
  },
  {
    id: '5',
    name: 'Saúde',
    icon: '💊',
    totalAmount: 30000,
    spentAmount: 4500,
    isActive: false,
    transactions: [
      { id: 't11', description: 'Farmácia Angola', amount: 4500, date: new Date('2026-06-09'), category: 'Saúde' },
    ],
  },
  {
    id: '6',
    name: 'Poupança',
    icon: '💰',
    totalAmount: 100000,
    spentAmount: 0,
    isActive: false,
    transactions: [], // no expenses yet — demonstrates the 100% green / full water state
  },
];

/**
 * Central state manager for all financial data.
 *
 * Uses Angular Signals for reactive state: any component that reads a
 * signal (or computed) in its template is automatically re-rendered when
 * the underlying value changes — no manual subscriptions needed.
 *
 * All mutations are pure immutable updates (map/filter spread) so Angular's
 * change detection can efficiently detect which flows actually changed.
 */
@Injectable({ providedIn: 'root' })
export class FlowService {
  /** Source of truth for all flows. Private — mutated only through methods. */
  private _flows = signal<Flow[]>(INITIAL_FLOWS);

  /**
   * Total money the user has on their card / bank account.
   * All flow allocations must stay within this ceiling.
   */
  private _cardBalance = signal<number>(460000);

  /** Read-only view of the card balance for components. */
  readonly cardBalance = this._cardBalance.asReadonly();

  /**
   * Flows sorted so the active one always appears first in the grid.
   * Components should consume this instead of the raw _flows signal.
   */
  readonly flows = computed(() => {
    const all = this._flows();
    return [...all.filter(f => f.isActive), ...all.filter(f => !f.isActive)];
  });

  /** Sum of (totalAmount - spentAmount) across all flows — total unspent money. */
  readonly totalBalance = computed(() =>
    this._flows().reduce((sum, f) => sum + Math.max(0, f.totalAmount - f.spentAmount), 0)
  );

  /** Sum of all flow budgets — money already assigned to an envelope. */
  readonly totalAllocated = computed(() =>
    this._flows().reduce((sum, f) => sum + f.totalAmount, 0)
  );

  /**
   * Money in the card that has not yet been assigned to any flow.
   * New flows can only be created if this is greater than zero.
   * Clamped at 0 to prevent negative values if the card balance is edited down.
   */
  readonly availableToAllocate = computed(() =>
    Math.max(0, this._cardBalance() - this.totalAllocated())
  );

  /** The currently active flow, or null if none is active. */
  readonly activeFlow = computed(() =>
    this._flows().find(f => f.isActive) ?? null
  );

  // ── Mutations ──────────────────────────────────────────────────────────────

  /** Updates the card balance ceiling. Validation is done in the component. */
  setCardBalance(amount: number): void {
    this._cardBalance.set(amount);
  }

  /** Finds a single flow by ID. Returns undefined if not found. */
  getFlowById(id: string): Flow | undefined {
    return this._flows().find(f => f.id === id);
  }

  /**
   * Marks one flow as active and deactivates all others.
   * Only one flow can be active at a time — the FAB registers expenses
   * into whichever flow has isActive === true.
   */
  activateFlow(id: string): void {
    this._flows.update(flows => flows.map(f => ({ ...f, isActive: f.id === id })));
  }

  /** Deactivates all flows. The FAB becomes disabled until one is re-activated. */
  deactivateAll(): void {
    this._flows.update(flows => flows.map(f => ({ ...f, isActive: false })));
  }

  /**
   * Records a new expense against a flow.
   *
   * The transaction category is set to the flow name (not user-selectable)
   * so that the detail chart can group expenses by flow category automatically.
   *
   * spentAmount is capped at totalAmount with Math.min to prevent accidental
   * overspend at the data level, even though the component validates first.
   *
   * New transactions are prepended so the history shows newest-first.
   */
  addExpense(flowId: string, amount: number, description: string): void {
    this._flows.update(flows =>
      flows.map(f => {
        if (f.id !== flowId) return f;
        const newTx: Transaction = {
          id: `tx-${Date.now()}`,
          description,
          amount,
          date: new Date(),
          category: f.name, // auto-set to flow name for chart grouping
        };
        return {
          ...f,
          spentAmount: Math.min(f.spentAmount + amount, f.totalAmount),
          transactions: [newTx, ...f.transactions],
        };
      })
    );
  }

  /**
   * Creates a new flow and appends it to the list.
   *
   * Returns an error string if the requested allocation exceeds the free
   * balance, or null on success. Components display this string in the form.
   */
  createFlow(name: string, icon: string, totalAmount: number): string | null {
    if (totalAmount > this.availableToAllocate()) {
      return `Saldo insuficiente. Tens ${new Intl.NumberFormat('pt-PT').format(this.availableToAllocate())} Kz livres para alocar.`;
    }
    const newFlow: Flow = {
      id: `flow-${Date.now()}`,
      name,
      icon,
      totalAmount,
      spentAmount: 0,
      transactions: [],
      isActive: false,
    };
    this._flows.update(flows => [...flows, newFlow]);
    return null;
  }

  /**
   * Removes a single transaction and refunds its amount back to spentAmount.
   * Math.max(0, ...) guards against negative spentAmount in edge cases.
   */
  removeExpense(flowId: string, txId: string): void {
    this._flows.update(flows =>
      flows.map(f => {
        if (f.id !== flowId) return f;
        const tx = f.transactions.find(t => t.id === txId);
        if (!tx) return f;
        return {
          ...f,
          spentAmount: Math.max(0, f.spentAmount - tx.amount),
          transactions: f.transactions.filter(t => t.id !== txId),
        };
      })
    );
  }

  /**
   * Changes a flow's allocated budget.
   *
   * Validation rules:
   *   - newAmount >= spentAmount  (can't allocate less than already spent)
   *   - newAmount <= currentAmount + availableToAllocate  (can't exceed free balance)
   *
   * Returns an error string on failure, null on success.
   */
  updateFlowAllocation(flowId: string, newAmount: number): string | null {
    const flow = this._flows().find(f => f.id === flowId);
    if (!flow) return 'Fluxo não encontrado.';

    if (newAmount < flow.spentAmount) {
      return `O valor mínimo é ${new Intl.NumberFormat('pt-PT').format(flow.spentAmount)} Kz (valor já gasto).`;
    }

    const maxAmount = flow.totalAmount + this.availableToAllocate();
    if (newAmount > maxAmount) {
      return `O valor máximo é ${new Intl.NumberFormat('pt-PT').format(maxAmount)} Kz.`;
    }

    this._flows.update(flows =>
      flows.map(f => f.id === flowId ? { ...f, totalAmount: newAmount } : f)
    );
    return null;
  }

  /** Permanently removes a flow and frees its allocated budget. */
  removeFlow(id: string): void {
    this._flows.update(flows => flows.filter(f => f.id !== id));
  }

  /**
   * Monthly reset: clears all spending history and deactivates all flows
   * while keeping the flow structure (names, icons, allocations) intact.
   * Called from the navbar "Reset Mensal" button after user confirmation.
   */
  resetMonthly(): void {
    this._flows.update(flows =>
      flows.map(f => ({ ...f, spentAmount: 0, transactions: [], isActive: false }))
    );
  }
}
