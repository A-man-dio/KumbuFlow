import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FlowService } from '../../core/services/flow.service';
import { AlertService } from '../../core/services/alert.service';
import { FlowCardComponent } from '../../shared/components/flow-card/flow-card.component';
import { KzPipe } from '../../shared/pipes/kz.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FlowCardComponent, KzPipe, FormsModule],
  template: `
    <div class="dashboard">

      <!-- Hero Balance -->
      <section class="hero">
        <div class="hero-inner">
          <div class="hero-top-row">
            <p class="hero-label">Saldo do Cartão</p>
            <button class="hero-edit-btn" (click)="openBalanceModal()" title="Editar saldo do cartão">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Editar
            </button>
          </div>
          <h1 class="hero-balance">{{ flowService.cardBalance() | kz }}</h1>

          <div class="hero-alloc-bar">
            <div class="alloc-fill" [style.width.%]="allocPct"></div>
          </div>

          <div class="hero-meta">
            <span class="meta-item">
              <span class="dot blue"></span>
              Alocado: {{ flowService.totalAllocated() | kz }}
            </span>
            <span class="meta-divider">•</span>
            <span class="meta-item">
              <span class="dot green"></span>
              Livre: {{ flowService.availableToAllocate() | kz }}
            </span>
          </div>
        </div>
        <div class="hero-glow"></div>
      </section>

      <!-- Edit Card Balance Modal -->
      @if (showBalanceModal()) {
        <div class="modal-backdrop" (click)="closeBalanceModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <p class="modal-label">Saldo do Cartão</p>
                <p class="modal-flow-name">Define o valor total disponível no teu cartão</p>
              </div>
              <button class="modal-close" (click)="closeBalanceModal()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="field">
                <label>Valor no Cartão (Kz) *</label>
                <div class="input-wrap">
                  <input type="number" [(ngModel)]="balanceInput" placeholder="0" min="1" class="field-input" />
                  <span class="input-suffix">Kz</span>
                </div>
              </div>
              @if (balanceError()) {
                <p class="modal-error">{{ balanceError() }}</p>
              }
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" (click)="closeBalanceModal()">Cancelar</button>
              <button class="btn-submit" (click)="submitBalance()">Guardar</button>
            </div>
          </div>
        </div>
      }

      <!-- Active Flow Banner -->
      @if (flowService.activeFlow(); as active) {
        <section class="active-banner">
          <div class="banner-left">
            <span class="banner-icon">{{ active.icon }}</span>
            <div>
              <p class="banner-label">Fluxo Activo</p>
              <p class="banner-name">{{ active.name }}</p>
            </div>
          </div>
          <div class="banner-right">
            <span class="banner-amount">{{ active.totalAmount - active.spentAmount | kz }}</span>
            <span class="banner-sub">disponível</span>
          </div>
        </section>
      }

      <!-- Flow Grid -->
      <section class="flows-section">
        <h2 class="section-title">
          Meus Fluxos
          <span class="count-badge">{{ flowCount }}</span>
        </h2>

        <div class="flows-grid">
          @for (flow of flowService.flows(); track flow.id) {
            <app-flow-card
              [flow]="flow"
              (activate)="onActivate($event)"
              (deactivate)="onDeactivate()"
              (viewDetails)="onViewDetails($event)"
              (remove)="onRemove($event)"
            />
          }
          <button class="add-flow-card" (click)="openCreateModal()">
            <div class="add-flow-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <span class="add-flow-label">Novo Fluxo</span>
          </button>
        </div>
      </section>

    </div>

    <!-- FAB -->
    <div class="fab-container">
      @if (flowService.activeFlow(); as active) {
        <div class="fab-label">
          <span>{{ active.icon }} Gasto em {{ active.name }}</span>
        </div>
      } @else {
        <div class="fab-label inactive">Activa um fluxo primeiro</div>
      }
      <button class="fab" (click)="openExpenseModal()" [class.disabled]="!flowService.activeFlow()" [class.fab-ok]="fabSuccess()">
        @if (fabSuccess()) {
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        } @else {
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        }
      </button>
    </div>

    <!-- Create Flow Modal -->
    @if (showCreateModal()) {
      <div class="modal-backdrop" (click)="closeCreateModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <p class="modal-label">Novo Fluxo</p>
              <p class="modal-flow-name">Define o nome, ícone e valor</p>
            </div>
            <button class="modal-close" (click)="closeCreateModal()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="field">
              <label>Nome do Fluxo *</label>
              <input type="text" [(ngModel)]="newFlowName" placeholder="Ex: Alimentação, Renda, Lazer…" class="field-input" />
            </div>
            <div class="field">
              <label>Ícone</label>
              <div class="icon-grid">
                @for (em of iconOptions; track em) {
                  <button class="icon-btn" [class.selected]="newFlowIcon === em" (click)="newFlowIcon = em">{{ em }}</button>
                }
              </div>
            </div>
            <div class="field">
              <label>Valor Alocado (Kz) *</label>
              <div class="input-wrap">
                <input type="number" [(ngModel)]="newFlowAmount" placeholder="0" min="1" class="field-input" />
                <span class="input-suffix">Kz</span>
              </div>
            </div>
            @if (createError()) {
              <p class="modal-error">{{ createError() }}</p>
            }
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeCreateModal()">Cancelar</button>
            <button class="btn-submit" (click)="submitCreate()">Criar Fluxo</button>
          </div>
        </div>
      </div>
    }

    <!-- Expense Modal -->
    @if (showModal()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <p class="modal-label">Registar Gasto</p>
              @if (flowService.activeFlow(); as active) {
                <p class="modal-flow-name">{{ active.icon }} {{ active.name }}</p>
              }
            </div>
            <button class="modal-close" (click)="closeModal()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="modal-body">
            @if (flowService.activeFlow(); as active) {
              <div class="available-hint">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Disponível em <strong>{{ active.name }}</strong>: <span class="hint-amount">{{ active.totalAmount - active.spentAmount | kz }}</span>
              </div>
            }

            <div class="field">
              <label>Valor (Kz) *</label>
              <div class="input-wrap">
                <input type="number" [(ngModel)]="expenseAmount" placeholder="0" min="1" class="field-input" />
                <span class="input-suffix">Kz</span>
              </div>
            </div>

            <div class="field">
              <label>Descrição *</label>
              <input type="text" [(ngModel)]="expenseDescription" placeholder="Ex: Supermercado Kero" class="field-input" />
            </div>

            @if (modalError()) {
              <p class="modal-error">{{ modalError() }}</p>
            }
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeModal()">Cancelar</button>
            <button class="btn-submit" (click)="submitExpense()">Registar Gasto</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .dashboard {
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 20px 120px;
    }

    /* ── Hero ── */
    .hero {
      position: relative;
      text-align: center;
      padding: 48px 20px 40px;
      margin-bottom: 8px;
      overflow: hidden;
    }

    .hero-inner { position: relative; z-index: 1; }

    .hero-glow {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 500px;
      height: 200px;
      background: radial-gradient(ellipse, rgba(59,130,246,0.12) 0%, transparent 70%);
      pointer-events: none;
    }

    .hero-top-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 10px;
    }

    .hero-label {
      font-family: 'Inter', sans-serif;
      font-size: 0.78rem;
      font-weight: 500;
      color: #64748B;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .hero-edit-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 6px;
      color: #64748B;
      font-family: 'Inter', sans-serif;
      font-size: 0.68rem;
      font-weight: 500;
      padding: 3px 8px;
      cursor: pointer;
      transition: all 0.15s;

      &:hover { background: rgba(59,130,246,0.1); border-color: rgba(59,130,246,0.3); color: #60A5FA; }
    }

    .hero-balance {
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(2.4rem, 6vw, 4rem);
      font-weight: 700;
      color: #F1F5F9;
      letter-spacing: -0.03em;
      line-height: 1;
      margin-bottom: 16px;
    }

    .hero-alloc-bar {
      width: 240px;
      max-width: 80%;
      height: 4px;
      background: rgba(255,255,255,0.06);
      border-radius: 2px;
      margin: 0 auto 14px;
      overflow: hidden;

      .alloc-fill {
        height: 100%;
        background: linear-gradient(90deg, #3B82F6, #60A5FA);
        border-radius: 2px;
        transition: width 0.8s cubic-bezier(0.22,1,0.36,1);
      }
    }

    .hero-meta {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      font-family: 'Inter', sans-serif;
      font-size: 0.78rem;
      color: #64748B;
    }

    .meta-item { display: flex; align-items: center; gap: 6px; }

    .dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      &.green { background: #22C55E; box-shadow: 0 0 6px #22C55E; }
      &.blue  { background: #3B82F6; box-shadow: 0 0 6px #3B82F6; }
    }

    .meta-divider { color: #1E293B; }

    /* ── Active Banner ── */
    .active-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(59,130,246,0.08);
      border: 1px solid rgba(59,130,246,0.2);
      border-radius: 14px;
      padding: 14px 20px;
      margin-bottom: 32px;
    }

    .banner-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .banner-icon { font-size: 1.5rem; }

    .banner-label {
      font-family: 'Inter', sans-serif;
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #3B82F6;
      font-weight: 600;
    }

    .banner-name {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.95rem;
      font-weight: 600;
      color: #F1F5F9;
    }

    .banner-right { text-align: right; }

    .banner-amount {
      display: block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 1.1rem;
      font-weight: 700;
      color: #F1F5F9;
    }

    .banner-sub {
      font-family: 'Inter', sans-serif;
      font-size: 0.65rem;
      color: #64748B;
    }

    /* ── Flows Section ── */
    .flows-section { }

    .section-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1rem;
      font-weight: 600;
      color: #94A3B8;
      letter-spacing: 0.02em;
      margin-bottom: 20px;
    }

    .count-badge {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.08);
      color: #64748B;
      font-size: 0.72rem;
      padding: 2px 8px;
      border-radius: 20px;
    }

    .flows-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 16px;

      @media (max-width: 520px) {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      @media (max-width: 340px) {
        grid-template-columns: 1fr;
      }
    }

    .add-flow-card {
      min-height: 220px;
      border-radius: 20px;
      border: 1.5px dashed rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.02);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      transition: border-color 0.2s, background 0.2s, transform 0.2s;

      &:hover {
        border-color: rgba(59,130,246,0.4);
        background: rgba(59,130,246,0.04);
        transform: translateY(-4px);

        .add-flow-icon { color: #3B82F6; border-color: rgba(59,130,246,0.3); background: rgba(59,130,246,0.1); }
        .add-flow-label { color: #60A5FA; }
      }
    }

    .add-flow-icon {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      border: 1.5px dashed rgba(255,255,255,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #475569;
      transition: all 0.2s;
    }

    .add-flow-label {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
      transition: color 0.2s;
    }

    .icon-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 6px;

      @media (max-width: 400px) { grid-template-columns: repeat(6, 1fr); }
    }

    .icon-btn {
      aspect-ratio: 1;
      border-radius: 8px;
      background: rgba(255,255,255,0.04);
      border: 1.5px solid rgba(255,255,255,0.06);
      font-size: 1.1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, border-color 0.15s, transform 0.1s;

      &:hover { background: rgba(255,255,255,0.08); transform: scale(1.1); }
      &:active { transform: scale(0.95); }

      &.selected {
        background: rgba(59,130,246,0.15);
        border-color: #3B82F6;
        box-shadow: 0 0 0 1px #3B82F6;
      }
    }

    /* ── FAB ── */
    .fab-container {
      position: fixed;
      bottom: 28px;
      right: 24px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
      z-index: 50;
    }

    .fab-label {
      background: rgba(8,12,20,0.92);
      border: 1px solid rgba(59,130,246,0.35);
      border-radius: 20px;
      padding: 5px 13px;
      font-family: 'Inter', sans-serif;
      font-size: 0.72rem;
      font-weight: 500;
      color: #60A5FA;
      white-space: nowrap;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);

      &.inactive {
        border-color: rgba(255,255,255,0.07);
        color: #475569;
      }
    }

    .fab {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: #3B82F6;
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 32px rgba(59,130,246,0.45);
      transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s, background 0.2s;

      &:hover { transform: scale(1.1); box-shadow: 0 12px 40px rgba(59,130,246,0.55); }
      &:active { transform: scale(0.96); }

      &.disabled {
        background: #1E293B;
        box-shadow: none;
        cursor: not-allowed;
        color: #475569;
        &:hover { transform: none; }
      }

      &.fab-ok {
        background: #22C55E;
        box-shadow: 0 8px 32px rgba(34,197,94,0.45);
        animation: fab-pulse 0.4s cubic-bezier(0.34,1.56,0.64,1);
      }
    }

    @keyframes fab-pulse {
      0%   { transform: scale(1); }
      50%  { transform: scale(1.18); }
      100% { transform: scale(1); }
    }

    /* ── Modal ── */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(6px);
      z-index: 200;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding: 0;
      animation: backdrop-in 0.2s ease;

      @media (min-width: 600px) {
        align-items: center;
        padding: 20px;
      }
    }

    .modal {
      width: 100%;
      max-width: 440px;
      background: #111827;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 24px 24px 0 0;
      overflow: hidden;
      animation: slide-up 0.3s cubic-bezier(0.22,1,0.36,1);

      @media (min-width: 600px) {
        border-radius: 20px;
        animation: scale-in 0.25s cubic-bezier(0.22,1,0.36,1);
      }
    }

    .modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 24px 24px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }

    .modal-label {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.1rem;
      font-weight: 700;
      color: #F1F5F9;
    }

    .modal-flow-name {
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
      transition: background 0.15s, color 0.15s;
      &:hover { background: rgba(255,255,255,0.1); color: #F1F5F9; }
    }

    .modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }

    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;

      label {
        font-family: 'Inter', sans-serif;
        font-size: 0.75rem;
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
      transition: border-color 0.2s, background 0.2s;
      box-sizing: border-box;

      &:focus {
        border-color: #3B82F6;
        background: rgba(59,130,246,0.05);
      }

      option { background: #111827; }
    }

    .available-hint {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 14px;
      background: rgba(34,197,94,0.06);
      border: 1px solid rgba(34,197,94,0.15);
      border-radius: 10px;
      font-family: 'Inter', sans-serif;
      font-size: 0.8rem;
      color: #64748B;

      strong { color: #94A3B8; font-weight: 500; }

      .hint-amount {
        font-family: 'JetBrains Mono', monospace;
        font-weight: 700;
        color: #4ADE80;
        margin-left: 2px;
      }
    }

    .modal-error {
      font-family: 'Inter', sans-serif;
      font-size: 0.8rem;
      color: #F87171;
      background: rgba(239,68,68,0.08);
      border: 1px solid rgba(239,68,68,0.2);
      border-radius: 8px;
      padding: 8px 12px;
    }

    .modal-footer {
      display: flex;
      gap: 10px;
      padding: 16px 24px 24px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }

    .btn-cancel {
      flex: 1;
      padding: 12px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      color: #94A3B8;
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: background 0.15s;
      &:hover { background: rgba(255,255,255,0.09); }
    }

    .btn-submit {
      flex: 2;
      padding: 12px;
      background: #3B82F6;
      border: none;
      border-radius: 10px;
      color: white;
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s;
      &:hover { background: #2563EB; }
      &:active { transform: scale(0.98); }
    }

    @keyframes backdrop-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    @keyframes slide-up {
      from { transform: translateY(100%); }
      to   { transform: translateY(0); }
    }

    @keyframes scale-in {
      from { opacity: 0; transform: scale(0.95); }
      to   { opacity: 1; transform: scale(1); }
    }
  `]
})
export class DashboardComponent {
  protected flowService = inject(FlowService);
  private router = inject(Router);
  private alertService = inject(AlertService);

