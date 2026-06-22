# KumbuFlow

> Gestão financeira pessoal pelo método dos envelopes digitais

**Demo ao vivo:** [https://a-man-dio.github.io/KumbuFlow/](https://a-man-dio.github.io/KumbuFlow/)

---

## Português

### O que é o KumbuFlow?

O KumbuFlow é uma aplicação web de finanças pessoais baseada no **método dos envelopes**. A ideia é simples: em vez de teres um saldo único e gastares sem controlo, divides o teu dinheiro em categorias chamadas **fluxos** — cada uma com um propósito e um limite definido. Como envelopes físicos, mas no telemóvel.

A aplicação foi construída a pensar no contexto angolano, com valores em **Kwanza (Kz)** e formatação de datas em português de Angola.

---

### Funcionalidades

- **Saldo do cartão** — Define o valor total que tens disponível. Toda a alocação de fluxos é limitada por este valor.
- **Fluxos (envelopes)** — Cria categorias de despesa (Renda, Alimentação, Lazer, etc.) e aloca um valor a cada uma.
- **Cartões aquário animados** — Cada fluxo é representado por um card com animação de água que sobe e desce conforme o saldo restante. A cor da água muda de verde para vermelho à medida que o orçamento se esgota.
- **Activação de fluxo** — Antes de gastar, activas o fluxo correspondente à categoria. O botão **+** regista gastos directamente nesse fluxo.
- **Alertas progressivos** — Recebe notificações automáticas quando um fluxo atinge 80%, 90% e 100% do orçamento.
- **Detalhes do fluxo** — Clica em qualquer fluxo para ver o histórico completo de gastos, um gráfico doughnut de distribuição, e opções para adicionar ou remover gastos individualmente.
- **Ajuste de alocação** — Aumenta ou reduz o valor alocado a um fluxo a qualquer momento, dentro do saldo disponível.
- **Reset mensal** — Reinicia todos os gastos no início de cada mês, mantendo a estrutura de fluxos.
- **Tutorial integrado** — Botão "Como funciona" no header explica o método a novos utilizadores.

---

### Como usar

#### 1. Define o teu saldo
No dashboard, clica em **Editar** ao lado do "Saldo do Cartão" e introduz o valor total que tens disponível no teu cartão ou conta.

#### 2. Cria os teus fluxos
Clica no cartão **"Novo Fluxo"** (com o ícone +). Escolhe um nome, um ícone e define quanto dinheiro queres alocar a essa categoria. O valor não pode ultrapassar o saldo livre disponível.

#### 3. Activa um fluxo antes de gastar
Quando fores efectuar uma compra, clica no cartão do fluxo correspondente e selecciona **"Ativar Fluxo"**. O fluxo activo fica destacado a azul no dashboard.

#### 4. Regista os gastos
Com um fluxo activo, clica no botão **+** (canto inferior direito) para registar um gasto. Indica o valor e uma descrição. O saldo do fluxo actualiza-se em tempo real.

#### 5. Acompanha os detalhes
Clica em qualquer fluxo e selecciona **"Ver Detalhes"** para acederes ao histórico completo, ao gráfico de distribuição de gastos e às opções de gestão.

#### 6. Ajusta as alocações
Na página de detalhes de um fluxo, clica em **"Alterar Alocação"** para redistribuir o dinheiro entre fluxos conforme as tuas necessidades do mês.

#### 7. Reset no fim do mês
Quando começar um novo mês, clica em **Reset Mensal** no header para reiniciar todos os gastos e começar do zero.

---

### Tecnologias utilizadas

| Tecnologia | Versão | Uso |
|---|---|---|
| Angular | 20 | Framework principal |
| TypeScript | 5.x | Linguagem de desenvolvimento |
| Chart.js | 4.x | Gráfico doughnut nos detalhes do fluxo |
| SCSS | — | Estilos com tema escuro |
| Angular Signals | — | Gestão de estado reactivo |

- **Sem backend** — Todos os dados são estáticos (em memória). Não há base de dados nem autenticação.
- **Standalone components** — Arquitectura moderna Angular sem NgModules.
- **Hash routing** — Compatível com GitHub Pages.

---

### Correr localmente

```bash
# Clonar o repositório
git clone https://github.com/A-man-dio/KumbuFlow.git
cd KumbuFlow

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
ng serve
```

Abre o browser em `http://localhost:4200/`.

### Build e deploy para GitHub Pages

```bash
# Build com o base-href correcto
ng build --base-href "/KumbuFlow/"

# Publicar no GitHub Pages
npx angular-cli-ghpages --dir=dist/money-flow/browser
```

---

### Desenvolvido por

**A_man_dio IV** — Desenvolvedor angolano

---

---

## English

### What is KumbuFlow?

KumbuFlow is a personal finance web application based on the **envelope budgeting method**. The idea is simple: instead of having a single balance and spending without control, you divide your money into categories called **flows** — each with a purpose and a defined limit. Like physical envelopes, but on your phone.

The app was built with the Angolan context in mind, with values in **Kwanza (Kz)** and dates formatted in Angolan Portuguese.

---

### Features

- **Card balance** — Set the total amount you have available. All flow allocations are constrained by this value.
- **Flows (envelopes)** — Create spending categories (Rent, Food, Leisure, etc.) and allocate a budget to each one.
- **Animated aquarium cards** — Each flow is represented by a card with a water animation that rises and falls based on the remaining balance. The water colour shifts from green to red as the budget is consumed.
- **Flow activation** — Before spending, you activate the flow that matches the purchase category. The **+** button registers expenses directly into that flow.
- **Progressive alerts** — Receive automatic toast notifications when a flow reaches 80%, 90%, and 100% of its budget.
- **Flow details** — Click any flow to view the full spending history, a doughnut chart showing expense distribution, and options to add or remove individual transactions.
- **Allocation adjustment** — Increase or decrease a flow's allocated amount at any time, within the available free balance.
- **Monthly reset** — Resets all spending at the start of each month while keeping the flow structure intact.
- **Built-in tutorial** — A "How it works" button in the header explains the method to new users.

---

### How to use

#### 1. Set your balance
On the dashboard, click **Edit** next to "Card Balance" and enter the total amount available in your card or account.

#### 2. Create your flows
Click the **"New Flow"** card (with the + icon). Choose a name, an icon, and set how much money you want to allocate to that category. The amount cannot exceed your available free balance.

#### 3. Activate a flow before spending
When you are about to make a purchase, click the relevant flow card and select **"Ativar Fluxo"** (Activate Flow). The active flow is highlighted in blue on the dashboard.

#### 4. Register expenses
With an active flow, click the **+** button (bottom right corner) to register an expense. Enter the amount and a description. The flow balance updates in real time.

#### 5. Check the details
Click any flow and select **"Ver Detalhes"** (View Details) to access the full transaction history, the expense distribution chart, and management options.

#### 6. Adjust allocations
On the flow detail page, click **"Alterar Alocação"** (Change Allocation) to redistribute money between flows according to your monthly needs.

#### 7. Monthly reset
When a new month begins, click **Reset Mensal** in the header to reset all spending and start fresh.

---

### Tech stack

| Technology | Version | Usage |
|---|---|---|
| Angular | 20 | Main framework |
| TypeScript | 5.x | Development language |
| Chart.js | 4.x | Doughnut chart in flow details |
| SCSS | — | Styles with dark theme |
| Angular Signals | — | Reactive state management |

- **No backend** — All data is static (in-memory). No database or authentication.
- **Standalone components** — Modern Angular architecture without NgModules.
- **Hash routing** — Compatible with GitHub Pages.

---

### Run locally

```bash
# Clone the repository
git clone https://github.com/A-man-dio/KumbuFlow.git
cd KumbuFlow

# Install dependencies
npm install

# Start development server
ng serve
```

Open your browser at `http://localhost:4200/`.

### Build and deploy to GitHub Pages

```bash
# Build with the correct base-href
ng build --base-href "/KumbuFlow/"

# Publish to GitHub Pages
npx angular-cli-ghpages --dir=dist/money-flow/browser
```

---

### Developed by

**A_man_dio IV** — Angolan developer
