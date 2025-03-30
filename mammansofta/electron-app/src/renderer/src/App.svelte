<script>
  import Kentat from './components/Kentat.svelte';
  import Taulukko from './components/Taulukko.svelte';
  import Kuukaudet from './components/Kuukaudet.svelte';
</script>

<main>
 
  <div class="scrollable-container">
    <h1>Asiakasraportointi</h1>
    <Kentat />
    <Kuukaudet />
    <Taulukko />
  </div>
</main>

<style>
  h1,
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0;
    padding: 0;
    font-family: Arial, sans-serif;
  }

  .scrollable-container {
    overflow-y: auto; /* Enables vertical scrolling */
    max-height: 100vh; /* Ensures the container does not exceed the viewport height */
    width: 100%;
    padding: 20px;
    box-sizing: border-box; /* Ensures padding is included in the element's total width and height */
  }
</style>