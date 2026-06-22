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

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

@Component({
  selector: 'app-flow-detail',
  standalone: true,
  imports: [KzPipe, FormsModule],
  template: `
    <div class="detail-page">

      <!-- Back -->
      <button class="back-btn" (click)="goBack()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Voltar
      </button>

      @if (flow(); as f) {
        <!-- Header -->
        <div class="detail-header">
          <span class="detail-icon">{{ f.icon }}</span>
          <div>
            <h1 class="detail-name">{{ f.name }}</h1>
            <p class="detail-sub">{{ f.totalAmount | kz }} alocados</p>
          </div>
          @if (f.isActive) {
            <span class="active-chip">ATIVO</span>
          }
          <button class="alloc-btn" (click)="openAllocModal(f)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Alterar Alocação
          </button>
        </div>

        <!-- Allocation Modal -->
        @if (showAllocModal()) {
          <div class="modal-backdrop" (click)="closeAllocModal()">
            <div class="modal" (click)="$event.stopPropagation()">
              <div class="modal-header">
                <div>
                  <p class="modal-label">Alterar Alocação</p>
                  <p class="modal-sub">{{ f.icon }} {{ f.name }}</p>
                </div>
                <button class="modal-close" (click)="closeAllocModal()">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div class="modal-body">
                <div class="alloc-hints">
                  <div class="hint-row">
                    <span class="hint-label">Mínimo</span>
                    <span class="hint-val red">{{ f.spentAmount | kz }}</span>
                    <span class="hint-note">já gasto</span>
                  </div>
                  <div class="hint-row">
                    <span class="hint-label">Actual</span>
                    <span class="hint-val">{{ f.totalAmount | kz }}</span>
                  </div>
                  <div class="hint-row">
                    <span class="hint-label">Livre</span>
                    <span class="hint-val green">{{ flowService.availableToAllocate() | kz }}</span>
                    <span class="hint-note">disponível para alocar</span>
                  </div>
                </div>
                <div class="field">
                  <label>Novo Valor Alocado (Kz) *</label>
                  <div class="input-wrap">
                    <input type="number" [(ngModel)]="allocInput" [placeholder]="f.totalAmount" min="0" class="field-input" />
                    <span class="input-suffix">Kz</span>
                  </div>
                </div>
                @if (allocError()) {
                  <p class="modal-error">{{ allocError() }}</p>
                }
              </div>
              <div class="modal-footer">
                <button class="btn-cancel" (click)="closeAllocModal()">Cancelar</button>
                <button class="btn-submit" (click)="submitAlloc(f.id)">Guardar Alocação</button>
              </div>
            </div>
          </div>
        }

        <!-- Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <p class="stat-label">Alocado</p>
            <p class="stat-value">{{ f.totalAmount | kz }}</p>
          </div>
          <div class="stat-card spent">
            <p class="stat-label">Gasto</p>
            <p class="stat-value">{{ f.spentAmount | kz }}</p>
          </div>
          <div class="stat-card remaining">
            <p class="stat-label">Restante</p>
            <p class="stat-value">{{ (f.totalAmount - f.spentAmount) | kz }}</p>
          </div>
          <div class="stat-card pct">
            <p class="stat-label">Utilizado</p>
            <p class="stat-value">{{ usedPct(f) }}%</p>
          </div>
        </div>

        <!-- Chart + Legend -->
        <div class="chart-section">
          <div class="chart-wrap">
            @if (f.transactions.length > 0) {
              <canvas #chartCanvas></canvas>
              <div class="chart-center">
                <p class="chart-center-pct">{{ remainingPct(f) }}%</p>
                <p class="chart-center-label">restante</p>
              </div>
            } @else {
              <div class="chart-empty">
                <span class="empty-icon">📊</span>
                <p>Nenhum gasto registado</p>
              </div>
            }
          </div>

          <div class="chart-legend">
            <h3 class="legend-title">Distribuição de Gastos</h3>
            @for (item of chartLegend(f); track item.label) {
              <div class="legend-item">
                <span class="legend-dot" [style.background]="item.color"></span>
                <span class="legend-label">{{ item.label }}</span>
                <span class="legend-amount">{{ item.amount | kz }}</span>
              </div>
            }
            <div class="legend-item remaining-row">
              <span class="legend-dot" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15)"></span>
              <span class="legend-label">Restante</span>
              <span class="legend-amount">{{ (f.totalAmount - f.spentAmount) | kz }}</span>
            </div>
          </div>
        </div>

        <!-- Transactions -->
        <div class="transactions-section">
          <div class="section-header">
            <h2 class="section-title">
              Histórico de Gastos
              <span class="tx-count">{{ f.transactions.length }}</span>
            </h2>
            <button class="add-tx-btn" (click)="openAddExpenseModal(f)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Registar Gasto
            </button>
          </div>

          @if (f.transactions.length === 0) {
            <div class="tx-empty">
              <p>Nenhum gasto registado neste fluxo.</p>
              <button class="tx-empty-btn" (click)="openAddExpenseModal(f)">+ Registar primeiro gasto</button>
            </div>
          } @else {
            <div class="tx-list">
              @for (tx of f.transactions; track tx.id) {
                <div class="tx-item">
                  <div class="tx-cat-dot" [style.background]="catColor(tx.category)"></div>
                  <div class="tx-info">
                    <p class="tx-desc">{{ tx.description }}</p>
                    <p class="tx-meta">{{ formatDate(tx.date) }}</p>
                  </div>
                  <span class="tx-amount">-{{ tx.amount | kz }}</span>
                  <button class="tx-delete" (click)="onRemoveExpense(f.id, tx.id, tx.description, tx.amount)" title="Remover gasto">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                  </button>
                </div>
              }
            </div>
          }
        </div>

        <!-- Add Expense Modal -->
        @if (showAddExpenseModal()) {
          <div class="modal-backdrop" (click)="closeAddExpenseModal()">
            <div class="modal" (click)="$event.stopPropagation()">
              <div class="modal-header">
                <div>
                  <p class="modal-label">Registar Gasto</p>
                  <p class="modal-sub">{{ f.icon }} {{ f.name }}</p>
                </div>
                <button class="modal-close" (click)="closeAddExpenseModal()">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div class="modal-body">
                <div class="field">
                  <label>Valor (Kz) *</label>
                  <div class="input-wrap">
                    <input type="number" [(ngModel)]="expenseAmount" placeholder="0" min="1" class="field-input" autofocus />
                    <span class="input-suffix">Kz</span>
                  </div>
                </div>
                <div class="field">
                  <label>Descrição *</label>
                  <input type="text" [(ngModel)]="expenseDescription" placeholder="Ex: Supermercado Kero" class="field-input" />
                </div>
                <div class="available-hint">
                  Disponível neste fluxo: <strong>{{ (f.totalAmount - f.spentAmount) | kz }}</strong>
                </div>
                @if (expenseError()) {
                  <p class="modal-error">{{ expenseError() }}</p>
                }
              </div>
              <div class="modal-footer">
                <button class="btn-cancel" (click)="closeAddExpenseModal()">Cancelar</button>
                <button class="btn-submit" (click)="submitExpense(f.id, f.totalAmount - f.spentAmount)">Registar</button>
              </div>
            </div>
          </div>
        }

      } @else {
        <div class="not-found">
          <p>Fluxo não encontrado.</p>
          <button class="back-btn" (click)="goBack()">Voltar ao início</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .detail-page {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px 20px 60px;
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      color: #94A3B8;
      font-family: 'Inter', sans-serif;
      font-size: 0.82rem;
      font-weight: 500;
      padding: 8px 14px;
      cursor: pointer;
      margin-bottom: 28px;
      transition: background 0.15s, color 0.15s;

      &:hover { background: rgba(255,255,255,0.09); color: #F1F5F9; }
    }

    .detail-header {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 28px;
    }

    .detail-icon { font-size: 2.4rem; line-height: 1; }

    .detail-name {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.8rem;
      font-weight: 700;
      color: #F1F5F9;
      letter-spacing: -0.02em;
      line-height: 1.1;
    }

    .detail-sub {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.78rem;
      color: #64748B;
      margin-top: 4px;
    }

    .active-chip {
      background: rgba(34,197,94,0.12);
      border: 1px solid rgba(34,197,94,0.3);
      color: #4ADE80;
      font-family: 'Inter', sans-serif;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 20px;
      letter-spacing: 0.1em;
    }

    .alloc-btn {
      margin-left: auto;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: rgba(59,130,246,0.08);
      border: 1px solid rgba(59,130,246,0.2);
      border-radius: 10px;
      color: #60A5FA;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;

      &:hover { background: rgba(59,130,246,0.15); border-color: rgba(59,130,246,0.4); }

      @media (max-width: 500px) {
        flex: 0 0 100%;
        margin-left: 0;
        justify-content: center;
      }
    }

    /* ── Alloc modal styles ── */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(6px);
      z-index: 200;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: backdrop-in 0.2s ease;
    }

    .modal {
      width: 100%;
      max-width: 420px;
      background: #111827;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      overflow: hidden;
      animation: scale-in 0.25s cubic-bezier(0.22,1,0.36,1);
    }

    .modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 22px 22px 14px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }

    .modal-label {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.05rem;
      font-weight: 700;
      color: #F1F5F9;
    }

    .modal-sub {
      font-family: 'Inter', sans-serif;
      font-size: 0.78rem;
      color: #3B82F6;
      margin-top: 2px;
    }

    .modal-close {
      background: rgba(255,255,255,0.06);
      border: none;
      border-radius: 8px;
      color: #64748B;
      cursor: pointer;
      padding: 6px;
      display: flex;
      &:hover { background: rgba(255,255,255,0.1); color: #F1F5F9; }
    }

    .modal-body { padding: 18px 22px; display: flex; flex-direction: column; gap: 16px; }

    .alloc-hints {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 10px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .hint-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: 'Inter', sans-serif;
      font-size: 0.78rem;
    }

    .hint-label {
      width: 55px;
      color: #64748B;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .hint-val {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      color: #F1F5F9;
      font-size: 0.82rem;

      &.red { color: #F87171; }
      &.green { color: #4ADE80; }
    }

    .hint-note {
      color: #475569;
      font-size: 0.7rem;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;

      label {
        font-family: 'Inter', sans-serif;
        font-size: 0.72rem;
        font-weight: 500;
        color: #64748B;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
    }

    .input-wrap {
      position: relative;
      display: flex;
      align-items: center;

      .field-input { padding-right: 44px; }
      .input-suffix {
        position: absolute;
        right: 14px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.78rem;
        color: #475569;
        pointer-events: none;
      }
    }

    .field-input {
      width: 100%;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      color: #F1F5F9;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.95rem;
      padding: 12px 14px;
      outline: none;
      transition: border-color 0.2s;
      box-sizing: border-box;

      &:focus { border-color: #3B82F6; background: rgba(59,130,246,0.05); }
    }

    .modal-error {
      font-family: 'Inter', sans-serif;
      font-size: 0.78rem;
      color: #F87171;
      background: rgba(239,68,68,0.08);
      border: 1px solid rgba(239,68,68,0.2);
      border-radius: 8px;
      padding: 8px 12px;
    }

    .modal-footer {
      display: flex;
      gap: 10px;
      padding: 14px 22px 22px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }

    .btn-cancel {
      flex: 1;
      padding: 11px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      color: #94A3B8;
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 600;
      font-size: 0.88rem;
      cursor: pointer;
      transition: background 0.15s;
      &:hover { background: rgba(255,255,255,0.09); }
    }

    .btn-submit {
      flex: 2;
      padding: 11px;
      background: #3B82F6;
      border: none;
      border-radius: 10px;
      color: white;
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s;
      &:hover { background: #2563EB; }
      &:active { transform: scale(0.98); }
    }

    @keyframes backdrop-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    @keyframes scale-in {
      from { opacity: 0; transform: scale(0.94); }
      to   { opacity: 1; transform: scale(1); }
    }

    /* ── Stats ── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 32px;

      @media (max-width: 600px) {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .stat-card {
      background: #0F1629;
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 14px;
      padding: 16px;

      &.spent .stat-value { color: #F87171; }
      &.remaining .stat-value { color: #4ADE80; }
      &.pct .stat-value { color: #60A5FA; }
    }

    .stat-label {
      font-family: 'Inter', sans-serif;
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748B;
      font-weight: 500;
      margin-bottom: 8px;
    }

    .stat-value {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.05rem;
      font-weight: 700;
      color: #F1F5F9;
    }

    /* ── Chart ── */
    .chart-section {
      display: grid;
      grid-template-columns: 220px 1fr;
      gap: 28px;
      margin-bottom: 36px;
      align-items: start;
      overflow: visible;

      @media (max-width: 560px) {
        grid-template-columns: 1fr;
      }
    }

    .chart-wrap {
      position: relative;
      width: 220px;
      height: 220px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: visible;

      @media (max-width: 560px) {
        width: 180px;
        height: 180px;
        margin: 0 auto;
      }

      canvas {
        position: absolute;
        inset: 0;
        width: 100% !important;
        height: 100% !important;
      }
    }

    .chart-center {
      position: relative;
      z-index: 1;
      text-align: center;
      pointer-events: none;
    }

    .chart-center-pct {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 2rem;
      font-weight: 700;
      color: #F1F5F9;
      line-height: 1;
    }

    .chart-center-label {
      font-family: 'Inter', sans-serif;
      font-size: 0.7rem;
      color: #64748B;
      margin-top: 4px;
    }

    .chart-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      height: 100%;
      border: 1.5px dashed rgba(255,255,255,0.08);
      border-radius: 50%;
      color: #475569;
      font-family: 'Inter', sans-serif;
      font-size: 0.78rem;
      text-align: center;
      padding: 20px;

      .empty-icon { font-size: 1.8rem; }
    }

    .chart-legend { padding-top: 8px; }

    .legend-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.82rem;
      font-weight: 600;
      color: #94A3B8;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 14px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255,255,255,0.04);

      &:last-child { border-bottom: none; }
      &.remaining-row { opacity: 0.6; }
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .legend-label {
      flex: 1;
      font-family: 'Inter', sans-serif;
      font-size: 0.82rem;
      color: #94A3B8;
    }

    .legend-amount {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      color: #F1F5F9;
      font-weight: 700;
    }

    /* ── Transactions ── */
    .transactions-section { }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .add-tx-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      background: rgba(59,130,246,0.08);
      border: 1px solid rgba(59,130,246,0.2);
      border-radius: 9px;
      color: #60A5FA;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;

      &:hover { background: rgba(59,130,246,0.15); border-color: rgba(59,130,246,0.4); }
    }

    .tx-empty-btn {
      margin-top: 12px;
      display: inline-flex;
      align-items: center;
      padding: 8px 16px;
      background: rgba(59,130,246,0.08);
      border: 1px solid rgba(59,130,246,0.2);
      border-radius: 9px;
      color: #60A5FA;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      &:hover { background: rgba(59,130,246,0.15); }
    }

    .available-hint {
      font-family: 'Inter', sans-serif;
      font-size: 0.78rem;
      color: #64748B;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 8px;
      padding: 8px 12px;

      strong {
        color: #4ADE80;
        font-family: 'JetBrains Mono', monospace;
      }
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1rem;
      font-weight: 600;
      color: #94A3B8;
    }

    .tx-count {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.08);
      color: #64748B;
      font-size: 0.72rem;
      padding: 2px 8px;
      border-radius: 20px;
    }

    .tx-empty {
      text-align: center;
      padding: 40px;
      color: #475569;
      font-family: 'Inter', sans-serif;
      font-size: 0.85rem;
      border: 1.5px dashed rgba(255,255,255,0.06);
      border-radius: 16px;
    }

    .tx-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .tx-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      background: #0F1629;
      border-radius: 12px;
      transition: background 0.15s;

      &:hover { background: rgba(59,130,246,0.05); }
    }

    .tx-cat-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .tx-info { flex: 1; min-width: 0; }

    .tx-desc {
      font-family: 'Inter', sans-serif;
      font-size: 0.88rem;
      font-weight: 500;
      color: #E2E8F0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tx-meta {
      font-family: 'Inter', sans-serif;
      font-size: 0.72rem;
      color: #475569;
      margin-top: 2px;
    }

    .tx-amount {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.88rem;
      font-weight: 700;
      color: #F87171;
      white-space: nowrap;
    }

    .tx-delete {
      flex-shrink: 0;
      width: 30px;
      height: 30px;
      border-radius: 7px;
      background: transparent;
      border: none;
      color: #334155;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, color 0.15s;
      opacity: 0;

      .tx-item:hover & { opacity: 1; }
      &:hover { background: rgba(239,68,68,0.1); color: #F87171; }
    }

    .not-found {
      text-align: center;
      padding: 80px 20px;
      color: #64748B;
      font-family: 'Inter', sans-serif;

      p { margin-bottom: 20px; }
    }
  `]
})
export class FlowDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas?: ElementRef<HTMLCanvasElement>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  protected flowService = inject(FlowService);
  private alertService = inject(AlertService);

  private flowId = signal('');
  private chart?: Chart;

  showAllocModal = signal(false);
  allocInput: number | null = null;
  allocError = signal('');

  showAddExpenseModal = signal(false);
  expenseAmount: number | null = null;
  expenseDescription = '';
  expenseError = signal('');
  private activeFlowId = '';

  readonly flow = computed(() => this.flowService.getFlowById(this.flowId()));

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.flowId.set(id);
    if (!this.flowService.getFlowById(id)) {
      this.router.navigate(['/']);
    }
  }

  ngAfterViewInit(): void {
    this.buildChart();
  }

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

  usedPct(f: Flow): number {
    if (f.totalAmount === 0) return 0;
    return Math.round((f.spentAmount / f.totalAmount) * 100);
  }

  remainingPct(f: Flow): number {
    if (f.totalAmount === 0) return 0;
    return Math.max(0, 100 - this.usedPct(f));
  }

  catColor(cat: string): string {
    return (CATEGORY_COLORS as Record<string, string>)[cat] ?? '#3B82F6';
  }

  catLabel(cat: string): string {
    return (CATEGORY_LABELS as Record<string, string>)[cat] ?? cat;
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-AO', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
  }

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

  private buildChart(): void {
    const f = this.flow();
    if (!f || !this.chartCanvas || f.transactions.length === 0) return;

    if (!(Tooltip.positioners as any)['outerArc']) {
      (Tooltip.positioners as any)['outerArc'] = function(this: any, elements: any[]) {
        if (!elements.length) return false;
        const arc = elements[0].element as any;
        const midAngle = (arc.startAngle + arc.endAngle) / 2;
        const r = arc.outerRadius + 20;
        return { x: arc.x + Math.cos(midAngle) * r, y: arc.y + Math.sin(midAngle) * r };
      };
    }

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
      'rgba(255,255,255,0.07)',
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
