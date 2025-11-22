(function() {
  const LOG_PREFIX = '[Pikachu]';
  const log = (...args) => console.log(LOG_PREFIX, ...args);
  const warn = (...args) => console.warn(LOG_PREFIX, ...args);

  const INTERVALS = buildIntervals([
    { start: 5, end: 20, step: 5 },
    { start: 20, end: 60, step: 10 },
    { start: 60, end: 600, step: 30 },
    { start: 600, end: 7200, step: 60, inclusive: true }
  ]);

  const valuedConfig = readValuedConfig();
  const valuedEnabled = hasValuedConfig(valuedConfig);
  
  log("Hi. Whatcha doing here? Care to take a peek into analytics' logs?");
  log('Valued event configuration:', valuedConfig);
  log('Valued event enabled:', valuedEnabled);

  const state = {
    engagementTime: 0,
    intervalIndex: 0,
    scrollDepth: 0,
    valuedFired: false,
    lastScrollMilestone: 0,
    visible: document.visibilityState === 'visible',
    idle: true,
    timerId: null,
    idleTimerId: null,
    lastSessionId: posthog?.get_session_id?.() ?? null
  };

  const IDLE_LIMIT_MS = 60000;
  const ACTIVITY_EVENTS = ['mousemove', 'pointermove', 'scroll', 'keydown', 'touchstart', 'pointerdown'];

  function buildIntervals(ranges) {
    const output = [];
    ranges.forEach(({ start, end, step, inclusive }) => {
      const comparator = inclusive ? (value, limit) => value <= limit : (value, limit) => value < limit;
      for (let cursor = start; comparator(cursor, end); cursor += step) {
        output.push(cursor);
      }
    });
    return output;
  }

  function readValuedConfig() {
    const element = document.getElementById('valued-config');
    if (!element) return {};

    try {
      return JSON.parse(element.textContent);
    } catch (error) {
      warn('Failed to parse valued-config:', error);
      return {};
    }
  }

  function hasValuedConfig(config) {
    return config.valued_time !== undefined || config.valued_scroll !== undefined;
  }

  function sendPHEvent(name, params = {}) {
    log(name, params);

    if (typeof posthog !== 'undefined' && posthog.capture) {
      posthog.capture(name, params);
    } else {
      log('PostHog not loaded');
    }
  }

  function startTimer() {
    if (!state.timerId) {
      state.timerId = setInterval(tick, 1000);
      log('Timer START');
    }
  }

  function stopTimer(reason) {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
      log(`Timer STOP (${reason})`);
    }
  }

  function scheduleIdleTimeout() {
    if (state.idleTimerId) clearTimeout(state.idleTimerId);
    state.idleTimerId = setTimeout(() => {
      state.idle = true;
      log('Became IDLE');
      updateTimerState();
    }, IDLE_LIMIT_MS);
  }

  function markActivity(evtName) {
    if (state.idle) {
      state.idle = false;
      log(`Became ACTIVE via ${evtName}`);
      updateTimerState();
    }
    scheduleIdleTimeout();
  }

  function updateTimerState() {
    if (state.visible && !state.idle) {
      startTimer();
    } else {
      stopTimer(state.visible ? 'idle' : 'hidden');
    }
  }

  function tick() {
    if (!state.visible || state.idle) return;

    watchForNewSession();
    state.engagementTime += 1;
    checkValuedReader();

    if (state.intervalIndex < INTERVALS.length && state.engagementTime >= INTERVALS[state.intervalIndex]) {
      const seconds = INTERVALS[state.intervalIndex];
      sendPHEvent('engaged', { seconds });
      state.intervalIndex += 1;
    }
  }

  function checkValuedReader() {
    if (state.valuedFired || !valuedEnabled) return;

    const timeThreshold = valuedConfig.valued_time;
    const scrollThreshold = valuedConfig.valued_scroll;
    const timeMet = timeThreshold === undefined || state.engagementTime >= timeThreshold;
    const scrollMet = scrollThreshold === undefined || state.scrollDepth >= scrollThreshold;

    if (timeMet && scrollMet) {
      sendPHEvent('valued', {
        percent: state.scrollDepth,
        seconds: state.engagementTime,
        config: valuedConfig
      });
      state.valuedFired = true;
    }
  }

  function watchForNewSession() {
    const currentSessionId = posthog?.get_session_id?.() ?? null;
    if (currentSessionId && state.lastSessionId && currentSessionId !== state.lastSessionId) {
      log(`Session changed: ${state.lastSessionId} → ${currentSessionId}`);
      resetSessionState();
    }
    state.lastSessionId = currentSessionId;
  }

  function resetSessionState() {
    state.engagementTime = 0;
    state.intervalIndex = 0;
    state.valuedFired = false;
    state.lastScrollMilestone = 0;
  }

  document.addEventListener('visibilitychange', () => {
    state.visible = document.visibilityState === 'visible';
    log(`${document.visibilityState}, time: ${state.engagementTime}s`);
    updateTimerState();
  });

  window.addEventListener('pagehide', () => { state.visible = false; updateTimerState(); });
  window.addEventListener('pageshow', () => { state.visible = true; updateTimerState(); });

  ACTIVITY_EVENTS.forEach(evt =>
    window.addEventListener(evt, () => markActivity(evt), { passive: true })
  );

  if (state.visible) {
    log('Page visible at load; waiting for activity...');
  } else {
    log('Page hidden at load; will start when visible and active.');
  }
  scheduleIdleTimeout();

  function setupScrollTracking() {
    const vh = () => window.innerHeight;
    const giscus = document.querySelector('div.giscus');
    const targetY = giscus
      ? window.pageYOffset + giscus.getBoundingClientRect().top
      : Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);

    if (targetY < 4 * vh()) {
      log('Skipping scroll tracking — page too short');
      return;
    }

    log(giscus ? 'Using giscus TOP as 100%:' : 'Using PAGE BOTTOM as 100%', targetY);

    const thresholds = [];
    for (let percent = 10; percent <= 100; percent += 10) thresholds.push(percent);

    window.addEventListener('scroll', () => {
      const visibleBottom = window.scrollY + vh();
      const ratio = Math.max(0, Math.min(1, visibleBottom / targetY));
      state.scrollDepth = Math.floor(ratio * 100);

      const milestone = thresholds.reduce((highest, percent) => {
        if (state.scrollDepth >= percent && percent > highest) {
          return percent;
        }
        return highest;
      }, state.lastScrollMilestone);

      if (milestone > state.lastScrollMilestone) {
        sendPHEvent('scrolled', { percent: milestone });
        state.lastScrollMilestone = milestone;
      }
    }, { passive: true });
  }

  function onDocumentReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  function setupShareTracking() {
    const shareLinks = document.querySelectorAll('.shares > a[data-target]');
    if (shareLinks.length === 0) return;

    shareLinks.forEach(link => {
      link.addEventListener('click', () => {
        const target = link.getAttribute('data-target') || 'unknown';
        sendPHEvent('shared', { target });
      });
    });
  }

  onDocumentReady(setupScrollTracking);
  onDocumentReady(setupShareTracking);

  let selectionDebounceTimer = null;

  function analyzeSelection() {
    try {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;

      const text = selection.toString().trim();
      if (!text || !text.replace(/\s/g, '')) return null;

      let truncatedText = text;
      if (text.length > 255) {
        truncatedText = text.substring(0, 126) + '...' + text.substring(text.length - 126);
      }

      const imageSources = new Set();
      const linkHrefs = new Set();
      let paragraphCount = 0;

      for (let i = 0; i < selection.rangeCount; i += 1) {
        const range = selection.getRangeAt(i);
        const rangeContainer = document.createElement('div');
        rangeContainer.appendChild(range.cloneContents());

        paragraphCount += rangeContainer.querySelectorAll('p').length;

        rangeContainer.querySelectorAll('img').forEach(img => {
          if (img.src && img.src.trim()) imageSources.add(img.src);
        });

        rangeContainer.querySelectorAll('a').forEach(link => {
          if (link.href && link.href.trim()) linkHrefs.add(link.href);
        });
      }

      return {
        text: truncatedText,
        paragraphs: paragraphCount,
        images: Array.from(imageSources),
        links: Array.from(linkHrefs)
      };
    } catch (error) {
      warn('Error analyzing selection:', error);
      return null;
    }
  }

  function handleSelectionChange() {
    if (selectionDebounceTimer) clearTimeout(selectionDebounceTimer);

    selectionDebounceTimer = setTimeout(() => {
      const payload = analyzeSelection();
      if (payload) sendPHEvent('content-selected', payload);
    }, 500);
  }

  function handleCopy() {
    try {
      const payload = analyzeSelection();
      if (payload) sendPHEvent('content-copied', payload);
    } catch (error) {
      warn('Error handling copy event:', error);
    }
  }

  document.addEventListener('selectionchange', handleSelectionChange, { passive: true });
  document.addEventListener('copy', handleCopy, { passive: true });
})();
