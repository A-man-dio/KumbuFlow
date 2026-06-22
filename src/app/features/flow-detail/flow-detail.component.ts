import {
  Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, inject, signal, computed
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';
import { FlowService } from '../../core/services/flow.service';
import { AlertService } from '../../core/services/alert.service';
import { Flow, CATEGORY_COLORS, CATEGORY_LABELS } from '../../core/models/flow.model';
import { KzPipe } from '../../shared/pipes/kz.pipe';

// Register only the Chart.js components we actually use — keeps the bundle smaller
Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

/**
 * Detail page for a single Flow envelope.
 *
 * Displays:
 *   - Header (icon, name, active chip, allocation button)
 *   - 4-column stats grid (allocated, spent, remaining, % used)
 *   - Doughnut chart with a custom 'outerArc' tooltip positioner so the
 *     tooltip appears outside the ring instead of overlapping the center %
 *   - Full transaction history with per-item delete
 *   - Modals: change allocation, add expense
 *
 * The flow signal is computed from the route param + FlowService, so
 * the page re-renders automatically when a transaction is added or removed.
 */
@Component({
  selector: 'app-flow-detail',
  standalone: true,
  imports: [KzPipe, FormsModule],
  templateUrl: './flow-detail.component.html',
  styleUrl: './flow-detail.component.scss',
})
export class FlowDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  /** Reference to the <canvas> element used by Chart.js. */
  @ViewChild('chartCanvas') chartCanvas?: ElementRef<HTMLCanvasElement>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  protected flowService = inject(FlowService);
  private alertService = inject(AlertService);

  /** The flow ID extracted from the route parameter (/flow/:id). */
  private flowId = signal('');

  /** Chart.js instance — stored so it can be destroyed on component teardown. */
  private chart?: Chart;

  // Allocation modal state
  showAllocModal = signal(false);
  allocInput: number | null = null;
  allocError = signal('');

  // Add expense modal state
  showAddExpenseModal = signal(false);
  expenseAmount: number | null = null;
  expenseDescription = '';
  expenseError = signal('');
  private activeFlowId = '';

  /**
   * Reactive view of the current flow.
   * Updates automatically when FlowService mutates the flows signal
   * (e.g., after adding an expense or changing the allocation).
   */
  readonly flow = computed(() => this.flowService.getFlowById(this.flowId()));

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.flowId.set(id);
    // Redirect to dashboard if the flow ID does not exist
    if (!this.flowService.getFlowById(id)) {
      this.router.navigate(['/']);
    }
  }

  /** Build the chart after the view is initialised so the canvas element exists. */
  ngAfterViewInit(): void {
    this.buildChart();
  }

  /** Destroy the Chart.js instance to release the canvas and avoid memory leaks. */
  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  openAllocModal(f: Flow): void {
    this.allocInput = f.totalAmount;
    this.allocError.set('');
    this.showAllocModal.set(true);
  }

  closeAllocModal(): void {
    this.showAllocModal.set(false);
  }

  openAddExpenseModal(f: Flow): void {
    this.activeFlowId = f.id;
    this.expenseAmount = null;
    this.expenseDescription = '';
    this.expenseError.set('');
    this.showAddExpenseModal.set(true);
  }

  closeAddExpenseModal(): void {
    this.showAddExpenseModal.set(false);
  }

  submitExpense(flowId: string, available: number): void {
    if (!this.expenseAmount || this.expenseAmount <= 0) {
      this.expenseError.set('Introduz um valor válido.');
      return;
    }
    if (!this.expenseDescription.trim()) {
      this.expenseError.set('Introduz uma descrição.');
      return;
    }
    if (this.expenseAmount > available) {
      this.expenseError.set(`Valor superior ao disponível (${new Intl.NumberFormat('pt-PT').format(available)} Kz).`);
      return;
    }
    const f = this.flow()!;
    const prevPct = Math.round((f.spentAmount / f.totalAmount) * 100);
    this.flowService.addExpense(flowId, this.expenseAmount, this.expenseDescription.trim());
    const updated = this.flowService.getFlowById(flowId)!;
    const newPct = Math.round((updated.spentAmount / updated.totalAmount) * 100);
    this.alertService.checkSpendingThreshold(f.name, newPct, prevPct);
    this.alertService.toast('Gasto registado com sucesso.');
    this.closeAddExpenseModal();
  }

  onRemoveExpense(flowId: string, txId: string, desc: string, amount: number): void {
    this.alertService.showConfirm({
      title: 'Remover Gasto',
      message: `Remover "${desc}" (${new Intl.NumberFormat('pt-PT').format(amount)} Kz)? O valor voltará ao saldo do fluxo.`,
      confirmLabel: 'Remover',
      danger: true,
      onConfirm: () => {
        this.flowService.removeExpense(flowId, txId);
        this.alertService.toast('Gasto removido.', 'info');
      },
    });
  }

  submitAlloc(flowId: string): void {
    if (!this.allocInput || this.allocInput <= 0) {
      this.allocError.set('Introduz um valor válido.');
      return;
    }
    const error = this.flowService.updateFlowAllocation(flowId, this.allocInput);
    if (error) {
      this.allocError.set(error);
      return;
    }
    this.alertService.toast('Alocação actualizada com sucesso.');
    this.closeAllocModal();
  }

  /** Percentage of the budget already spent. */
  usedPct(f: Flow): number {
    if (f.totalAmount === 0) return 0;
    return Math.round((f.spentAmount / f.totalAmount) * 100);
  }

  /** Percentage of the budget still remaining (always ≥ 0). */
  remainingPct(f: Flow): number {
    if (f.totalAmount === 0) return 0;
    return Math.max(0, 100 - this.usedPct(f));
  }

  /** Resolves a transaction category string to its chart colour. */
  catColor(cat: string): string {
    return (CATEGORY_COLORS as Record<string, string>)[cat] ?? '#3B82F6';
  }

  /** Resolves a transaction category string to its display label. */
  catLabel(cat: string): string {
    return (CATEGORY_LABELS as Record<string, string>)[cat] ?? cat;
  }

  /** Formats a Date object to a localised string, e.g. "1 jun. 2026". */
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-AO', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
  }

  /** Aggregates transactions by category for the chart legend below the doughnut. */
  chartLegend(f: Flow): { label: string; amount: number; color: string }[] {
    const totals: Record<string, number> = {};
    for (const tx of f.transactions) {
      totals[tx.category] = (totals[tx.category] ?? 0) + tx.amount;
    }
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount]) => ({
        label: (CATEGORY_LABELS as Record<string, string>)[cat] ?? cat,
        amount,
        color: (CATEGORY_COLORS as Record<string, string>)[cat] ?? '#3B82F6',
      }));
  }

  /**
   * Initialises the Chart.js doughnut chart for this flow.
   *
   * Custom tooltip positioner 'outerArc':
   *   Calculates the mid-angle of the clicked arc and positions the tooltip
   *   20 px beyond the arc's outer radius. This prevents the tooltip from
   *   overlapping the centre percentage text that Chart.js would otherwise cover.
   *
   * overflow: visible is set on .chart-section and .chart-wrap in the SCSS
   * so the tooltip is not clipped when it appears outside the canvas bounds.
   */
  private buildChart(): void {
    const f = this.flow();
    if (!f || !this.chartCanvas || f.transactions.length === 0) return;

    // Register the positioner once — guard prevents duplicate registration
    if (!(Tooltip.positioners as any)['outerArc']) {
      (Tooltip.positioners as any)['outerArc'] = function(this: any, elements: any[]) {
        if (!elements.length) return false;
        const arc = elements[0].element as any;
        const midAngle = (arc.startAngle + arc.endAngle) / 2;
        const r = arc.outerRadius + 20;
        return { x: arc.x + Math.cos(midAngle) * r, y: arc.y + Math.sin(midAngle) * r };
      };
    }

    // Aggregate transaction amounts by category
    const totals: Record<string, number> = {};
    for (const tx of f.transactions) {
      totals[tx.category] = (totals[tx.category] ?? 0) + tx.amount;
    }

    const remaining = Math.max(0, f.totalAmount - f.spentAmount);
    const labels = [
      ...Object.keys(totals).map(c => (CATEGORY_LABELS as Record<string, string>)[c] ?? c),
      'Restante',
    ];
    const data = [...Object.values(totals), remaining];
    const colors = [
      ...Object.keys(totals).map(c => (CATEGORY_COLORS as Record<string, string>)[c] ?? '#3B82F6'),
      'rgba(255,255,255,0.07)', // subtle slice for remaining budget
    ];

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderColor: '#080C14',
          borderWidth: 3,
          hoverBorderWidth: 4,
          hoverBorderColor: '#111827',
        }],
      },
      options: {
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            position: 'outerArc' as any,
            backgroundColor: '#111827',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            titleFont: { family: 'Space Grotesk', weight: 'bold' },
            bodyFont: { family: 'JetBrains Mono' },
            callbacks: {
              label: ctx => ` ${new Intl.NumberFormat('pt-PT').format(ctx.raw as number)} Kz`,
            },
          },
        },
        animation: { animateRotate: true, duration: 900 },
      },
    });
  }
}
