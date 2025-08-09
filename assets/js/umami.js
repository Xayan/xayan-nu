(function() {
  // Define Umami payload handler in the global scope
  window.beforeSendHandler = function(type, payload) {
    if(payload.referrer == "") {
      payload.referrer = "https://direct.xayan.nu/";
    }

    return payload;
  };

  // Dynamically load Umami analytics via JS
  var script = document.createElement('script');
  script.defer = true;
  script.src = 'https://cloud.umami.is/script.js';
  script.setAttribute('data-website-id', '066cf2d4-f26a-4f82-9da0-eb3e13c7394d');
  script.setAttribute('data-before-send', 'beforeSendHandler');
  document.head.appendChild(script);

  console.log("[Pikachu] Hi. Whatcha doing here? Care to take a peek into analytics' logs?");

  // Send engagement event only if tracking is loaded
  function sendUmamiEvent(event) {
    if (typeof umami !== 'undefined') {
      umami.track(event);
      console.log(`[umami] Event sent: ${event}`);
    } else {
      console.log(`[umami] Not loaded for: ${event}`);
    }
  }

  function sendPHEvent(name, params = {}) {
    if (typeof posthog !== 'undefined' && posthog.capture) {
      posthog.capture(name, params);
      console.log(`[PostHog] Event sent: ${name}`, params);
    } else {
      console.log(`[PostHog] Not loaded for: ${name}`);
    }
  }

  // Engagement intervals
  const intervals = [5];
  for(let i=10; i<=60; i+=10) intervals.push(i);
  for(let i=120; i<=7200; i+=60) intervals.push(i);
  for(let i=1200; i<=7200; i+=300) intervals.push(i);

  let engagementTime = 0;
  let intervalIndex = 0;
  let visible = true;
  let timer = null;

  // Tick function: advances only while page is visible
  function tick() {
    if (!visible) return;
    engagementTime += 1;

    // Fire event if matches interval
    if (intervalIndex < intervals.length && engagementTime >= intervals[intervalIndex]) {
      let time = intervals[intervalIndex];
      sendPHEvent('engaged', { seconds: time });
      sendUmamiEvent(`engaged-${time}s`);
      intervalIndex++;
    }
  }

  // Visibility handler
  function handleVisibilityChange() {
    visible = (document.visibilityState === 'visible');

    console.log(`[Pikachu] Visibility: ${document.visibilityState}, time: ${engagementTime}s`);
    if (visible && !timer) {
      timer = setInterval(tick, 1000);
      console.log(`[Pikachu] Timer started`);
    } else if (!visible && timer) {
      clearInterval(timer);
      timer = null;
      console.log(`[Pikachu] Timer paused`);
    }
  }

  // Initial state
  document.addEventListener('visibilitychange', handleVisibilityChange);
  // Start timer if page is visible
  if (document.visibilityState === 'visible') {
    timer = setInterval(tick, 1000);
    console.log(`[Pikachu] Initial timer started`);
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
      console.log('[Pikachu] Not tracking scroll: page too short.');
      return;
    }
    console.log('[Pikachu] Tracking scroll: page is long enough.');

    const scrollPercents = [];
    for (let p = 10; p <= 100; p += 10) scrollPercents.push(p);
    let fired = {};

    window.addEventListener('scroll', function() {
      const scrolled = window.scrollY + viewportHeight;
      const percent = Math.floor((scrolled / pageHeight) * 100);

      scrollPercents.forEach(p => {
        if (percent >= p && !fired[p]) {
          sendPHEvent('scrolled', { percent: p });
          sendUmamiEvent(`scroll-${p}pc`);
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
