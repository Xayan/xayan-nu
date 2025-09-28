<svelte:options customElement="tree-view" />

<script>
  import { Tree } from '@keenmate/svelte-treeview';
  import '@keenmate/svelte-treeview/styles.scss';
  
  // Props that can be passed from Hugo
  let { data = "[]", searchable = false, expandedByDefault = false } = $props();

  // Parse the data if it's a JSON string
  let treeData = $state([]);
  
  $effect(() => {
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        treeData = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        // If JSON parsing fails, try to get data from data attribute
        console.warn('Failed to parse tree data from props, trying attribute:', e);
        treeData = [];
      }
    } else if (Array.isArray(data)) {
      treeData = data;
    }
  });

  let searchText = $state('');
  
  function handleNodeClick(node) {
    console.log('Node clicked:', node.data);
  }

  // Watch for data attribute changes (for Hugo integration)
  let element = $state(null);
  
  $effect(() => {
    if (element) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'data') {
            const newData = element.getAttribute('data');
            if (newData) {
              try {
                const parsed = JSON.parse(newData);
                treeData = Array.isArray(parsed) ? parsed : [];
              } catch (e) {
                console.warn('Failed to parse updated tree data:', e);
              }
            }
          }
        });
      });
      
      observer.observe(element, { attributes: true });
      
      return () => observer.disconnect();
    }
  });
</script>

<div bind:this={element} class="tree-container">
  {#if searchable}
    <div class="search-container">
      <input 
        type="text" 
        placeholder="Search tree..." 
        bind:value={searchText}
        class="tree-search"
      />
    </div>
  {/if}
  
  {#if treeData.length > 0}
    <Tree
      data={treeData}
      idMember="id"
      pathMember="path"
      displayValueMember="name"
      shouldUseInternalSearchIndex={searchable || false}
      searchValueMember="name"
      bind:searchText
      onNodeClicked={handleNodeClick}
      selectedNodeClass="tree-selected"
    >
      {#snippet nodeTemplate(node)}
        <div class="tree-node">
          {#if node.data.icon}
            <span class="tree-icon">{node.data.icon}</span>
          {/if}
          <span class="tree-name">{node.data.name}</span>
          {#if node.data.description}
            <small class="tree-description">({node.data.description})</small>
          {/if}
        </div>
      {/snippet}
    </Tree>
  {:else}
    <div class="tree-placeholder">
      <p>Loading tree data...</p>
    </div>
  {/if}
</div>

<style>
  .tree-container {
    border: 1px solid var(--border-color, #ddd);
    border-radius: 8px;
    padding: 1rem;
    background: var(--bg-color, #fff);
    margin: 1rem 0;
  }

  .search-container {
    margin-bottom: 1rem;
  }

  .tree-search {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--input-border, #ccc);
    border-radius: 4px;
    font-family: inherit;
    font-size: 0.9rem;
  }

  .tree-node {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .tree-icon {
    font-size: 1.1em;
  }

  .tree-name {
    font-weight: 500;
  }

  .tree-description {
    color: var(--text-muted, #666);
    margin-left: 0.5rem;
  }

  .tree-placeholder {
    text-align: center;
    padding: 2rem;
    color: var(--text-muted, #666);
  }

  :global(.tree-selected) {
    background-color: var(--accent, #33ffab) !important;
    color: var(--text-on-accent, #000) !important;
    border-radius: 4px;
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .tree-container {
      --bg-color: #1a1a1a;
      --border-color: #333;
      --input-border: #444;
      --text-muted: #aaa;
    }
  }
</style>