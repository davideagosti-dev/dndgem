import { createLayoutSession, type LayoutSessionState } from '@dndgem/dom';
import './styles.css';

const board = document.querySelector('#board');
const status = document.querySelector('#status');
const chart = document.querySelector('#item-chart');
const table = document.querySelector('#item-table');
const details = document.querySelector('#item-details');
const metric = document.querySelector('#item-metric');

if (
  !(board instanceof HTMLElement) ||
  !(chart instanceof HTMLElement) ||
  !(table instanceof HTMLElement) ||
  !(details instanceof HTMLElement) ||
  !(metric instanceof HTMLElement)
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
      id: 'chart',
      element: chart,
      constraints: {
        minWidth: 120,
        minHeight: 64,
        minUsefulWidth: 180,
        minUsefulHeight: 72,
        preferredWidth: 240,
        preferredHeight: 96,
      },
    },
    {
      id: 'table',
      element: table,
      constraints: {
        minWidth: 160,
        minHeight: 72,
        minUsefulWidth: 220,
        minUsefulHeight: 96,
        preferredWidth: 280,
        preferredHeight: 140,
      },
    },
    {
      id: 'details',
      element: details,
      constraints: {
        minWidth: 100,
        minHeight: 80,
        minUsefulWidth: 140,
        minUsefulHeight: 120,
        preferredWidth: 180,
        preferredHeight: 160,
      },
    },
    {
      id: 'metric',
      element: metric,
      constraints: {
        minWidth: 72,
        minHeight: 64,
        minUsefulWidth: 88,
        minUsefulHeight: 72,
        preferredWidth: 96,
        preferredHeight: 80,
      },
    },
  ],
  desiredPlacements: {
    chart: { x: 12, y: 12, width: 240, height: 96 },
    table: { x: 264, y: 12, width: 280, height: 140 },
    details: { x: 12, y: 120, width: 180, height: 160 },
    metric: { x: 204, y: 168, width: 96, height: 80 },
  },
  onChange: renderStatus,
});

window.addEventListener('pagehide', () => {
  session.dispose();
});
