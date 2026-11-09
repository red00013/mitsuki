const CACHE='mitsuki-v1';
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','./index.html','./kana/','./kana/index.html','./kana/app.js','./kana/style.css','./kana/data/allHiragana.json','./kana/data/allKatakana.json','./kana/elephant-kana.html','./math/','./math/index.html','./math/number-quest.html','./math/elephant-fruit.html','./math/elephant-count.html']))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
