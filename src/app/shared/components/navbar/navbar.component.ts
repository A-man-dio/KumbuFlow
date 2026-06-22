import { Component, inject, signal } from '@angular/core';
import { FlowService } from '../../../core/services/flow.service';
import { AlertService } from '../../../core/services/alert.service';

/**
 * Sticky top navigation bar.
 *
 * Contains:
 *   - KumbuFlow logo (left)
 *   - Current month badge (center, hidden on mobile ≤540px)
 *   - Help button ("Como funciona") + Reset button (right)
 *   - Help modal — fullscreen overlay explaining the envelope budgeting workflow
 *
 * The help modal is rendered inline (not via a portal) with z-index: 300,
 * above all page content and modals (z-index 200) but below toasts (z-index 1000).
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  private flowService = inject(FlowService);
  private alertService = inject(AlertService);

  /** Controls whether the help modal is visible. */
  showHelp = signal(false);

  /** Formatted month string for the center badge, e.g. "junho 2026". */
  get currentMonth(): string {
    return new Intl.DateTimeFormat('pt-AO', { month: 'long', year: 'numeric' }).format(new Date());
  }

  /** Prompts for confirmation before wiping all spending history for the month. */
  onReset(): void {
    this.alertService.showConfirm({
      title: 'Reset Mensal',
      message: 'Reiniciar todos os fluxos para o novo mês? Esta acção apaga todos os gastos registados.',
      confirmLabel: 'Reiniciar',
      danger: true,
      onConfirm: () => {
        this.flowService.resetMonthly();
        this.alertService.toast('Fluxos reiniciados para o novo mês.');
      },
    });
  }
}