  showModal = signal(false);
  modalError = signal('');
  fabSuccess = signal(false);
  showCreateModal = signal(false);
  createError = signal('');
  showBalanceModal = signal(false);
  balanceError = signal('');

  expenseAmount: number | null = null;
  expenseDescription = '';

  newFlowName = '';
  newFlowIcon = '💰';
  newFlowAmount: number | null = null;

  balanceInput: number | null = null;

  readonly iconOptions = [
    '🏠','🛒','🚗','🎉','💊','💰','✈️','👗',
    '📚','🎮','🏥','💡','🍽️','🎵','📱','💻',
    '🏋️','🌟','🎓','🏖️','🎁','⚡','🔧','🐾',
  ];

  get allocPct(): number {
    const cb = this.flowService.cardBalance();
    if (!cb) return 0;
    return Math.min(100, Math.round((this.flowService.totalAllocated() / cb) * 100));
  }

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

    const prevPct = Math.round((active.spentAmount / active.totalAmount) * 100);
    this.flowService.addExpense(active.id, this.expenseAmount, this.expenseDescription.trim());
    const updated = this.flowService.getFlowById(active.id)!;
    const newPct = Math.round((updated.spentAmount / updated.totalAmount) * 100);
    this.alertService.checkSpendingThreshold(active.name, newPct, prevPct);

    this.fabSuccess.set(true);
    setTimeout(() => this.fabSuccess.set(false), 1400);
    this.closeModal();
  }
}
