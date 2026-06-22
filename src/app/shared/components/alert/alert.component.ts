import { Component, inject } from '@angular/core';
import { AlertService } from '../../../core/services/alert.service';

/**
 * Global overlay component for notifications.
 *
 * Renders two UI layers on top of all page content:
 *   1. Toast stack — ephemeral banners in the top-right corner.
 *   2. Confirm dialog — a blocking modal that requires the user to choose.
 *
 * Placed once in <app-root> so it sits above every routed page. It reads
 * directly from AlertService's signals and re-renders automatically when
 * the signal values change.
 *
 * z-index hierarchy:
 *   page content  → 0
 *   page modals   → 200
 *   confirm dialog→ 500
 *   toasts        → 1000  (always visible above everything)
 */
@Component({
  selector: 'app-alert',
  standalone: true,
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.scss',
})
export class AlertComponent {
  /** Exposed as protected so the template can access service methods directly. */
  protected alertService = inject(AlertService);
}
