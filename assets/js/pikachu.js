(function() {
  // --- Engagement schedule ---
  const intervals = [];
  for (let i = 5; i < 20; i += 5) intervals.push(i);
  for (let i = 20; i < 60; i += 10) intervals.push(i);
  for (let i = 60; i < 600; i += 30) intervals.push(i);
  for (let i = 600; i <= 7200; i += 60) intervals.push(i);

  let engagementTime = 0;
  let intervalIndex = 0;
  let scrollDepth = 0;
  let valued = false;
  let fired = [];

  // --- State machine ---
  let visible = (document.visibilityState === 'visible');
  let lastSessionId = posthog?.get_session_id?.() || null;
  let idle = true;                 // start idle until first user activity
  let timer = null;                // setInterval id
  let idleTimer = null;            // setTimeout id
  const idleLimit = 60000;         // 60s

  console.log("[Pikachu] Hi. Whatcha doing here? Care to take a peek into analytics' logs?");

  function sendPHEvent(name, params = {}) {
    console.log(`[Pikachu] ${name}`, params);

    if (typeof posthog !== 'undefined' && posthog.capture) {
      posthog.capture(name, params);
    } else {
      console.log(`[Pikachu] PostHog not loaded`);
    }
  }

  function startTimer() {
    if (!timer) {
      timer = setInterval(tick, 1000);
      console.log("[Pikachu] Timer START");
    }
  }

  function stopTimer(reason) {
    if (timer) {
      clearInterval(timer);
      timer = null;
      console.log(`[Pikachu] Timer STOP (${reason})`);
    }
  }

  function scheduleIdleTimeout() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      idle = true;
      console.log("[Pikachu] Became IDLE");
      updateTimerState();
    }, idleLimit);
  }

  function markActivity(evtName) {
    // Mark active and keep extending idle deadline
    if (idle) {
      idle = false;
      console.log(`[Pikachu] Became ACTIVE via ${evtName}`);
      updateTimerState();
    }
    scheduleIdleTimeout();
  }

  function updateTimerState() {
    // Only run timer when visible AND not idle
    if (visible && !idle) {
      startTimer();
    } else {
      stopTimer(visible ? "idle" : "hidden");
    }
  }

  function tick() {
    // We only ever have a running timer when visible && !idle,
    // but guard anyway to be bulletproof.
    if (!visible || idle) return;

    watchForNewSession();

    engagementTime += 1;

    // Mark valued readers with improved logic
    checkValuedReader();

    if (intervalIndex < intervals.length && engagementTime >= intervals[intervalIndex]) {
      const time = intervals[intervalIndex];
      sendPHEvent('engaged', { seconds: time });
      intervalIndex++;
    }
  }

  function checkValuedReader() {
    if (valued) return;

    // Multiple pathways to become a "valued" reader - each represents different reading patterns:
    
    // Path 1: Deep engagement - traditional engaged readers (70% scroll + 5 min)
    // Reduced from 75% + 10 min to catch more engaged users earlier
    if (scrollDepth >= 70 && engagementTime >= 300) {
      sendPHEvent('valued', { 
        type: 'deep_engagement',
        percent: scrollDepth, 
        seconds: engagementTime 
      });
      valued = true;
      return;
    }

    // Path 2: High completion readers - users who read most content quickly (90% scroll + 2 min)
    // Catches thorough readers who consume content efficiently
    if (scrollDepth >= 90 && engagementTime >= 120) {
      sendPHEvent('valued', { 
        type: 'high_completion',
        percent: scrollDepth, 
        seconds: engagementTime 
      });
      valued = true;
      return;
    }

    // Path 3: Extended time readers - careful/contemplative readers (8 min + 30% scroll)
    // Users who spend significant time on content, even with limited scrolling
    if (engagementTime >= 480 && scrollDepth >= 30) {
      sendPHEvent('valued', { 
        type: 'extended_time',
        percent: scrollDepth, 
        seconds: engagementTime 
      });
      valued = true;
      return;
    }

    // Path 4: Quick thorough readers - speed readers with high completion (85% scroll in 1-3 min)
    // Fast but comprehensive readers who complete most content quickly
    if (scrollDepth >= 85 && engagementTime >= 60 && engagementTime <= 180) {
      sendPHEvent('valued', { 
        type: 'thorough_quick',
        percent: scrollDepth, 
        seconds: engagementTime 
      });
      valued = true;
      return;
    }
  }

  function watchForNewSession() {
    const currentSessionId = posthog?.get_session_id?.() ?? null;

    if (currentSessionId && lastSessionId && currentSessionId !== lastSessionId) {
      console.log(`[Pikachu] Session changed: ${lastSessionId} → ${currentSessionId}`);
      engagementTime = 0;
      intervalIndex = 0;
      valued = false;
      fired = [];
    }

    lastSessionId = currentSessionId;
  }

  // --- Visibility wiring ---
  document.addEventListener('visibilitychange', () => {
    visible = (document.visibilityState === 'visible');
    console.log(`[Pikachu] ${document.visibilityState}, time: ${engagementTime}s`);
    updateTimerState();
  });

  // Some browsers fire pagehide when tab is closed or bfcached.
  window.addEventListener('pagehide', () => { visible = false; updateTimerState(); });
  window.addEventListener('pageshow', () => { visible = true; updateTimerState(); });

  // --- Activity wiring ---
  const activityEvents = [
    'mousemove',    // desktop
    'pointermove',
    'scroll',       // reading
    'keydown',      // typing
    'touchstart',   // mobile tap
    'pointerdown'
  ];
  activityEvents.forEach(evt =>
    window.addEventListener(evt, () => markActivity(evt), { passive: true })
  );

  // If the page starts visible, we still require an activity within 60s;
  // any activity flips "idle" to false and starts the timer.
  if (visible) {
    console.log("[Pikachu] Page visible at load; waiting for activity...");
  } else {
    console.log("[Pikachu] Page hidden at load; will start when visible and active.");
  }
  scheduleIdleTimeout(); // arm the idle timer so we have a deadline

  function setupScrollTracking() {
    const vh = () => window.innerHeight;
    const giscus = document.querySelector('div.giscus');
    const targetY = giscus ? window.pageYOffset + giscus.getBoundingClientRect().top :
                            Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);

    // only set up if page length is >= 4x viewport height
    if (targetY < 4 * vh()) {
      console.log('[Pikachu] Skipping scroll tracking — page too short');
      return;
    } else {
      console.log(
        giscus ? '[Pikachu] Using giscus TOP as 100%:' : '[Pikachu] Using PAGE BOTTOM as 100%',
        targetY
      );
    }

    const thresholds = [];
    for (let p = 10; p <= 100; p += 10) thresholds.push(p);

    window.addEventListener('scroll', () => {
      const visibleBottom = window.scrollY + vh();
      const ratio = Math.max(0, Math.min(1, visibleBottom / targetY));
      scrollDepth = Math.floor(ratio * 100);

      // Find the highest threshold that is reached, not yet fired, and higher than current max
      let highestThreshold = null;
      let currentMax = fired.length > 0 ? Math.max(...fired) : 0;
      thresholds.forEach(p => {
        if (scrollDepth >= p && !fired.includes(p) && p > currentMax) {
          highestThreshold = p;
        }
      });

      if (highestThreshold !== null) {
        sendPHEvent('scrolled', { percent: highestThreshold });
        fired.push(highestThreshold);
      }
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupScrollTracking, { once: true });
  } else {
    setupScrollTracking();
  }
})();
