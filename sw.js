// Do a meaningless date update to refresh the SW.
// Otherwise, on mobile phones, it is impossible to refresh the SW.
// Last updated: 2021-03-27

// This name is also used in `common.js`.
const CACHE_NAME = "all-pages";

const offlineFallbackPage = "src/offline.html";

const bkAbbrs = [
  "Gen",
  "Exo",
  "Lev",
  "Num",
  "Deu",
  "Jos",
  "Jdg",
  "Rut",
  "1Sa",
  "2Sa",
  "1Ki",
  "2Ki",
  "1Ch",
  "2Ch",
  "Ezr",
  "Neh",
  "Est",
  "Job",
  "Psa",
  "Prv",
  "Ecc",
  "SoS",
  "Isa",
  "Jer",
  "Lam",
  "Ezk",
  "Dan",
  "Hos",
  "Joe",
  "Amo",
  "Oba",
  "Jon",
  "Mic",
  "Nah",
  "Hab",
  "Zep",
  "Hag",
  "Zec",
  "Mal",
  "Mat",
  "Mrk",
  "Luk",
  "Joh",
  "Act",
  "Rom",
  "1Co",
  "2Co",
  "Gal",
  "Eph",
  "Phi",
  "Col",
  "1Th",
  "2Th",
  "1Ti",
  "2Ti",
  "Tit",
  "Phm",
  "Heb",
  "Jam",
  "1Pe",
  "2Pe",
  "1Jo",
  "2Jo",
  "3Jo",
  "Jud",
  "Rev",
];

const cachedPages = [
  offlineFallbackPage,
  "index.html",
  "favicon.ico",
  "favicon.png",
  "lib/bootstrap-4.5.2/bootstrap.min.css",
  "lib/bootstrap-4.5.2/bootstrap.min.js",
  "lib/jquery-3.5.1/jquery-3.5.1.min.js",
  "lib/jquery-ui-1.12.1/jquery-ui.min.css",
  "lib/jquery-ui-1.12.1/jquery-ui.min.js",
  "lib/popper-1.16.1/popper.min.js",
  "src/common.css",
  "src/common.js",
  "src/DynamicLoader.js",
  "src/data/en/BookNames.js",
  ...bkAbbrs.map((bkAbbr) => "src/data/en/books/" + bkAbbr + ".js"),
  "src/data/zh-CN/BookNames.js",
  ...bkAbbrs.map((bkAbbr) => "src/data/zh-CN/books/" + bkAbbr + ".js"),
];

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("install", (event) => {
  // The version number here is just to force update the sw.
  console.log(`[ServiceWorker] Install v2.0 - caching ${cachedPages.length} pages`);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(cachedPages))
  );
});

self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activate - clean out old caches");
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log(`[ServiceWorker] Activate - delete cache "${key}"`);
            return caches.delete(key);
          }
        })
      )
    )
  );
});

// Cache first with fallback to network and offline page.
self.addEventListener("fetch", (event) => {
  const logPrefix = `[ServiceWorker] Fetch ${event.request.url} -`;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      const cacheResponse = await cache.match(event.request);
      if (cacheResponse) {
        console.log(logPrefix, "already cached");
        return cacheResponse;
      }

      const networkResponse = await fetch(event.request);
      if (networkResponse) {
        if (event.request.url.startsWith("http")) {
          console.log(logPrefix, "fetch + add to cache");
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      }

      console.log(logPrefix, "offline fallback");
      return await cache.match(offlineFallbackPage);
    })()
  );
});
