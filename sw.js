// Network first so updates show at once; cached copy when offline.
var CACHE = "hisaab-v3";
var CORE = ["./", "index.html", "privacy.html", "assets/hisaab.css", "assets/core.js", "assets/calcs.js", "assets/icon.svg", "income-tax-calculator.html", "salary-calculator.html", "gst-calculator.html", "fd-calculator.html", "rd-calculator.html", "ppf-calculator.html", "sip-calculator.html", "emi-calculator.html", "loan-prepayment-calculator.html", "hra-calculator.html", "age-calculator.html", "percentage-calculator.html", "bill-split-calculator.html", "gold-price-calculator.html", "gratuity-calculator.html", "nps-calculator.html", "sukanya-samriddhi-calculator.html", "inflation-calculator.html", "loan-eligibility-calculator.html", "tax-saving-calculator.html", "capital-gains-calculator.html", "epf-calculator.html", "goal-planner-calculator.html", "loan-compare-calculator.html", "fd-compare-calculator.html", "car-loan-vs-cash-calculator.html"];
self.addEventListener("install", function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(fetch(e.request).then(function (r) {
    if (r.ok && (new URL(e.request.url).origin === location.origin || e.request.url.indexOf("fonts.") > -1)) { var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, cp); }); }
    return r;
  }).catch(function () { return caches.match(e.request, { ignoreSearch: true }).then(function (m) { return m || caches.match("./"); }); }));
});
