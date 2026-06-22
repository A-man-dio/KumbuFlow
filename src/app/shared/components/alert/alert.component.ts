import { Component, inject } from '@angular/core';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-alert',
  standalone: true,
  template: `
    <!-- Toasts -->
    <div class="toast-stack">
      @for (toast of alertService.toasts(); track toast.id) {
        <div class="toast" [class]="'toast-' + toast.type">
          <span class="toast-icon">
            @switch (toast.type) {
              @case ('success') { ✓ }
              @case ('error') { ✕ }
              @case ('warning') { ⚠ }
              @default { ℹ }
            }
          </span>
          <span class="toast-msg">{{ toast.message }}</span>
        </div>
      }
    </div>

    <!-- Confirm dialog -->
    @if (alertService.confirmOptions(); as opts) {
      <div class="confirm-backdrop" (click)="alertService.dismissConfirm()">
        <div class="confirm-box" (click)="$event.stopPropagation()">
          <p class="confirm-title">{{ opts.title }}</p>
          <p class="confirm-msg">{{ opts.message }}</p>
          <div class="confirm-actions">
            <button class="confirm-cancel" (click)="alertService.dismissConfirm()">
              {{ opts.cancelLabel ?? 'Cancelar' }}
            </button>
            <button class="confirm-ok" [class.danger]="opts.danger" (click)="alertService.acceptConfirm()">
              {{ opts.confirmLabel ?? 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    /* ── Toasts ── */
    .toast-stack {
      position: fixed;
      top: 72px;
      right: 20px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 12px;
      font-family: 'Inter', sans-serif;
      font-size: 0.84rem;
      font-weight: 500;
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      animation: toast-in 0.3s cubic-bezier(0.22,1,0.36,1);
      max-width: 320px;

      &.toast-success {
        background: rgba(34,197,94,0.15);
        border: 1px solid rgba(34,197,94,0.3);
        color: #4ADE80;
      }
      &.toast-error {
        background: rgba(239,68,68,0.15);
        border: 1px solid rgba(239,68,68,0.3);
        color: #F87171;
      }
      &.toast-warning {
        background: rgba(234,179,8,0.15);
        border: 1px solid rgba(234,179,8,0.3);
        color: #FDE047;
      }
      &.toast-info {
        background: rgba(59,130,246,0.15);
        border: 1px solid rgba(59,130,246,0.3);
        color: #60A5FA;
      }
    }

    .toast-icon {
      font-size: 0.9rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .toast-msg { line-height: 1.4; }

    @keyframes toast-in {
      from { opacity: 0; transform: translateX(20px) scale(0.95); }
      to   { opacity: 1; transform: translateX(0) scale(1); }
    }

    /* ── Confirm dialog ── */
    .confirm-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.65);
      backdrop-filter: blur(6px);
      z-index: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: backdrop-in 0.15s ease;
    }

    .confirm-box {
      background: #111827;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 18px;
      padding: 28px 28px 24px;
      max-width: 380px;
      width: 100%;
      animation: scale-in 0.2s cubic-bezier(0.22,1,0.36,1);
    }

    .confirm-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.05rem;
      font-weight: 700;
      color: #F1F5F9;
      margin-bottom: 8px;
    }

    .confirm-msg {
      font-family: 'Inter', sans-serif;
      font-size: 0.85rem;
      color: #94A3B8;
      line-height: 1.55;
      margin-bottom: 24px;
    }

    .confirm-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }

    .confirm-cancel {
      padding: 9px 18px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 9px;
      color: #94A3B8;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
      &:hover { background: rgba(255,255,255,0.09); color: #F1F5F9; }
    }

    .confirm-ok {
      padding: 9px 20px;
      background: #3B82F6;
      border: none;
      border-radius: 9px;
      color: white;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s;
      &:hover { background: #2563EB; }
      &:active { transform: scale(0.97); }
      &.danger { background: #DC2626; &:hover { background: #B91C1C; } }
    }

    @keyframes backdrop-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    @keyframes scale-in {
      from { opacity: 0; transform: scale(0.93); }
      to   { opacity: 1; transform: scale(1); }
    }
  `]
})
export class AlertComponent {
  protected alertService = inject(AlertService);
}
