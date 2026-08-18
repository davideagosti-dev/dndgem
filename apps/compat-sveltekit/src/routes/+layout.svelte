<script lang="ts">
  import '../styles.css';

  let { children } = $props();
</script>

<div data-testid="compat-shell">
  <nav>
    <a href="/" data-testid="nav-board">Board</a>
    <a href="/other" data-testid="nav-other">Other</a>
  </nav>
  {@render children()}
</div>
