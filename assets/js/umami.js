(function() {
  // Dynamically load Umami analytics via JS
  var script = document.createElement('script');
  script.defer = true;
  script.src = 'https://cloud.umami.is/script.js';
  script.setAttribute('data-website-id', '066cf2d4-f26a-4f82-9da0-eb3e13c7394d');
  document.head.appendChild(script);

  // Engagement intervals: every 10s up to 1m, then every 1m
  const intervals = [];
  for(let i=10; i<=30; i+=10) intervals.push(i);
  for(let i=60; i<=1800; i+=60) intervals.push(i);

  let visible = true;
  let engagementTime = 0; // seconds
  let timer = null;
  let intervalIndex = 0;

  // Helper: Send engagement event if umami is loaded
  function sendEvent(event) {
    if (typeof umami !== 'undefined') {
      umami.track(event);
      console.log(`[umami] Sent: ${event}`);
    } else {
      console.log(`[umami] Not loaded for: ${event}`);
    }
  }

  // Tick function: advances only while page is visible
  function tick() {
    if (!visible) return;
    engagementTime += 1;

    // Fire event if matches interval
    if (intervalIndex < intervals.length && engagementTime === intervals[intervalIndex]) {
      sendEvent(`engaged-${intervals[intervalIndex]}s`);
      intervalIndex++;
    }
  }

  // Visibility handler
  function handleVisibilityChange() {
    visible = (document.visibilityState === 'visible');

    console.log(`[umami] Visibility: ${document.visibilityState}, time: ${engagementTime}s`);
    if (visible && !timer) {
      timer = setInterval(tick, 1000);
      console.log(`[umami] Timer started`);
    } else if (!visible && timer) {
      clearInterval(timer);
      timer = null;
      console.log(`[umami] Timer paused`);
    }
  }

  // Initial state
  document.addEventListener('visibilitychange', handleVisibilityChange);
  // Start timer if page is visible
  if (document.visibilityState === 'visible') {
    timer = setInterval(tick, 1000);
    console.log(`[umami] Initial timer started`);
  }

  function setupScrollTracking() {
    const body = document.body;
    const html = document.documentElement;
    const pageHeight = Math.max(
      body.scrollHeight, body.offsetHeight,
      html.clientHeight, html.scrollHeight, html.offsetHeight
    );
    const viewportHeight = window.innerHeight;

    // Only activate if content is at least 2x viewport height
    if (pageHeight < viewportHeight * 2) {
      console.log('[umami] Not tracking scroll: page too short.');
      return;
    }
    console.log('[umami] Tracking scroll: page is long enough.');

    const scrollPercents = [];
    for (let p = 25; p <= 100; p += 25) scrollPercents.push(p);
    let fired = {};

    window.addEventListener('scroll', function() {
      const scrolled = window.scrollY + viewportHeight;
      const percent = Math.floor((scrolled / pageHeight) * 100);

      scrollPercents.forEach(p => {
        if (percent >= p && !fired[p]) {
          sendEvent(`scroll-${p}pc`);
          fired[p] = true;
        }
      });
    });
  }

  // Wait for DOM to load before checking height
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupScrollTracking);
  } else {
    setupScrollTracking();
  }
})();
