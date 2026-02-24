(function() {
  const LOG_PREFIX = '[Pikachu]';
  const log = (...args) => console.log(LOG_PREFIX, ...args);
  const warn = (...args) => console.warn(LOG_PREFIX, ...args);

  const INTERVALS = buildIntervals([
    { start: 1, end: 5, step: 2 },
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
    lastSessionId: getPosthog()?.get_session_id?.() ?? null,
    visibleEntries: [],
    visibleSnapshot: [],
    lastActivityAt: Date.now(),
    leftSent: false,
    posthogSeen: false,
    utmCleaned: false,
    idleSince: null
  };

  const IDLE_LIMIT_MS = 60000;
  const ACTIVITY_EVENTS = ['mousemove', 'pointermove', 'scroll', 'keydown', 'touchstart', 'pointerdown'];
  const VISIBLE_OFFSET_MIN = -25;
  const VISIBLE_OFFSET_MAX = 125;

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

  function withEngagement(payload = {}) {
    return {
      ...payload,
      seconds: state.engagementTime,
      percent: state.scrollDepth
    };
  }

  function updateVisibleEntries(entries = []) {
    state.visibleEntries = filterEntriesByOffset(entries);
    if (!state.visibleSnapshot.length) {
      state.visibleSnapshot = state.visibleEntries.slice();
    }
  }

  function updateVisibleSnapshot(entries = []) {
    state.visibleSnapshot = filterEntriesByOffset(entries);
  }

  function getVisibleSnapshot() {
    if (state.visibleSnapshot.length > 0) {
      return state.visibleSnapshot.slice();
    }
    if (state.visibleEntries.length > 0) {
      return state.visibleEntries.slice();
    }
    const mapEntries = window.PikachuVisibleMap?.entries ?? [];
    return filterEntriesByOffset(mapEntries);
  }

  function filterEntriesByOffset(entries = []) {
    return entries.filter(entry => {
      if (!entry) return false;
      if (typeof entry['offset-pt'] !== 'number') return true;
      return entry['offset-pt'] >= VISIBLE_OFFSET_MIN && entry['offset-pt'] <= VISIBLE_OFFSET_MAX;
    });
  }

  function getIdleSecondsSinceActivity() {
    const reference = state.idle && state.idleSince ? state.idleSince : Date.now();
    const elapsed = Math.max(0, reference - state.lastActivityAt);
    return Math.round(elapsed / 1000);
  }

  function ensureUTMCleanup() {
    if (state.utmCleaned) return;
    cleanupUTMParams();
    state.utmCleaned = true;
  }

  function markPosthogSeen() {
    if (state.posthogSeen) return;
    state.posthogSeen = true;
    ensureUTMCleanup();
  }

  function cleanupUTMParams() {
    if (typeof window === 'undefined' || !window.history?.replaceState) return;
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const removal = [];
    params.forEach((_, key) => {
      if (key.toLowerCase().startsWith('utm_')) removal.push(key);
    });
    if (removal.length === 0) return;
    removal.forEach(key => params.delete(key));
    const query = params.toString();
    const nextUrl = `${url.origin}${url.pathname}${query ? `?${query}` : ''}${url.hash}`;
    window.history.replaceState({}, '', nextUrl);
    log('Removed UTM parameters from URL');
  }

  function initVisibleTracking() {
    console.log("Initializing visible tracking");
    document.addEventListener('pikachu:visible-map', event => {
      updateVisibleEntries(event?.detail?.entries ?? []);
    });

    document.addEventListener('pikachu:visible-update', event => {
      updateVisibleSnapshot(event?.detail?.visible ?? []);
    });
  }

  function sendPHEvent(name, params = {}) {
    log(name, params);

    const client = getPosthog();
    if (client?.capture) {
      markPosthogSeen();
      client.capture(name, params);
    } else {
      log('PostHog not loaded');
      ensureUTMCleanup();
    }
  }

  function sendRedditPixelEvent(name, params = {}) {
    if (typeof window === 'undefined' || typeof window.rdt === 'undefined') {
      log('Reddit Pixel not loaded');
      return;
    }

    if(Object.keys(params).length === 0) {
      window.rdt('track', name);
      log(`Reddit Pixel: ${name}`);
    } else {
      window.rdt('track', name, params);
      log(`Reddit Pixel: ${name}`, params);
    }
  }

  function sendPHBeacon(name, params = {}) {
    log(`${name} (beacon)`, params);

    const client = getPosthog();
    if (!client) {
      log('PostHog not loaded');
      ensureUTMCleanup();
      return;
    }

    if (typeof client.sendBeacon === 'function') {
      markPosthogSeen();
      client.sendBeacon(name, params);
      return;
    }

    warn('PostHog sendBeacon unavailable; falling back to capture');
    sendPHEvent(name, params);
  }

  function sendLeftEvent(trigger) {
    if (state.leftSent) return;
    if (state.engagementTime < 10) {
      log('Skipping left event due to insufficient engagement time');
      return;
    }
    state.leftSent = true;
    log('Sending left event', { trigger, snapshot: getVisibleSnapshot() });
    sendPHBeacon('left', withEngagement({
      visible: getVisibleSnapshot(),
      idle: getIdleSecondsSinceActivity(),
      trigger
    }));
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

  function scheduleIdleTimeout(updateTimestamp = false) {
    if (state.idleTimerId) clearTimeout(state.idleTimerId);
    if (updateTimestamp) state.lastActivityAt = Date.now();
    state.idleTimerId = setTimeout(() => {
      state.idle = true;
      state.idleSince = Date.now();
      log('Became IDLE');
      updateTimerState();
    }, IDLE_LIMIT_MS);
  }

  function markActivity(evtName) {
    if (state.idle) {
      state.idle = false;
      state.idleSince = null;
      log(`Became ACTIVE via ${evtName}`);
      updateTimerState();
    }
    state.lastActivityAt = Date.now();
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
      state.intervalIndex += 1;
      sendPHEvent('engaged', {
        seconds,
        percent: state.scrollDepth
      });

      if(seconds % 60 === 0) {
        sendRedditPixelEvent('ViewContent');
      }
    }
  }

  function checkValuedReader() {
    if (state.valuedFired || !valuedEnabled) return;

    const timeThreshold = valuedConfig.valued_time;
    const scrollThreshold = valuedConfig.valued_scroll;
    const timeMet = timeThreshold === undefined || state.engagementTime >= timeThreshold;
    const scrollMet = scrollThreshold === undefined || state.scrollDepth >= scrollThreshold || state.lastScrollMilestone >= scrollThreshold;

    if (timeMet && scrollMet) {
      state.valuedFired = true;
      
      sendPHEvent('valued', {
        percent: state.scrollDepth,
        seconds: state.engagementTime,
        config: valuedConfig
      });

      sendRedditPixelEvent('Lead');
    }
  }

  function watchForNewSession() {
    const client = getPosthog();
    const currentSessionId = client?.get_session_id?.() ?? null;
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
    const becameVisible = document.visibilityState === 'visible';
    state.visible = becameVisible;
    if (becameVisible) {
      state.leftSent = false;
    } else {
      log('Visibility hidden, preparing to send left event');
      sendLeftEvent('visibilitychange');
    }
    log(`${document.visibilityState}, time: ${state.engagementTime}s`);
    updateTimerState();
  });

  window.addEventListener('pagehide', () => {
    const wasVisible = state.visible;
    state.visible = false;
    if (!wasVisible) {
      log('Skipping left event; tab not visible during pagehide');
      return;
    }
    sendLeftEvent('pagehide');
    updateTimerState();
  });
  window.addEventListener('pageshow', () => {
    state.visible = true;
    state.leftSent = false;
    scheduleIdleTimeout(true);
    updateTimerState();
  });

  try {
    ACTIVITY_EVENTS.forEach(evt =>
      window.addEventListener(evt, () => markActivity(evt), { passive: true })
    );

    if (state.visible) {
      log('Page visible at load; waiting for activity...');
    } else {
      log('Page hidden at load; will start when visible and active.');
    }
    scheduleIdleTimeout(true);
    initVisibleTracking();
  } catch (initError) {
    warn('Failed to initialize activity tracking:', initError);
  }

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
        sendPHEvent('scrolled', {
          percent: state.scrollDepth,
          seconds: state.engagementTime
        });
        state.lastScrollMilestone = milestone;
      }
    }, { passive: true });
  }

  function setupShareTracking() {
    const shareLinks = document.querySelectorAll('.shares > a[data-target]');
    if (shareLinks.length === 0) return;

    shareLinks.forEach(link => {
      link.addEventListener('click', () => {
        const target = link.getAttribute('data-target') || 'unknown';
        sendPHEvent('shared', withEngagement({ target }));
      });
    });
  }

  function sendVisitEvent() {
    sendRedditPixelEvent('PageVisit');
  }

  function onDocumentReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  onDocumentReady(setupScrollTracking);
  onDocumentReady(setupShareTracking);
  onDocumentReady(sendVisitEvent);

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
      if (payload) sendPHEvent('content-selected', withEngagement(payload));
    }, 500);
  }

  function handleCopy() {
    try {
      const payload = analyzeSelection();
      if (payload) sendPHEvent('content-copied', withEngagement(payload));
    } catch (error) {
      warn('Error handling copy event:', error);
    }
  }

  document.addEventListener('selectionchange', handleSelectionChange, { passive: true });
  document.addEventListener('copy', handleCopy, { passive: true });
})();
  function getPosthog() {
    if (typeof window === 'undefined') return null;
    if (typeof window.posthog === 'undefined') return null;
    return window.posthog;
  }
