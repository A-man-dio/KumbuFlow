import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FlowService } from '../../core/services/flow.service';
import { AlertService } from '../../core/services/alert.service';
import { FlowCardComponent } from '../../shared/components/flow-card/flow-card.component';
import { KzPipe } from '../../shared/pipes/kz.pipe';

/**
 * Main screen of the app — shows the card balance hero, all flow cards,
 * and the FAB for registering expenses against the active flow.
 *
 * State managed here:
 *   - showModal / showCreateModal / showBalanceModal — which modal is open
 *   - fabSuccess — drives the green checkmark animation on the FAB
 *   - Inline form field values (expenseAmount, newFlowName, etc.)
 *
 * All persistent state (flows, balance) lives in FlowService.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FlowCardComponent, KzPipe, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  protected flowService = inject(FlowService);
  private router = inject(Router);
  private alertService = inject(AlertService);

  /** Expense modal visibility + validation error. */
  showModal = signal(false);
  modalError = signal('');

  /** FAB turns green with a checkmark for 1.4 s after a successful expense. */
  fabSuccess = signal(false);

  /** Create Flow modal visibility + validation error. */
  showCreateModal = signal(false);
  createError = signal('');

  /** Edit Card Balance modal visibility + validation error. */
  showBalanceModal = signal(false);
  balanceError = signal('');

  // Expense form fields
  expenseAmount: number | null = null;
  expenseDescription = '';

  // Create flow form fields
  newFlowName = '';
  newFlowIcon = '💰';
  newFlowAmount: number | null = null;

  // Edit balance form field
  balanceInput: number | null = null;

  /** All emoji options shown in the icon picker grid when creating a flow. */
  readonly iconOptions = [
    '🏠','🛒','🚗','🎉','💊','💰','✈️','👗',
    '📚','🎮','🏥','💡','🍽️','🎵','📱','💻',
    '🏋️','🌟','🎓','🏖️','🎁','⚡','🔧','🐾',
  ];

  /** Percentage of the card balance already allocated across all flows. */
  get allocPct(): number {
    const cb = this.flowService.cardBalance();
    if (!cb) return 0;
    return Math.min(100, Math.round((this.flowService.totalAllocated() / cb) * 100));
  }

  /** Total number of flows, displayed in the section header badge. */
  get flowCount(): number {
    return this.flowService.flows().length;
  }

  onActivate(id: string): void {
    this.flowService.activateFlow(id);
  }

  onDeactivate(): void {
    this.flowService.deactivateAll();
  }

  onViewDetails(id: string): void {
    this.router.navigate(['/flow', id]);
  }

  onRemove(id: string): void {
    const flow = this.flowService.getFlowById(id);
    if (!flow) return;
    this.alertService.showConfirm({
      title: `Remover "${flow.name}"`,
      message: 'Esta acção é irreversível. Todos os gastos registados neste fluxo serão eliminados.',
      confirmLabel: 'Remover',
      danger: true,
      onConfirm: () => {
        this.flowService.removeFlow(id);
        this.alertService.toast(`Fluxo "${flow.name}" removido.`, 'info');
      },
    });
  }

  openBalanceModal(): void {
    this.balanceInput = this.flowService.cardBalance() || null;
    this.balanceError.set('');
    this.showBalanceModal.set(true);
  }

  closeBalanceModal(): void {
    this.showBalanceModal.set(false);
  }

  submitBalance(): void {
    if (!this.balanceInput || this.balanceInput <= 0) {
      this.balanceError.set('Introduz um valor válido.');
      return;
    }
    if (this.balanceInput < this.flowService.totalAllocated()) {
      this.balanceError.set(`O saldo não pode ser inferior ao total já alocado (${new Intl.NumberFormat('pt-PT').format(this.flowService.totalAllocated())} Kz).`);
      return;
    }
    this.flowService.setCardBalance(this.balanceInput);
    this.closeBalanceModal();
    this.alertService.toast('Saldo do cartão actualizado.');
  }

  openCreateModal(): void {
    this.newFlowName = '';
    this.newFlowIcon = '💰';
    this.newFlowAmount = null;
    this.createError.set('');
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  submitCreate(): void {
    if (!this.newFlowName.trim()) {
      this.createError.set('Introduz um nome para o fluxo.');
      return;
    }
    if (!this.newFlowAmount || this.newFlowAmount <= 0) {
      this.createError.set('Introduz um valor alocado válido.');
      return;
    }
    const error = this.flowService.createFlow(this.newFlowName.trim(), this.newFlowIcon, this.newFlowAmount);
    if (error) {
      this.createError.set(error);
      return;
    }
    this.alertService.toast(`Fluxo "${this.newFlowName.trim()}" criado com sucesso!`);
    this.closeCreateModal();
  }

  openExpenseModal(): void {
    if (!this.flowService.activeFlow()) return;
    this.expenseAmount = null;
    this.expenseDescription = '';
    this.modalError.set('');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  submitExpense(): void {
    const active = this.flowService.activeFlow();
    if (!active) return;

    if (!this.expenseAmount || this.expenseAmount <= 0) {
      this.modalError.set('Introduz um valor válido.');
      return;
    }
    if (!this.expenseDescription.trim()) {
      this.modalError.set('Introduz uma descrição.');
      return;
    }
    const remaining = active.totalAmount - active.spentAmount;
    if (this.expenseAmount > remaining) {
      this.modalError.set(`Valor superior ao disponível (${new Intl.NumberFormat('pt-PT').format(remaining)} Kz).`);
      return;
    }

    // Capture percentage before the expense to detect threshold crossings
    const prevPct = Math.round((active.spentAmount / active.totalAmount) * 100);
    this.flowService.addExpense(active.id, this.expenseAmount, this.expenseDescription.trim());
    const updated = this.flowService.getFlowById(active.id)!;
    const newPct = Math.round((updated.spentAmount / updated.totalAmount) * 100);
    this.alertService.checkSpendingThreshold(active.name, newPct, prevPct);

    // FAB success animation: green for 1.4 s
    this.fabSuccess.set(true);
    setTimeout(() => this.fabSuccess.set(false), 1400);
    this.closeModal();
  }
}
