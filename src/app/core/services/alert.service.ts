import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}

@Injectable({ providedIn: 'root' })
export class AlertService {
  readonly toasts = signal<Toast[]>([]);
  readonly confirmOptions = signal<ConfirmOptions | null>(null);

  showConfirm(options: ConfirmOptions): void {
    this.confirmOptions.set(options);
  }

  dismissConfirm(): void {
    this.confirmOptions.set(null);
  }

  acceptConfirm(): void {
    this.confirmOptions()?.onConfirm();
    this.confirmOptions.set(null);
  }

  toast(message: string, type: Toast['type'] = 'success'): void {
    const id = Date.now();
    this.toasts.update(t => [...t, { id, message, type }]);
    setTimeout(() => this.toasts.update(t => t.filter(x => x.id !== id)), 3500);
  }

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
