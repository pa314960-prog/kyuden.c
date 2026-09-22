(function () {
  'use strict';

  /* ---------- スクロール進捗バー & ヘッダーの影 ---------- */
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
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- モバイルメニュー ---------- */
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('navMenu');
  toggle.addEventListener('click', function () {
    var open = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------- スクロール連動アニメーション ---------- */
  var revealItems = document.querySelectorAll('.reveal');
  var charts = document.querySelectorAll('[data-chart]');

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    revealItems.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 70 + 'ms';
      io.observe(el);
    });

    var chartIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-on');
        countUp(entry.target);
        chartIo.unobserve(entry.target);
      });
    }, { threshold: 0.3 });
    charts.forEach(function (el) { chartIo.observe(el); });
  } else {
    revealItems.forEach(function (el) { el.classList.add('is-in'); });
    charts.forEach(function (el) { el.classList.add('is-on'); });
  }

  /* ---------- 数値のカウントアップ ---------- */
  function countUp(scope) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    scope.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.textContent.replace(/[\d.]+/, '');
      var start = performance.now();
      var dur = 1100;
      (function step(now) {
        var p = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(1) + suffix;
        if (p < 1) requestAnimationFrame(step);
      })(start);
    });
  }

  /* ---------- 現在地ハイライト ---------- */
  var links = Array.prototype.slice.call(menu.querySelectorAll('a'));
  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- クイズ ---------- */
  var quiz = document.getElementById('quiz');
  var questions = Array.prototype.slice.call(quiz.querySelectorAll('.q'));
  var scoreBox = document.getElementById('score');
  var scoreNum = document.getElementById('scoreNum');
  var scoreMsg = document.getElementById('scoreMsg');
  var retry = document.getElementById('retry');
  var correct = 0;
  var answered = 0;

  questions.forEach(function (q) {
    q.querySelectorAll('.q__choices button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (q.classList.contains('is-done')) return;
        var answer = q.getAttribute('data-answer');
        var picked = btn.getAttribute('data-c');
        var hit = picked === answer;

        q.classList.add('is-done');
        q.querySelectorAll('.q__choices button').forEach(function (b) {
          b.disabled = true;
          if (b.getAttribute('data-c') === answer) b.classList.add('is-correct');
        });
        if (!hit) btn.classList.add('is-wrong');

        var result = q.querySelector('.q__result');
        result.textContent = hit ? '正解！' : '不正解 … 正解は「' + answer + '」';
        result.className = 'q__result is-shown ' + (hit ? 'ok' : 'ng');

        if (hit) correct++;
        answered++;
        if (answered === questions.length) showScore();
      });
    });
  });

  function showScore() {
    scoreNum.textContent = String(correct);
    scoreMsg.textContent =
      correct === 3 ? '全問正解！九州電力のエネルギーを完全に理解しました。' :
      correct === 2 ? 'おしい！もう一度読み返してみましょう。' :
      correct === 1 ? '各セクションをもう一度チェックしてみましょう。' :
                      '大丈夫。まずは 01 から読み直してみましょう。';
    scoreBox.hidden = false;
    scoreBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  retry.addEventListener('click', function () {
    correct = 0;
    answered = 0;
    scoreBox.hidden = true;
    questions.forEach(function (q) {
      q.classList.remove('is-done');
      var result = q.querySelector('.q__result');
      result.className = 'q__result';
      result.textContent = '';
      q.querySelectorAll('.q__choices button').forEach(function (b) {
        b.disabled = false;
        b.classList.remove('is-correct', 'is-wrong');
      });
    });
    questions[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
})();
