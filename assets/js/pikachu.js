(function() {
  // --- Engagement schedule ---
  const intervals = [5];
  for (let i = 10; i < 60; i += 10) intervals.push(i);
  for (let i = 60; i <= 7200; i += 30) intervals.push(i);

  let engagementTime = 0;
  let intervalIndex = 0;

  // --- State machine ---
  let visible = (document.visibilityState === 'visible');
  let idle = true;                 // start idle until first user activity
  let timer = null;                // setInterval id
  let idleTimer = null;            // setTimeout id
  const idleLimit = 60000;         // 60s

  // --- Load Umami ---
  var script = document.createElement('script');
  script.defer = true;
  script.src = 'https://cloud.umami.is/script.js';
  script.setAttribute('data-website-id', '066cf2d4-f26a-4f82-9da0-eb3e13c7394d');
  script.setAttribute('data-before-send', 'beforeSendHandler');
  document.head.appendChild(script);

  console.log("[Pikachu] Hi. Whatcha doing here? Care to take a peek into analytics' logs?");

  function sendUmamiEvent(event) {
    if (typeof umami !== 'undefined') {
      umami.track(event);
    }
  }

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

    engagementTime += 1;

    if (intervalIndex < intervals.length && engagementTime >= intervals[intervalIndex]) {
      const time = intervals[intervalIndex];
      sendPHEvent('engaged', { seconds: time });
      sendUmamiEvent(`engaged-${time}s`);
      intervalIndex++;
    }
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

    console.log(giscus ? '[Pikachu] Using giscus TOP as 100%:' : '[Pikachu] Using PAGE BOTTOM as 100%', targetY);

    const thresholds = [];
    for (let p = 10; p <= 100; p += 10) thresholds.push(p);
    const fired = {};

    window.addEventListener('scroll', () => {
      const visibleBottom = window.scrollY + vh();
      const ratio = Math.max(0, Math.min(1, visibleBottom / targetY));
      const percent = Math.floor(ratio * 100);

      thresholds.forEach(p => {
        if (percent >= p && !fired[p]) {
          sendPHEvent('scrolled', { percent: p });
          sendUmamiEvent(`scroll-${p}pc`);
          fired[p] = true;
        }
      });
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupScrollTracking, { once: true });
  } else {
    setupScrollTracking();
  }
})();
