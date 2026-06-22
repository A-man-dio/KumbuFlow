import {
  Component, Input, Output, EventEmitter, OnInit, OnChanges,
  OnDestroy, SimpleChanges, HostListener, signal, ChangeDetectionStrategy
} from '@angular/core';
import { Flow } from '../../../core/models/flow.model';
import { KzPipe } from '../../pipes/kz.pipe';

interface Bubble {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
}

@Component({
  selector: 'app-flow-card',
  standalone: true,
  imports: [KzPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: block;' },
  template: `
    <div class="flow-card" [class.is-active]="flow.isActive" [class.menu-open]="showMenu()" (click)="toggleMenu($event)">

      <!-- Card content (always on top) -->
      <div class="card-content">
        <div class="card-top">
          <div class="flow-identity">
            <span class="flow-icon">{{ flow.icon }}</span>
            <span class="flow-name">{{ flow.name }}</span>
          </div>
          @if (flow.isActive) {
            <span class="active-badge">ATIVO</span>
          }
        </div>

        <div class="total-label">{{ flow.totalAmount | kz }}</div>

        <div class="pct-display">
          <span class="pct-value">{{ displayPct() }}</span><span class="pct-symbol">%</span>
        </div>
        <div class="remaining-value">{{ remainingAmount | kz }} restantes</div>
      </div>

      <!-- Water fill -->
      <div class="water-fill" [style.height.%]="remainingPct">
        <div class="wave-container">
          <svg class="wave wave-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50" preserveAspectRatio="none">
            <path [style.fill]="waterColor" d="M0,25 C25,5 75,45 100,25 C125,5 175,45 200,25 V50 H0 Z" opacity="0.75"/>
          </svg>
          <svg class="wave wave-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50" preserveAspectRatio="none">
            <path [style.fill]="waterColor" d="M0,30 C30,10 70,50 100,30 C130,10 170,50 200,30 V50 H0 Z" opacity="0.45"/>
          </svg>
        </div>
        <div class="water-body" [style.background-color]="waterColor">
          @for (b of bubbles; track b.id) {
            <div class="bubble"
              [style.left.%]="b.x"
              [style.width.px]="b.size"
              [style.height.px]="b.size"
              [style.--dur]="b.duration + 's'"
              [style.--delay]="b.delay + 's'">
            </div>
          }
        </div>
      </div>

      <!-- Action menu overlay -->
      @if (showMenu()) {
        <div class="action-overlay" (click)="$event.stopPropagation()">
          @if (!flow.isActive) {
            <button class="menu-btn primary" (click)="onActivate()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Ativar Fluxo
            </button>
          }
          <button class="menu-btn secondary" (click)="onViewDetails()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Ver Detalhes
          </button>
          @if (flow.isActive) {
            <button class="menu-btn danger" (click)="onDeactivate()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="6" y="6" width="12" height="12"/></svg>
              Desativar
            </button>
          }
          <button class="menu-btn remove" (click)="onRemove()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            Remover Fluxo
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .flow-card {
      position: relative;
      border-radius: 20px;
      overflow: hidden;
      background: #0F1629;
      border: 1.5px solid rgba(255,255,255,0.06);
      min-height: 220px;
      cursor: pointer;
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s, border-color 0.4s;
      user-select: none;

      &:hover {
        transform: translateY(-6px);
        box-shadow: 0 24px 60px rgba(0,0,0,0.5);
      }

      &.is-active {
        border-color: #3B82F6;
        box-shadow: 0 0 0 1px #3B82F6, 0 20px 60px rgba(59,130,246,0.15);
      }
    }

    .card-content {
      position: relative;
      z-index: 10;
      padding: 18px 20px 14px;
      min-height: 220px;
      display: flex;
      flex-direction: column;
      pointer-events: none;
    }

    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 4px;
    }

    .flow-identity {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .flow-icon { font-size: 1.2rem; line-height: 1; }

    .flow-name {
      font-family: 'Space Grotesk', sans-serif;
      color: #F1F5F9;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .active-badge {
      background: rgba(34,197,94,0.15);
      border: 1px solid rgba(34,197,94,0.35);
      color: #4ADE80;
      font-family: 'Inter', sans-serif;
      font-size: 0.6rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 20px;
      letter-spacing: 0.1em;
    }

    .total-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.65rem;
      color: rgba(255,255,255,0.35);
      margin-bottom: 16px;
    }

    .pct-display {
      margin-top: auto;
      line-height: 1;
    }

    .pct-value {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 3.8rem;
      font-weight: 700;
      color: #F1F5F9;
      text-shadow: 0 2px 24px rgba(0,0,0,0.6);
    }

    .pct-symbol {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.6rem;
      font-weight: 300;
      color: rgba(255,255,255,0.5);
      margin-left: 2px;
    }

    .remaining-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.7rem;
      color: rgba(255,255,255,0.4);
      margin-top: 6px;
    }

    /* ── Water animation ── */
    .water-fill {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      transition: height 1.4s cubic-bezier(0.22,1,0.36,1);
      z-index: 1;
    }

    .wave-container {
      position: absolute;
      top: -38px;
      left: 0;
      right: 0;
      height: 50px;
      overflow: hidden;

      svg.wave {
        position: absolute;
        top: 0;
        left: 0;
        width: 200%;
        height: 50px;

        path { transition: fill 1.2s ease; }

        &.wave-1 { animation: wave-move 4s linear infinite; }
        &.wave-2 { animation: wave-move 7s linear infinite reverse; top: 6px; }
      }
    }

    .water-body {
      position: absolute;
      top: 12px;
      bottom: 0;
      left: 0;
      right: 0;
      overflow: hidden;
      transition: background-color 1.2s ease;
    }

    .bubble {
      position: absolute;
      bottom: 5%;
      border-radius: 50%;
      background: rgba(255,255,255,0.22);
      animation: bubble-rise var(--dur, 3s) var(--delay, 0s) ease-in infinite;
    }

    @keyframes wave-move {
      from { transform: translateX(0); }
      to   { transform: translateX(-50%); }
    }

    @keyframes bubble-rise {
      0%   { transform: translateY(0) scale(0.5); opacity: 0; }
      15%  { opacity: 0.6; transform: scale(1); }
      85%  { opacity: 0.25; }
      100% { transform: translateY(-180px) scale(0.7); opacity: 0; }
    }

    /* ── Action overlay ── */
    .action-overlay {
      position: absolute;
      inset: 0;
      z-index: 20;
      background: rgba(8,12,20,0.88);
      backdrop-filter: blur(12px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 20px;
      animation: fade-in 0.18s ease;
    }

    .menu-btn {
      width: 100%;
      padding: 11px 16px;
      border: none;
      border-radius: 10px;
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: transform 0.1s, opacity 0.1s, background 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;

      &:active { transform: scale(0.97); }

      &.primary {
        background: #3B82F6;
        color: #fff;
        &:hover { background: #2563EB; }
      }

      &.secondary {
        background: rgba(255,255,255,0.07);
        color: #E2E8F0;
        border: 1px solid rgba(255,255,255,0.1);
        &:hover { background: rgba(255,255,255,0.12); }
      }

      &.danger {
        background: rgba(239,68,68,0.1);
        color: #FCA5A5;
        border: 1px solid rgba(239,68,68,0.2);
        &:hover { background: rgba(239,68,68,0.18); }
      }

      &.remove {
        background: transparent;
        color: #64748B;
        border: 1px solid rgba(255,255,255,0.06);
        font-size: 0.78rem;
        padding: 8px 16px;
        &:hover { background: rgba(239,68,68,0.08); color: #F87171; border-color: rgba(239,68,68,0.2); }
      }
    }

    @keyframes fade-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
  `]
})
export class FlowCardComponent implements OnInit, OnChanges, OnDestroy {
  @Input() flow!: Flow;
  @Output() activate = new EventEmitter<string>();
  @Output() deactivate = new EventEmitter<void>();
  @Output() viewDetails = new EventEmitter<string>();
  @Output() remove = new EventEmitter<string>();

