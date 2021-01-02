// This name is also used in `common.js`.
const CACHE_NAME = "all-pages";

const offlineFallbackPage = "offline.html";

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

self.addEventListener("install", async (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(cachedPages))
  );
});

self.addEventListener("activate", (event) => {
  // Tell the active service worker to take control of the page immediately.
  self.clients.claim();
});

// Note: "fetch" never gets called for loading Javascript files.
// Note: iPhone app mode caching doesn't work at all. Can't figure out why.
// Network first with fallback to cache and offline page.
self.addEventListener("fetch", (event) => {
  console.log(`Fetch event: ${JSON.stringify(event)}`);
  event.respondWith(
    (async () => {
      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse) {
          console.log(`Network fetch: ${JSON.stringify(event)}`);
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        }
      } catch (error) {
        console.log(`Network fetch error: ${JSON.stringify(error)}`);
      }

      const cache = await caches.open(CACHE_NAME);

      try {
        const cacheResponse = await cache.match(event.request);
        if (cacheResponse) {
          console.log(`Cache hit: ${JSON.stringify(event)}`);
          return cacheResponse;
        }
      } catch (error) {
        console.log(`Cache get error: ${JSON.stringify(error)}`);
      }

      console.log(`Show offline page: ${JSON.stringify(event)}`);
      return await cache.match(offlineFallbackPage);
    })()
  );
});
