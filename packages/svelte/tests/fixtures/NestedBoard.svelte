<script lang="ts">
  import { getDnDGem, dndgemContainer, dndgemItem } from '../../src/index.js';
  import { hostAction, type FakeBox } from '../helpers.js';

  const CONTAINER_BOX: FakeBox = { left: 0, top: 0, width: 400, height: 200 };
  const CHART_BOX: FakeBox = { left: 8, top: 8, width: 120, height: 60 };
  const TABLE_BOX: FakeBox = { left: 140, top: 8, width: 80, height: 60 };

  const { state: layoutState, ready } = getDnDGem();
</script>

<div>
  <div data-testid="board" use:hostAction={{ box: CONTAINER_BOX, action: dndgemContainer }}>
    <article
      data-testid="item-chart"
      use:hostAction={{ box: CHART_BOX, action: dndgemItem, arg: 'chart' }}
    >
      chart
    </article>
    <article
      data-testid="item-table"
      use:hostAction={{ box: TABLE_BOX, action: dndgemItem, arg: 'table' }}
    >
      table
    </article>
  </div>
  <div data-testid="ready">{$ready ? 'yes' : 'no'}</div>
  <div data-testid="chart-x">{$layoutState?.resolved.placements.chart?.x ?? ''}</div>
</div>
