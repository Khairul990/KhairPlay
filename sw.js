"use strict";
/* PlayNova service worker — cache-first static shell, network-first navigation */
const CACHE = "playnova-v4";
const CORE = [
  ".",
  "index.html",
  "css/tokens.css",
  "css/style.css",
  "js/games-data.js",
  "js/main.js",
  "manifest.json",
  "public/brand/favicon.svg",
  "public/brand/playnova-icon.svg",
  "public/brand/playnova-logo.svg"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  const req = e.request;
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(function (res) {
        const copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) { return hit || caches.match("index.html"); });
      })
    );
    return;
  }

  /* stale-while-revalidate: cache theke turant deao, background-e notun version anao */
  e.respondWith(
    caches.match(req).then(function (hit) {
      const refresh = fetch(req)
        .then(function (res) {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then(function (c) { c.put(req, copy); });
          }
          return res;
        })
        .catch(function () { return hit; });
      if (hit) {
        return refresh.then(function (net) { return net || hit; });
      }
      return fetch(req);
    })
  );
});
