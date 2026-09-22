(function () {
  'use strict';

  var deck = document.getElementById('deck');
  var items = Array.prototype.slice.call(deck.querySelectorAll('.item'));
  var countEl = document.getElementById('count');
  var current = 0;

  /* ---------- 現在表示中のスライド番号 ---------- */
  function setCurrent(i) {
    if (i === current) return;
    current = i;
    countEl.innerHTML = '<b>' + (i + 1) + '</b> / ' + items.length;
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      var best = null;
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        if (!best || en.intersectionRatio > best.intersectionRatio) best = en;
      });
      if (best) setCurrent(items.indexOf(best.target));
    }, { threshold: [0.35, 0.6, 0.9] });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 前後の移動 ---------- */
  function go(delta) {
    var i = Math.min(items.length - 1, Math.max(0, current + delta));
    items[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
    setCurrent(i);
  }
  document.getElementById('prev').addEventListener('click', function () { go(-1); });
  document.getElementById('next').addEventListener('click', function () { go(1); });

  document.addEventListener('keydown', function (e) {
    if (e.target.closest('button, a, input, textarea')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); go(-1); }
    else if (e.key === 'Home') { e.preventDefault(); items[0].scrollIntoView(); setCurrent(0); }
    else if (e.key === 'End') { e.preventDefault(); items[items.length - 1].scrollIntoView(); setCurrent(items.length - 1); }
  });

  /* ---------- 一覧表示 ---------- */
  var gridBtn = document.getElementById('gridBtn');
  gridBtn.addEventListener('click', function () {
    var on = deck.classList.toggle('is-grid');
    gridBtn.setAttribute('aria-pressed', String(on));
    gridBtn.textContent = on ? '1枚ずつ' : '一覧';
    if (!on) items[current].scrollIntoView({ block: 'start' });
  });

  /* ---------- クイズの正解を隠す ---------- */
  var ansBtn = document.getElementById('ansBtn');
  ansBtn.addEventListener('click', function () {
    var on = document.body.classList.toggle('is-hidden-answer');
    ansBtn.setAttribute('aria-pressed', String(on));
    ansBtn.textContent = on ? '正解を表示' : '正解を隠す';
  });
})();
