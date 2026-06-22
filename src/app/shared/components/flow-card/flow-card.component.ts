import {
  Component, Input, Output, EventEmitter, OnInit, OnChanges,
  OnDestroy, SimpleChanges, HostListener, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { Flow } from '../../../core/models/flow.model';
import { KzPipe } from '../../pipes/kz.pipe';

/**
 * Module-level signal shared across every FlowCardComponent instance.
 *
 * Stores the ID of whichever card currently has its action menu open,
 * or null when all menus are closed. Because this lives outside any class,
 * all instances read and write the same value — guaranteeing that opening
 * one card's menu automatically closes every other card's menu without
 * needing a parent component to coordinate.
 */
const activeCardMenuId = signal<string | null>(null);

/** Bubble animation parameters, computed once and reused across renders. */
interface Bubble {
  id: number;
  x: number;       // horizontal position (% of card width)
  size: number;    // diameter in px
  duration: number;// rise animation duration in seconds
  delay: number;   // initial animation delay in seconds
}

/**
 * Visual "aquarium" card for a single Flow envelope.
 *
 * The card has two layers:
 *   - Water fill (z-index 1): animated rising water that reflects the
 *     remaining budget percentage. The water colour shifts from green →
 *     yellow → orange → red as the budget is consumed.
 *   - Card content (z-index 10): percentage counter, name, icon, and
 *     remaining amount. pointer-events: none so clicks pass through to
 *     the card element and trigger the action menu.
 *
 * OnPush change detection is safe here because all reactive state either
 * comes from the @Input() flow (triggering ngOnChanges) or from signals
 * (which Angular tracks automatically at the template level).
 */
@Component({
  selector: 'app-flow-card',
  standalone: true,
  imports: [KzPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // 'display: block' is required so the card fills its CSS grid cell.
  // Custom elements default to 'display: inline', which would cause
  // asymmetric column widths in the two-column flow grid.
  host: { style: 'display: block;' },
  templateUrl: './flow-card.component.html',
  styleUrl: './flow-card.component.scss',
})
export class FlowCardComponent implements OnInit, OnChanges, OnDestroy {
  /** The flow data to render. Updated by the parent dashboard on any state change. */
  @Input() flow!: Flow;

  @Output() activate    = new EventEmitter<string>(); // emits flow ID
  @Output() deactivate  = new EventEmitter<void>();
  @Output() viewDetails = new EventEmitter<string>(); // emits flow ID
  @Output() remove      = new EventEmitter<string>(); // emits flow ID

  /**
   * Animated display value for the percentage counter.
   * Starts at the real remainingPct and is smoothly interpolated
   * via requestAnimationFrame whenever the flow data changes.
   */
  displayPct = signal(0);

  /**
   * Derived from the module-level shared signal.
   * True only when this specific card's ID is the active menu.
   * Using computed() means Angular re-evaluates this in the template
   * whenever activeCardMenuId changes — even from another card's click.
   */
  readonly showMenu = computed(() => activeCardMenuId() === this.flow.id);

  /** Handle for the in-progress requestAnimationFrame loop, used to cancel on destroy. */
  private animFrame?: number;

  /**
   * Bubble parameters computed once at construction time.
   * Values are deterministic (based on index i) so they are stable across
   * re-renders and don't cause unnecessary DOM updates.
   */
  readonly bubbles: Bubble[] = Array.from({ length: 7 }, (_, i) => ({
    id: i,
    x: 8 + (i * 13) % 84,
    size: 3 + (i * 2.3) % 7,
    duration: 2.5 + (i * 0.7) % 3,
    delay: (i * 0.9) % 4,
  }));

  /** Remaining budget as a percentage of the total, clamped to [0, 100]. */
  get remainingPct(): number {
    if (this.flow.totalAmount === 0) return 0;
    return Math.max(0, Math.min(100,
      Math.round(((this.flow.totalAmount - this.flow.spentAmount) / this.flow.totalAmount) * 100)
    ));
  }

  /** Remaining budget in Kwanza, never negative. */
  get remainingAmount(): number {
    return Math.max(0, this.flow.totalAmount - this.flow.spentAmount);
  }

  /**
   * Interpolated RGB colour for the water based on how full the envelope is.
   *
   * Colour stops (by remaining %):
   *   100–70%  green  (#22C55E) → yellow (#EAB308)  — mostly full
   *    70–40%  yellow (#EAB308) → orange (#F97316)  — half used
   *    40–10%  orange (#F97316) → red   (#EF4444)  — running low
   *     0–10%  solid red (#EF4444)                  — nearly empty
   */
  get waterColor(): string {
    const p = this.remainingPct;
    if (p >= 70) return this.lerp('#22C55E', '#EAB308', Math.max(0, (100 - p) / 30));
    if (p >= 40) return this.lerp('#EAB308', '#F97316', (70 - p) / 30);
    if (p >= 10) return this.lerp('#F97316', '#EF4444', (40 - p) / 30);
    return '#EF4444';
  }

  /** Set the initial display percentage without animation on first render. */
  ngOnInit(): void {
    this.displayPct.set(this.remainingPct);
  }

  /** Trigger the counter animation whenever the flow input reference changes. */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['flow'] && !changes['flow'].isFirstChange()) {
      const from = this.displayPct();
      const to = this.remainingPct;
      if (from !== to) this.animateCounter(from, to);
    }
  }

  /** Cancel any in-flight animation to prevent updates after the component is removed. */
  ngOnDestroy(): void {
    cancelAnimationFrame(this.animFrame ?? 0);
  }

  /**
   * Closes this card's menu when the user clicks anywhere on the document.
   * Only acts when this card is the currently open one to avoid redundant
   * signal writes from every card instance on every document click.
   */
  @HostListener('document:click')
  closeMenu(): void {
    if (activeCardMenuId() === this.flow.id) activeCardMenuId.set(null);
  }

  /**
   * Closes the menu when the user clicks anywhere on the action overlay
   * (including empty space between buttons).
   * stopPropagation prevents the click from bubbling to the card element
   * and re-opening the menu via toggleMenu.
   */
  closeOverlay(event: Event): void {
    event.stopPropagation();
    activeCardMenuId.set(null);
  }

  /**
   * Opens this card's menu, or closes it if already open.
   * stopPropagation prevents the document:click listener (closeMenu) from
   * firing in the same event cycle and immediately closing the menu again.
   */
  toggleMenu(event: Event): void {
    event.stopPropagation();
    activeCardMenuId.set(activeCardMenuId() === this.flow.id ? null : this.flow.id);
  }

  onActivate(): void {
    this.activate.emit(this.flow.id);
    activeCardMenuId.set(null);
  }

  onDeactivate(): void {
    this.deactivate.emit();
    activeCardMenuId.set(null);
  }

  onViewDetails(): void {
    this.viewDetails.emit(this.flow.id);
    activeCardMenuId.set(null);
  }

  onRemove(): void {
    this.remove.emit(this.flow.id);
    activeCardMenuId.set(null);
  }

  /**
   * Animates the percentage counter from `from` to `to` over 900 ms
   * using a cubic ease-out curve (1 - (1-t)^3) via requestAnimationFrame.
   */
  private animateCounter(from: number, to: number): void {
    cancelAnimationFrame(this.animFrame ?? 0);
    const duration = 900;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out
      this.displayPct.set(Math.round(from + (to - from) * eased));
      if (t < 1) this.animFrame = requestAnimationFrame(step);
    };
    this.animFrame = requestAnimationFrame(step);
  }

  /**
   * Linear interpolation between two hex colours.
   * Parses each colour into [R, G, B] components, interpolates each
   * channel independently, and returns an rgb() string.
   * t=0 returns c1, t=1 returns c2.
   */
  private lerp(c1: string, c2: string, t: number): string {
    const h = (c: string) => [
      parseInt(c.slice(1, 3), 16),
      parseInt(c.slice(3, 5), 16),
      parseInt(c.slice(5, 7), 16),
    ];
    const [r1, g1, b1] = h(c1);
    const [r2, g2, b2] = h(c2);
    return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
  }
}