  displayPct = signal(0);
  showMenu = signal(false);

  private animFrame?: number;

  readonly bubbles: Bubble[] = Array.from({ length: 7 }, (_, i) => ({
    id: i,
    x: 8 + (i * 13) % 84,
    size: 3 + (i * 2.3) % 7,
    duration: 2.5 + (i * 0.7) % 3,
    delay: (i * 0.9) % 4,
  }));

  get remainingPct(): number {
    if (this.flow.totalAmount === 0) return 0;
    return Math.max(0, Math.min(100,
      Math.round(((this.flow.totalAmount - this.flow.spentAmount) / this.flow.totalAmount) * 100)
    ));
  }

  get remainingAmount(): number {
    return Math.max(0, this.flow.totalAmount - this.flow.spentAmount);
  }

  get waterColor(): string {
    const p = this.remainingPct;
    if (p >= 70) return this.lerp('#22C55E', '#EAB308', Math.max(0, (100 - p) / 30));
    if (p >= 40) return this.lerp('#EAB308', '#F97316', (70 - p) / 30);
    if (p >= 10) return this.lerp('#F97316', '#EF4444', (40 - p) / 30);
    return '#EF4444';
  }

  ngOnInit(): void {
    this.displayPct.set(this.remainingPct);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['flow'] && !changes['flow'].isFirstChange()) {
      const from = this.displayPct();
      const to = this.remainingPct;
      if (from !== to) this.animateCounter(from, to);
    }
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animFrame ?? 0);
  }

  @HostListener('document:click')
  closeMenu(): void {
    if (this.showMenu()) this.showMenu.set(false);
  }

  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.showMenu.update(v => !v);
  }

  onActivate(): void {
    this.activate.emit(this.flow.id);
    this.showMenu.set(false);
  }

  onDeactivate(): void {
    this.deactivate.emit();
    this.showMenu.set(false);
  }

  onViewDetails(): void {
    this.viewDetails.emit(this.flow.id);
    this.showMenu.set(false);
  }

  onRemove(): void {
    this.remove.emit(this.flow.id);
    this.showMenu.set(false);
  }

  private animateCounter(from: number, to: number): void {
    cancelAnimationFrame(this.animFrame ?? 0);
    const duration = 900;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      this.displayPct.set(Math.round(from + (to - from) * eased));
      if (t < 1) this.animFrame = requestAnimationFrame(step);
    };
    this.animFrame = requestAnimationFrame(step);
  }

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
