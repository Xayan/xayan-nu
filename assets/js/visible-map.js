(function() {
  const LOG_PREFIX = '[PikachuVisible]';
  const log = (...args) => console.log(LOG_PREFIX, ...args);
  const warn = (...args) => console.warn(LOG_PREFIX, ...args);

  const TRUNCATE_LIMIT = 32;
  const DATASET_KEYS = {
    index: 'n',
    content: 'content'
  };
  const VISIBLE_EVENT_NAME = 'pikachu:visible-update';

  const PROCESSORS = {
    p: element => buildTextEntry('p', element, { truncate: true }),
    h1: element => buildTextEntry('h1', element, { truncate: false }),
    h2: element => buildTextEntry('h2', element, { truncate: false }),
    h3: element => buildTextEntry('h3', element, { truncate: false }),
    h4: element => buildTextEntry('h4', element, { truncate: false }),
    h5: element => buildTextEntry('h5', element, { truncate: false }),
    h6: element => buildTextEntry('h6', element, { truncate: false }),
    ul: element => buildListEntry('ul', element),
    ol: element => buildListEntry('ol', element)
  };

  const state = {
    entries: [],
    entriesByIndex: new Map(),
    visibleSet: new Set(),
    observer: null,
    cleanup: null,
    elementsByIndex: new Map()
  };

  function normalizeWhitespace(text = '') {
    return text.replace(/\s+/g, ' ').trim();
  }

  function truncateText(text, limit = TRUNCATE_LIMIT) {
    if (text.length <= limit) return text;
    return `${text.slice(0, limit).trim()}...`;
  }

  function buildTextEntry(tag, element, options = {}) {
    const normalized = normalizeWhitespace(element?.textContent || '');
    if (!normalized) return null;
    const shouldTruncate = options.truncate ?? false;
    return {
      element: tag,
      content: shouldTruncate ? truncateText(normalized) : normalized
    };
  }

  function buildListEntry(tag, element) {
    const firstItem = element?.querySelector('li');
    if (!firstItem) return null;
    const normalized = normalizeWhitespace(firstItem.textContent || '');
    if (!normalized) return null;
    return {
      element: tag,
      content: truncateText(normalized)
    };
  }

  function buildVisibleEntry(element, index) {
    const tag = element?.tagName?.toLowerCase();
    if (!tag || !PROCESSORS[tag]) return null;

    try {
      const payload = PROCESSORS[tag](element);
      if (!payload) return null;
      return {
        n: index,
        element: payload.element,
        content: payload.content
      };
    } catch (error) {
      warn('Failed to process element', element, error);
      return null;
    }
  }

  function resolveContentContainer() {
    const preferred = document.querySelector('article.post-content > section.post-content');
    if (preferred) return preferred;
    const section = document.querySelector('section.post-content');
    if (section) return section;
    return document.querySelector('.post-content');
  }

  function setElementMetadata(element, entry) {
    if (!element || !entry) return;
    try {
      element.dataset[DATASET_KEYS.index] = String(entry.n);
      element.dataset[DATASET_KEYS.content] = entry.content || '';
    } catch (error) {
      warn('Failed to annotate element', element, error);
    }
  }

  function collectVisibleMap() {
    const container = resolveContentContainer();
    if (!container) return { entries: [], container: null, elements: [] };

    const children = Array.from(container.children || []);
    const map = [];
    const elementTuples = [];
    children.forEach(child => {
      const entry = buildVisibleEntry(child, map.length + 1);
      if (!entry) return;
      setElementMetadata(child, entry);
      map.push(entry);
      elementTuples.push([entry.n, child]);
    });
    return { entries: map, container, elements: elementTuples };
  }

  function updateState(entries, elements = []) {
    state.entries = entries;
    state.entriesByIndex = new Map(entries.map(entry => [entry.n, entry]));
    state.visibleSet.clear();
    state.elementsByIndex = new Map(elements);
  }

  function getElementOffsets(element) {
    if (!element || typeof element.getBoundingClientRect !== 'function') {
      return { px: null, pt: null };
    }
    const rect = element.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const viewHeight = window.innerHeight || document.documentElement.clientHeight || 1;
    return {
      px: midpoint,
      pt: (midpoint / viewHeight) * 100
    };
  }

  function enrichEntry(entry, element) {
    if (!entry) return null;
    const offsets = getElementOffsets(element);
    return {
      ...entry,
      'offset-px': offsets.px,
      'offset-pt': offsets.pt
    };
  }

  function getVisibleEntries() {
    const indexes = Array.from(state.visibleSet).sort((a, b) => a - b);
    return indexes
      .map(index => enrichEntry(state.entriesByIndex.get(index), state.elementsByIndex.get(index)))
      .filter(Boolean);
  }

  function publishVisibilityUpdate() {
    const visibleEntries = getVisibleEntries();
    if (window.PikachuVisibleMap) {
      window.PikachuVisibleMap.visible = visibleEntries;
      window.PikachuVisibleMap.visibleIndexes = visibleEntries.map(entry => entry.n);
      window.PikachuVisibleMap.updatedAt = Date.now();
    }

    try {
      const event = new CustomEvent(VISIBLE_EVENT_NAME, { detail: { visible: visibleEntries } });
      document.dispatchEvent(event);
    } catch (error) {
      warn('Failed to dispatch visible update event', error);
    }
  }

  function publishVisibleMap(entries, elements) {
    updateState(entries, elements);
    const enrichedEntries = entries.map(entry =>
      enrichEntry(entry, state.elementsByIndex.get(entry.n))
    );

    window.PikachuVisibleMap = {
      entries: enrichedEntries,
      collectedAt: Date.now(),
      visible: [],
      visibleIndexes: [],
      updatedAt: Date.now()
    };

    try {
      const event = new CustomEvent('pikachu:visible-map', { detail: { entries: enrichedEntries } });
      document.dispatchEvent(event);
    } catch (error) {
      warn('Failed to dispatch visible map event', error);
    }
  }

  function syncVisibilityForElement(element, isVisible) {
    const rawIndex = element?.dataset?.[DATASET_KEYS.index];
    const index = rawIndex ? parseInt(rawIndex, 10) : NaN;
    if (!index) return false;
    const currentlyVisible = state.visibleSet.has(index);
    if (isVisible && !currentlyVisible) {
      state.visibleSet.add(index);
      return true;
    }
    if (!isVisible && currentlyVisible) {
      state.visibleSet.delete(index);
      return true;
    }
    return false;
  }

  function isInViewport(element) {
    if (!element || typeof element.getBoundingClientRect !== 'function') return false;
    const rect = element.getBoundingClientRect();
    const viewHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewWidth = window.innerWidth || document.documentElement.clientWidth;
    return rect.bottom > 0 && rect.right > 0 && rect.top < viewHeight && rect.left < viewWidth;
  }

  function evaluateVisibility(elements) {
    let changed = false;
    elements.forEach(el => {
      changed = syncVisibilityForElement(el, isInViewport(el)) || changed;
    });
    if (changed) publishVisibilityUpdate();
  }

  function observeVisibleElements(container) {
    const targets = Array.from(container.querySelectorAll('[data-n]'));
    if (targets.length === 0) return;

    if ('IntersectionObserver' in window) {
      state.observer = new IntersectionObserver(
        entries => {
          let changed = false;
          entries.forEach(entry => {
            changed = syncVisibilityForElement(entry.target, entry.isIntersecting) || changed;
          });
          if (changed) publishVisibilityUpdate();
        },
        { threshold: [0, 0.1, 0.25] }
      );
      targets.forEach(target => state.observer.observe(target));
      evaluateVisibility(targets);
      return;
    }

    const handler = () => evaluateVisibility(targets);
    window.addEventListener('scroll', handler, { passive: true });
    window.addEventListener('resize', handler);
    handler();
    state.cleanup = () => {
      window.removeEventListener('scroll', handler);
      window.removeEventListener('resize', handler);
    };
  }

  function onDocumentReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  }

  onDocumentReady(() => {
    const { entries, container, elements } = collectVisibleMap();
    publishVisibleMap(entries, elements);
    if (container) observeVisibleElements(container);
    log('Collected visible map', entries);
  });
})();
