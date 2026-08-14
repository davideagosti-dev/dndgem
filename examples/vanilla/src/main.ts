import { createLayoutSession, type LayoutSessionState } from '@dndgem/dom';
import './styles.css';

const board = document.querySelector('#board');
const status = document.querySelector('#status');
const revenue = document.querySelector('#item-revenue');
const expenses = document.querySelector('#item-expenses');
const cashflow = document.querySelector('#item-cashflow');
const transactions = document.querySelector('#item-transactions');
const alerts = document.querySelector('#item-alerts');
const notes = document.querySelector('#item-notes');

if (
  !(board instanceof HTMLElement) ||
  !(revenue instanceof HTMLElement) ||
  !(expenses instanceof HTMLElement) ||
  !(cashflow instanceof HTMLElement) ||
  !(transactions instanceof HTMLElement) ||
  !(alerts instanceof HTMLElement) ||
  !(notes instanceof HTMLElement)
) {
  throw new Error('Vanilla example DOM nodes are missing');
}

function renderStatus(state: LayoutSessionState): void {
  if (!(status instanceof HTMLElement)) {
    return;
  }
  const validity = state.solver.evaluation.state;
  const phase = state.phase;
  status.textContent = `${validity} · ${phase}`;
}

const session = createLayoutSession({
  container: board,
  items: [
    {
      id: 'revenue',
      element: revenue,
      constraints: {
        minWidth: 96,
        minHeight: 64,
        minUsefulWidth: 140,
        minUsefulHeight: 72,
        preferredWidth: 180,
        preferredHeight: 88,
      },
    },
    {
      id: 'expenses',
      element: expenses,
      constraints: {
        minWidth: 96,
        minHeight: 64,
        minUsefulWidth: 140,
        minUsefulHeight: 72,
        preferredWidth: 180,
        preferredHeight: 88,
      },
    },
    {
      id: 'cashflow',
      element: cashflow,
      constraints: {
        minWidth: 160,
        minHeight: 96,
        minUsefulWidth: 220,
        minUsefulHeight: 120,
        preferredWidth: 280,
        preferredHeight: 160,
      },
    },
    {
      id: 'transactions',
      element: transactions,
      constraints: {
        minWidth: 180,
        minHeight: 120,
        minUsefulWidth: 240,
        minUsefulHeight: 160,
        preferredWidth: 300,
        preferredHeight: 200,
      },
    },
    {
      id: 'alerts',
      element: alerts,
      constraints: {
        minWidth: 72,
        minHeight: 64,
        minUsefulWidth: 96,
        minUsefulHeight: 72,
        preferredWidth: 120,
        preferredHeight: 80,
      },
    },
    {
      id: 'notes',
      element: notes,
      constraints: {
        minWidth: 100,
        minHeight: 80,
        minUsefulWidth: 140,
        minUsefulHeight: 100,
        preferredWidth: 200,
        preferredHeight: 140,
      },
    },
  ],
  desiredPlacements: {
    revenue: { x: 12, y: 12, width: 180, height: 88 },
    expenses: { x: 204, y: 12, width: 180, height: 88 },
    cashflow: { x: 396, y: 12, width: 280, height: 160 },
    transactions: { x: 12, y: 112, width: 300, height: 200 },
    alerts: { x: 324, y: 184, width: 120, height: 80 },
    notes: { x: 456, y: 184, width: 200, height: 140 },
  },
  onChange: renderStatus,
});

window.addEventListener('pagehide', () => {
  session.dispose();
});
