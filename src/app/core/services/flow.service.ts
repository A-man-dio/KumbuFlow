import { Injectable, signal, computed } from '@angular/core';
import { Flow, Transaction, TransactionCategory } from '../models/flow.model';

const INITIAL_FLOWS: Flow[] = [
  {
    id: '1',
    name: 'Alimentação',
    icon: '🛒',
    totalAmount: 80000,
    spentAmount: 35000,
    isActive: true,
    transactions: [
      { id: 't1', description: 'Supermercado Kero', amount: 15000, date: new Date('2026-06-01'), category: 'Alimentação' },
      { id: 't2', description: 'Mercearia do Bairro', amount: 8000, date: new Date('2026-06-08'), category: 'Alimentação' },
      { id: 't3', description: 'Padaria Central', amount: 5000, date: new Date('2026-06-12'), category: 'Alimentação' },
      { id: 't4', description: 'Restaurante Lua Branca', amount: 7000, date: new Date('2026-06-18'), category: 'Alimentação' },
    ],
  },
  {
    id: '2',
    name: 'Renda',
    icon: '🏠',
    totalAmount: 150000,
    spentAmount: 150000,
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
      { id: 't6', description: 'Combustível', amount: 18000, date: new Date('2026-06-03'), category: 'Transporte' },
      { id: 't7', description: 'Táxi Express', amount: 5000, date: new Date('2026-06-10'), category: 'Transporte' },
      { id: 't8', description: 'Manutenção carro', amount: 5000, date: new Date('2026-06-15'), category: 'Transporte' },
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
      { id: 't9', description: 'Cinema Belas Arts', amount: 5000, date: new Date('2026-06-07'), category: 'Lazer' },
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
    transactions: [],
  },
];

@Injectable({ providedIn: 'root' })
export class FlowService {
  private _flows = signal<Flow[]>(INITIAL_FLOWS);
  private _cardBalance = signal<number>(460000); // sum of initial flows as default

  readonly cardBalance = this._cardBalance.asReadonly();

  readonly flows = computed(() => {
    const all = this._flows();
    const active = all.filter(f => f.isActive);
    const rest = all.filter(f => !f.isActive);
    return [...active, ...rest];
  });

  readonly totalBalance = computed(() =>
    this._flows().reduce((sum, f) => sum + Math.max(0, f.totalAmount - f.spentAmount), 0)
  );

  readonly totalAllocated = computed(() =>
    this._flows().reduce((sum, f) => sum + f.totalAmount, 0)
  );

  readonly availableToAllocate = computed(() =>
    Math.max(0, this._cardBalance() - this.totalAllocated())
  );

  readonly activeFlow = computed(() =>
    this._flows().find(f => f.isActive) ?? null
  );

  setCardBalance(amount: number): void {
    this._cardBalance.set(amount);
  }

  getFlowById(id: string): Flow | undefined {
    return this._flows().find(f => f.id === id);
  }

  activateFlow(id: string): void {
    this._flows.update(flows =>
      flows.map(f => ({ ...f, isActive: f.id === id }))
    );
  }

  deactivateAll(): void {
    this._flows.update(flows => flows.map(f => ({ ...f, isActive: false })));
  }

  addExpense(flowId: string, amount: number, description: string): void {
    this._flows.update(flows =>
      flows.map(f => {
        if (f.id !== flowId) return f;
        const newTx: Transaction = {
          id: `tx-${Date.now()}`,
          description,
          amount,
          date: new Date(),
          category: f.name,
        };
        return {
          ...f,
          spentAmount: Math.min(f.spentAmount + amount, f.totalAmount),
          transactions: [newTx, ...f.transactions],
        };
      })
    );
  }

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

  removeFlow(id: string): void {
    this._flows.update(flows => flows.filter(f => f.id !== id));
  }

  resetMonthly(): void {
    this._flows.update(flows =>
      flows.map(f => ({ ...f, spentAmount: 0, transactions: [], isActive: false }))
    );
  }
}
