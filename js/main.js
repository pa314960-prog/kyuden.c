(function () {
  'use strict';

  var deck = document.getElementById('deck');
  var items = Array.prototype.slice.call(deck.querySelectorAll('.item'));
  var chapters = Array.prototype.slice.call(document.querySelectorAll('.chapters a'));
  var countEl = document.getElementById('count');
  var progress = document.getElementById('progress');
  var presentUi = document.getElementById('presentUi');
  var presentCount = document.getElementById('presentCount');
  var presentLabel = document.getElementById('presentLabel');
  var presentProgress = document.getElementById('presentProgress');

  var current = 0;
  var total = items.length;
  var labels = items.map(function (el) {
    var em = el.querySelector('.item__no em');
    return em ? em.textContent : '';
  });

  /* ================= 現在位置の表示 ================= */
  function paint() {
    countEl.innerHTML = '<b>' + (current + 1) + '</b><i>/</i>' + total;
    presentCount.textContent = (current + 1) + ' / ' + total;
    presentLabel.textContent = labels[current];
    presentProgress.style.width = ((current + 1) / total) * 100 + '%';

    var pick = null;
    chapters.forEach(function (a) {
      var from = parseInt(a.getAttribute('data-from'), 10) - 1;
      if (from <= current) pick = a;
    });
    chapters.forEach(function (a) { a.classList.toggle('is-active', a === pick); });
    if (pick) keepVisible(pick);
  }

  // 章ナビを横スクロールさせて現在の章を見せる
  function keepVisible(a) {
    var box = a.parentElement;
    var left = a.offsetLeft, right = left + a.offsetWidth;
    if (left < box.scrollLeft) box.scrollLeft = left - 12;
    else if (right > box.scrollLeft + box.clientWidth) box.scrollLeft = right - box.clientWidth + 12;
  }

  function setCurrent(i) {
    i = Math.min(total - 1, Math.max(0, i));
    if (i === current) return;
    current = i;
    if (isPresenting()) {
      items.forEach(function (el, n) { el.classList.toggle('is-active', n === i); });
    }
    paint();
  }

  /* ================= スクロール中の追従 ================= */
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      if (isPresenting()) return;
      var best = null;
      entries.forEach(function (en) {
        if (en.isIntersecting && (!best || en.intersectionRatio > best.intersectionRatio)) best = en;
      });
      if (best) setCurrent(items.indexOf(best.target));
    }, { threshold: [0.3, 0.55, 0.85] });
    items.forEach(function (el) { spy.observe(el); });

    // 表示領域に入ったスライドをふわりと出す
    var reveal = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-seen');
        reveal.unobserve(en.target);
      });
    }, { rootMargin: '180px 0px 0px 0px', threshold: 0.02 });
    items.forEach(function (el) { reveal.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-seen'); });
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking || isPresenting()) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var y = window.scrollY || document.documentElement.scrollTop;
      progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
      ticking = false;
    });
  }, { passive: true });

  /* ================= ページ送り ================= */
  function go(delta) {
    var i = Math.min(total - 1, Math.max(0, current + delta));
    if (isPresenting()) { setCurrent(i); return; }
    setCurrent(i);
    items[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  document.getElementById('prev').addEventListener('click', function () { go(-1); });
  document.getElementById('next').addEventListener('click', function () { go(1); });

  chapters.forEach(function (a) {
    a.addEventListener('click', function (e) {
      var i = parseInt(a.getAttribute('data-from'), 10) - 1;
      if (isPresenting() || isGrid()) {
        e.preventDefault();
        if (isGrid()) toggleGrid(false);
        setCurrent(i);
        if (!isPresenting()) items[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ================= 一覧表示 ================= */
  var gridBtn = document.getElementById('gridBtn');
  function isGrid() { return deck.classList.contains('is-grid'); }
  function toggleGrid(on) {
    if (on === undefined) on = !isGrid();
    deck.classList.toggle('is-grid', on);
    gridBtn.setAttribute('aria-pressed', String(on));
    gridBtn.querySelector('span').textContent = on ? '1枚ずつ' : '一覧';
    items.forEach(function (el) { el.classList.add('is-seen'); });
    items[current].scrollIntoView({ block: on ? 'center' : 'start' });
  }
  gridBtn.addEventListener('click', function () { toggleGrid(); });

  // 一覧ではサムネイルをクリックしてそのページへ
  deck.addEventListener('click', function (e) {
    if (!isGrid()) return;
    var item = e.target.closest('.item');
    if (!item) return;
    setCurrent(items.indexOf(item));
    toggleGrid(false);
  });

  /* ================= 発表モード ================= */
  var playBtn = document.getElementById('playBtn');
  function isPresenting() { return document.body.classList.contains('is-present'); }

  function present(on) {
    if (on) {
      if (isGrid()) toggleGrid(false);
      document.body.classList.add('is-present');
      deck.classList.add('is-present');
      presentUi.hidden = false;
      items.forEach(function (el, n) {
        el.classList.add('is-seen');
        el.classList.toggle('is-active', n === current);
      });
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(function () {});
      }
    } else {
      document.body.classList.remove('is-present');
      deck.classList.remove('is-present');
      presentUi.hidden = true;
      items.forEach(function (el) { el.classList.remove('is-active'); });
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(function () {});
      }
      items[current].scrollIntoView({ block: 'start' });
    }
    playBtn.setAttribute('aria-pressed', String(on));
    paint();
  }
  playBtn.addEventListener('click', function () { present(!isPresenting()); });
  document.getElementById('exitBtn').addEventListener('click', function () { present(false); });
  presentUi.querySelector('.present-ui__zone--prev').addEventListener('click', function () { go(-1); });
  presentUi.querySelector('.present-ui__zone--next').addEventListener('click', function () { go(1); });
  document.addEventListener('fullscreenchange', function () {
    if (!document.fullscreenElement && isPresenting()) present(false);
  });

  /* ================= クイズの正解 ================= */
  var ansBtn = document.getElementById('ansBtn');
  ansBtn.addEventListener('click', function () {
    var on = document.body.classList.toggle('is-hidden-answer');
    ansBtn.setAttribute('aria-pressed', String(on));
    ansBtn.querySelector('span').textContent = on ? '正解を表示' : '正解を隠す';
  });

  /* ================= キーボード ================= */
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest('input, textarea')) return;
    var k = e.key;

    if (k === 'ArrowRight' || k === 'ArrowDown' || k === ' ' || k === 'PageDown') { e.preventDefault(); go(1); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp') { e.preventDefault(); go(-1); }
    else if (k === 'Home') { e.preventDefault(); jump(0); }
    else if (k === 'End') { e.preventDefault(); jump(total - 1); }
    else if (k === 'Escape') { if (isPresenting()) present(false); else if (isGrid()) toggleGrid(false); }
    else if (k === 'g' || k === 'G') { if (!isPresenting()) toggleGrid(); }
    else if (k === 'f' || k === 'F') { present(!isPresenting()); }
  });

  function jump(i) {
    setCurrent(i);
    if (!isPresenting()) items[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ================= スワイプ ================= */
  var x0 = null, y0 = null;
  document.addEventListener('touchstart', function (e) {
    if (!isPresenting() || e.touches.length !== 1) return;
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - x0, dy = t.clientY - y0;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    x0 = y0 = null;
  }, { passive: true });

  paint();
})();
