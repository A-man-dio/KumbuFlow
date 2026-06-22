import { Injectable, signal } from '@angular/core';

/** Represents a single transient notification displayed in the toast stack. */
export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

/** Configuration for a blocking confirmation dialog. */
export interface ConfirmOptions {
  title: string;
  message: string;
  /** Label for the confirm button. Defaults to "Confirmar". */
  confirmLabel?: string;
  /** Label for the cancel button. Defaults to "Cancelar". */
  cancelLabel?: string;
  /** When true, the confirm button is styled in red to indicate a destructive action. */
  danger?: boolean;
  /** Callback invoked when the user clicks the confirm button. */
  onConfirm: () => void;
}

/**
 * Global UI notification service.
 *
 * Provides two notification primitives:
 *   1. Toasts — short-lived banners that auto-dismiss after 3.5 s.
 *   2. Confirm dialogs — blocking modal that requires explicit user action.
 *
 * Both use Angular Signals so the AlertComponent re-renders reactively
 * without any manual change detection.
 */
@Injectable({ providedIn: 'root' })
export class AlertService {
  /** Live list of active toasts. AlertComponent renders this array. */
  readonly toasts = signal<Toast[]>([]);

  /**
   * When non-null, AlertComponent shows the confirm dialog overlay.
   * Setting this back to null dismisses the dialog.
   */
  readonly confirmOptions = signal<ConfirmOptions | null>(null);

  /** Opens a blocking confirm dialog with the given options. */
  showConfirm(options: ConfirmOptions): void {
    this.confirmOptions.set(options);
  }

  /** Closes the confirm dialog without executing the onConfirm callback. */
  dismissConfirm(): void {
    this.confirmOptions.set(null);
  }

  /** Executes the onConfirm callback and then closes the dialog. */
  acceptConfirm(): void {
    this.confirmOptions()?.onConfirm();
    this.confirmOptions.set(null);
  }

  /**
   * Adds a toast notification that auto-dismisses after 3500 ms.
   * Multiple toasts stack vertically in the top-right corner.
   */
  toast(message: string, type: Toast['type'] = 'success'): void {
    const id = Date.now();
    this.toasts.update(t => [...t, { id, message, type }]);
    setTimeout(() => this.toasts.update(t => t.filter(x => x.id !== id)), 3500);
  }

  /**
   * Checks whether a new expense pushed a flow's spending past a budget
   * threshold (80 %, 90 %, or 100 %) and fires a warning toast if so.
   *
   * Only triggers when the threshold is newly crossed — comparing the
   * percentage before (prevPct) and after (newPct) the expense — so the
   * user is not spammed with repeated alerts.
   */
  checkSpendingThreshold(flowName: string, newPct: number, prevPct: number): void {
    if (newPct >= 100 && prevPct < 100) {
      this.toast(`${flowName}: orçamento esgotado!`, 'error');
    } else if (newPct >= 90 && prevPct < 90) {
      this.toast(`${flowName}: 90% do orçamento utilizado`, 'warning');
    } else if (newPct >= 80 && prevPct < 80) {
      this.toast(`${flowName}: 80% do orçamento utilizado`, 'warning');
    }
  }
}
