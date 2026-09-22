(function () {
  'use strict';

  /* ---------- ヘッダーの影と読み進みバー ---------- */
  var nav = document.getElementById('nav');
  var progress = document.getElementById('progress');
  var ticking = false;
  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    nav.classList.toggle('is-stuck', y > 8);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- モバイルメニュー ---------- */
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('navMenu');
  toggle.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------- 出現アニメーションとグラフ ---------- */
  var reveals = document.querySelectorAll('.r');
  var charts = document.querySelectorAll('[data-chart]');

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: .08 });
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (i % 3) * 80 + 'ms';
      io.observe(el);
    });

    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('on');
        countUp(en.target);
        cio.unobserve(en.target);
      });
    }, { threshold: .25 });
    charts.forEach(function (el) { cio.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
    charts.forEach(function (el) { el.classList.add('on'); });
  }

  function countUp(scope) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    scope.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.textContent.replace(/[\d.]+/, '');
      var t0 = performance.now(), dur = 1100;
      (function step(now) {
        var p = Math.min((now - t0) / dur, 1);
        el.textContent = (target * (1 - Math.pow(1 - p, 3))).toFixed(1) + suffix;
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
  }

  /* ---------- 現在地のハイライト ---------- */
  var links = Array.prototype.slice.call(menu.querySelectorAll('a[href^="#"]'));
  var secs = links.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
  if ('IntersectionObserver' in window && secs.length) {
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- クイズ ---------- */
  var quiz = document.getElementById('quiz');
  var qs = Array.prototype.slice.call(quiz.querySelectorAll('.q'));
  var box = document.getElementById('score');
  var num = document.getElementById('scoreNum');
  var msg = document.getElementById('scoreMsg');
  var hit = 0, done = 0;

  qs.forEach(function (q) {
    q.querySelectorAll('.q__choices button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (q.classList.contains('done')) return;
        var ans = q.getAttribute('data-answer');
        var right = btn.getAttribute('data-c') === ans;

        q.classList.add('done');
        q.querySelectorAll('.q__choices button').forEach(function (b) {
          b.disabled = true;
          if (b.getAttribute('data-c') === ans) b.classList.add('ok');
        });
        if (!right) btn.classList.add('ng');

        var res = q.querySelector('.q__res');
        res.textContent = right ? '正解！' : '不正解 … 正解は「' + ans + '」';
        res.className = 'q__res show ' + (right ? 'y' : 'n');

        if (right) hit++;
        if (++done === qs.length) show();
      });
    });
  });

  function show() {
    num.textContent = String(hit);
    msg.textContent =
      hit === 3 ? '全問正解。九州のエネルギーを完全に理解しました。' :
      hit === 2 ? 'おしい！もう一度読み返してみましょう。' :
      hit === 1 ? '各章をもう一度チェックしてみましょう。' :
                  '大丈夫。まずは 01 から読み直してみましょう。';
    box.hidden = false;
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  document.getElementById('retry').addEventListener('click', function () {
    hit = 0; done = 0; box.hidden = true;
    qs.forEach(function (q) {
      q.classList.remove('done');
      var res = q.querySelector('.q__res');
      res.className = 'q__res'; res.textContent = '';
      q.querySelectorAll('.q__choices button').forEach(function (b) {
        b.disabled = false; b.classList.remove('ok', 'ng');
      });
    });
    qs[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
})();
