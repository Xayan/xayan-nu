// Dynamically load Umami analytics via JS
(function() {
  var script = document.createElement('script');
  script.defer = true;
  script.src = 'https://cloud.umami.is/script.js';
  script.setAttribute('data-website-id', '066cf2d4-f26a-4f82-9da0-eb3e13c7394d');
  document.head.appendChild(script);
})();
