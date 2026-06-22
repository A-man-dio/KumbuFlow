import { Component, inject, signal } from '@angular/core';
import { FlowService } from '../../../core/services/flow.service';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  template: `
    <nav class="navbar">
      <div class="nav-logo">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="28" height="28" rx="8" fill="#3B82F6" fill-opacity="0.15"/>
          <path d="M4 18 C7 14, 10 22, 13 18 C16 14, 19 22, 22 18 C23.5 16, 24.5 17, 25 18"
                stroke="#3B82F6" stroke-width="2.5" stroke-linecap="round" fill="none"/>
          <path d="M4 12 C7 8, 10 16, 13 12 C16 8, 19 16, 22 12 C23.5 10, 24.5 11, 25 12"
                stroke="#60A5FA" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.5"/>
        </svg>
        <span class="logo-text">Kumbu<span class="logo-accent">Flow</span></span>
      </div>

      <div class="nav-center">
        <span class="month-badge">{{ currentMonth }}</span>
      </div>

      <div class="nav-actions">
        <button class="help-btn" (click)="showHelp.set(true)" title="Como funciona">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span>Como funciona</span>
        </button>
        <button class="reset-btn" (click)="onReset()" title="Reiniciar fluxos do mês">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
          <span>Reset</span>
        </button>
      </div>
    </nav>

    <!-- Help Modal -->
    @if (showHelp()) {
      <div class="help-backdrop" (click)="showHelp.set(false)">
        <div class="help-modal" (click)="$event.stopPropagation()">
          <div class="help-header">
            <div>
              <p class="help-title">Como funciona o KumbuFlow</p>
              <p class="help-sub">O método dos envelopes digitais</p>
            </div>
            <button class="help-close" (click)="showHelp.set(false)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="help-body">
            <p class="help-intro">
              Em vez de teres um único saldo e gastares sem controlo, o KumbuFlow divide o teu dinheiro em <strong>fluxos</strong> — cada um com um propósito e um limite. Como envelopes físicos, mas no telemóvel.
            </p>

            <div class="steps">
              <div class="step">
                <div class="step-icon">💳</div>
                <div class="step-content">
                  <p class="step-title">Define o saldo do cartão</p>
                  <p class="step-desc">Indica o valor total que tens disponível. Este é o teu ponto de partida — nenhum fluxo pode ultrapassar este valor.</p>
                </div>
              </div>

              <div class="step">
                <div class="step-icon">📦</div>
                <div class="step-content">
                  <p class="step-title">Cria os teus fluxos</p>
                  <p class="step-desc">Divide o dinheiro em categorias: Renda, Alimentação, Lazer, Poupança… Cada fluxo recebe uma fatia do teu saldo.</p>
                </div>
              </div>

              <div class="step">
                <div class="step-icon">⚡</div>
                <div class="step-content">
                  <p class="step-title">Activa o fluxo antes de gastar</p>
                  <p class="step-desc">Vais ao supermercado? Activa "Alimentação". Vais a um restaurante? Activa "Lazer". O fluxo activo é o teu "cartão virtual do momento".</p>
                </div>
              </div>

              <div class="step">
                <div class="step-icon">➕</div>
                <div class="step-content">
                  <p class="step-title">Regista os gastos rapidamente</p>
                  <p class="step-desc">Usa o botão <strong>+</strong> para registar cada despesa no fluxo activo. O saldo actualiza em tempo real e recebes alertas a 80%, 90% e 100%.</p>
                </div>
              </div>

              <div class="step">
                <div class="step-icon">📊</div>
                <div class="step-content">
                  <p class="step-title">Acompanha e ajusta</p>
                  <p class="step-desc">Clica em qualquer fluxo para ver o histórico completo, ajustar a alocação, ou adicionar e remover gastos individualmente.</p>
                </div>
              </div>

              <div class="step">
                <div class="step-icon">🔄</div>
                <div class="step-content">
                  <p class="step-title">Reset no início do mês</p>
                  <p class="step-desc">Ao receber o salário, usa <em>Reset Mensal</em> para recomeçar do zero — redefine os fluxos com os novos valores do mês.</p>
                </div>
              </div>
            </div>
          </div>

          <div class="help-footer">
            <button class="help-cta" (click)="showHelp.set(false)">Começar a usar →</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .navbar {
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      height: 60px;
      background: rgba(8,12,20,0.85);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }

    .nav-logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .logo-text {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      font-size: 1.1rem;
      color: #F1F5F9;
      letter-spacing: -0.02em;
    }

    .logo-accent { color: #3B82F6; }

    .nav-center {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
    }

    .month-badge {
      font-family: 'Inter', sans-serif;
      font-size: 0.75rem;
      font-weight: 500;
      color: #94A3B8;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      padding: 4px 12px;
      border-radius: 20px;
      text-transform: capitalize;
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .help-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      background: rgba(59,130,246,0.08);
      border: 1px solid rgba(59,130,246,0.15);
      border-radius: 8px;
      color: #60A5FA;
      font-family: 'Inter', sans-serif;
      font-size: 0.78rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: rgba(59,130,246,0.15);
        border-color: rgba(59,130,246,0.35);
      }
    }

    .reset-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      color: #94A3B8;
      font-family: 'Inter', sans-serif;
      font-size: 0.78rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: rgba(239,68,68,0.1);
        border-color: rgba(239,68,68,0.3);
        color: #FCA5A5;
      }
    }

    @media (max-width: 540px) {
      .nav-center { display: none; }
      .help-btn span, .reset-btn span { display: none; }
      .help-btn, .reset-btn { padding: 7px 10px; }
    }

    /* ── Help Modal ── */
    .help-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(8px);
      z-index: 300;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      animation: backdrop-in 0.2s ease;
    }

    .help-modal {
      width: 100%;
      max-width: 520px;
      max-height: 90vh;
      background: #0F1629;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 24px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: scale-in 0.25s cubic-bezier(0.22,1,0.36,1);
    }

    .help-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 24px 24px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      flex-shrink: 0;
    }

    .help-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.1rem;
      font-weight: 700;
      color: #F1F5F9;
    }

    .help-sub {
      font-family: 'Inter', sans-serif;
      font-size: 0.75rem;
      color: #3B82F6;
      margin-top: 3px;
    }

    .help-close {
      background: rgba(255,255,255,0.06);
      border: none;
      border-radius: 8px;
      color: #64748B;
      cursor: pointer;
      padding: 6px;
      display: flex;
      flex-shrink: 0;
      transition: background 0.15s, color 0.15s;
      &:hover { background: rgba(255,255,255,0.1); color: #F1F5F9; }
    }

    .help-body {
      overflow-y: auto;
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .help-intro {
      font-family: 'Inter', sans-serif;
      font-size: 0.85rem;
      color: #94A3B8;
      line-height: 1.6;
      padding: 14px 16px;
      background: rgba(59,130,246,0.06);
      border: 1px solid rgba(59,130,246,0.12);
      border-radius: 12px;

      strong { color: #F1F5F9; font-weight: 600; }
    }

    .steps {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .step {
      display: flex;
      gap: 14px;
      padding: 14px;
      border-radius: 12px;
      transition: background 0.15s;

      &:hover { background: rgba(255,255,255,0.03); }
    }

    .step-icon {
      font-size: 1.4rem;
      line-height: 1;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .step-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.9rem;
      font-weight: 600;
      color: #F1F5F9;
      margin-bottom: 4px;
    }

    .step-desc {
      font-family: 'Inter', sans-serif;
      font-size: 0.8rem;
      color: #64748B;
      line-height: 1.55;

      strong { color: #F1F5F9; }
      em { color: #94A3B8; font-style: normal; }
    }

    .help-footer {
      padding: 16px 24px 20px;
      border-top: 1px solid rgba(255,255,255,0.06);
      flex-shrink: 0;
    }

    .help-cta {
      width: 100%;
      padding: 12px;
      background: #3B82F6;
      border: none;
      border-radius: 12px;
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

    @keyframes scale-in {
      from { opacity: 0; transform: scale(0.94); }
      to   { opacity: 1; transform: scale(1); }
    }
  `]
})
export class NavbarComponent {
  private flowService = inject(FlowService);
  private alertService = inject(AlertService);

  showHelp = signal(false);

  get currentMonth(): string {
    return new Intl.DateTimeFormat('pt-AO', { month: 'long', year: 'numeric' }).format(new Date());
  }

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
