/**
 * main.js
 * Handles:
 *   - Custom cursor
 *   - Navbar scroll behaviour + mobile toggle
 *   - Scroll reveal (replaces AOS — zero external dependency)
 *   - Animated stat counters
 *   - Active nav-link highlight
 *   - Footer year
 */

(function () {
  'use strict';

  document.documentElement.classList.add('js');

  document.addEventListener('DOMContentLoaded', () => {
    initCursor();
    initNavbar();
    initMobileNav();
    initTextReveal();
    initScrollWordReveal();
    initScrollNameScatter();
    initDirectionalSlides();
    initTriggeredAnimations();
    initReveal();
    initCounters();
    initActiveNav();
    initFooterYear();
  });

  function initTextReveal() {
    const elements = document.querySelectorAll('[data-text-reveal]');
    if (!elements.length) return;

    elements.forEach(element => {
      const accessibleText = element.textContent.trim().replace(/\s+/g, ' ');
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const textNodes = [];

      while (walker.nextNode()) {
        if (walker.currentNode.textContent.trim()) textNodes.push(walker.currentNode);
      }

      let wordIndex = 0;
      const animateLetters = element.dataset.textReveal === 'letters';
      textNodes.forEach(node => {
        const fragment = document.createDocumentFragment();
        const parts = node.textContent.match(/\s+|[^\s]+/g) || [];

        parts.forEach(part => {
          if (/^\s+$/.test(part)) {
            fragment.append(part);
            return;
          }

          const word = document.createElement('span');
          word.className = 'text-word';

          if (animateLetters) {
            Array.from(part).forEach(letter => {
              const inner = document.createElement('span');
              const scatter = document.createElement('span');
              inner.className = 'text-word-inner';
              inner.style.setProperty('--word-delay', `${wordIndex++ * 45}ms`);
              scatter.className = 'text-letter-scatter';
              scatter.textContent = letter;
              inner.append(scatter);
              word.append(inner);
            });
          } else {
            const inner = document.createElement('span');
            inner.className = 'text-word-inner';
            inner.style.setProperty('--word-delay', `${wordIndex++ * 60}ms`);
            inner.textContent = part;
            word.append(inner);
          }

          fragment.append(word);
        });

        node.replaceWith(fragment);
      });

      element.setAttribute('aria-label', accessibleText);
    });

    const heroName = document.querySelector('[data-text-reveal="letters"]');
    if (heroName) requestAnimationFrame(() => heroName.classList.add('text-revealed'));
    observeAndReveal(elements, 'text-revealed', 0.2);
  }

  function initScrollWordReveal() {
    const paragraphs = document.querySelectorAll('[data-scroll-words]');
    if (!paragraphs.length) return;

    paragraphs.forEach(paragraph => {
      const text = paragraph.textContent.trim().replace(/\s+/g, ' ');
      const words = text.match(/\S+|\s+/g) || [];
      const fragment = document.createDocumentFragment();

      words.forEach(word => {
        if (/^\s+$/.test(word)) {
          fragment.append(word);
          return;
        }

        const span = document.createElement('span');
        span.className = 'scroll-word';
        span.textContent = word;
        fragment.append(span);
      });

      paragraph.replaceChildren(fragment);
      paragraph.setAttribute('aria-label', text);
    });

    let ticking = false;
    const updateWords = () => {
      const viewportHeight = window.innerHeight;
      paragraphs.forEach(paragraph => {
        const bounds = paragraph.getBoundingClientRect();
        if (bounds.bottom < 0 || bounds.top > viewportHeight) return;

        paragraph.querySelectorAll('.scroll-word').forEach(word => {
          const top = word.getBoundingClientRect().top;
          const progress = Math.min(1, Math.max(0,
            (viewportHeight * 0.88 - top) / (viewportHeight * 0.34),
          ));
          word.style.setProperty('--word-opacity', (0.12 + progress * 0.88).toFixed(2));
          word.style.setProperty('--word-offset', `${((1 - progress) * 0.55).toFixed(2)}em`);
          word.style.setProperty('--word-highlight', `${Math.round(progress * 45)}%`);
        });
      });
      ticking = false;
    };

    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateWords);
    };

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    requestUpdate();
  }

  function initScrollNameScatter() {
    const hero = document.getElementById('hero');
    const letters = document.querySelectorAll('.text-letter-scatter');
    if (!hero || !letters.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ticking = false;
    const update = () => {
      const bounds = hero.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -bounds.top / Math.max(bounds.height, 1)));
      letters.forEach((letter, index) => {
        const direction = index % 2 === 0 ? -1 : 1;
        const distance = (0.25 + (index % 4) * 0.18) * window.innerHeight * progress;
        letter.style.setProperty('--scatter-y', `${direction * distance}px`);
        letter.style.setProperty('--scatter-rotate', `${direction * progress * (index % 3 + 1) * 3}deg`);
        letter.style.setProperty('--scatter-opacity', `${1 - progress * 0.8}`);
      });
      ticking = false;
    };

    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    requestUpdate();
  }

  function initDirectionalSlides() {
    const elements = document.querySelectorAll('[data-slide]');
    observeAndReveal(elements, 'slide-visible', 0.12);

    const contactHeading = document.querySelector('[data-contact-reveal]');
    if (contactHeading) observeAndReveal([contactHeading], 'contact-lines-visible', 0.25);
  }

  function initTriggeredAnimations() {
    const skillList = document.querySelector('[data-skill-reveal]');
    if (skillList) {
      skillList.querySelectorAll('li').forEach((item, index) => {
        item.style.setProperty('--skill-delay', `${index * 90}ms`);
      });
      observeAndReveal([skillList], 'skills-revealed', 0.1);
    }

    const contactInner = document.querySelector('.contact-inner');
    if (contactInner && contactInner.querySelector('[data-contact-item]')) {
      observeAndReveal([contactInner], 'contact-items-visible', 0.12);
    }
  }

  function observeAndReveal(elements, className, threshold) {
    if (!elements.length) return;

    if (!('IntersectionObserver' in window)) {
      elements.forEach(element => element.classList.add(className));
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(className);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold, rootMargin: '0px 0px -8% 0px' });

    elements.forEach(element => observer.observe(element));
  }


  /* ══════════════════════════════════════════
     CUSTOM CURSOR
  ══════════════════════════════════════════ */
  function initCursor() {
    const cursor = document.getElementById('cursor');
    const follower = document.getElementById('cursor-follower');
    if (!cursor || !follower) return;

    let mouseX = 0, mouseY = 0;
    let fx = 0, fy = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.left = mouseX + 'px';
      cursor.style.top = mouseY + 'px';
    });

    // Follower lerp
    (function loop() {
      fx += (mouseX - fx) * 0.12;
      fy += (mouseY - fy) * 0.12;
      follower.style.left = fx + 'px';
      follower.style.top = fy + 'px';
      requestAnimationFrame(loop);
    })();

    // Expand on interactive elements
    document.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('expanded');
        follower.classList.add('expanded');
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('expanded');
        follower.classList.remove('expanded');
      });
    });
  }


  /* ══════════════════════════════════════════
     NAVBAR SCROLL STATE
  ══════════════════════════════════════════ */
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    const update = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 60);
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }


  /* ══════════════════════════════════════════
     MOBILE NAV TOGGLE
  ══════════════════════════════════════════ */
  function initMobileNav() {
    const toggle = document.getElementById('nav-toggle');
    const links = document.getElementById('nav-links');
    if (!toggle || !links) return;

    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.classList.toggle('active', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    links.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }


  /* ══════════════════════════════════════════
     SCROLL REVEAL  (replaces AOS)
     Adds .visible to any element with .reveal
     when it enters the viewport
  ══════════════════════════════════════════ */
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // animate once
        }
      });
    }, {
      threshold: 0.12,
    });

    els.forEach(el => observer.observe(el));
  }


  /* ══════════════════════════════════════════
     STAT COUNTERS
  ══════════════════════════════════════════ */
  function initCounters() {
    const statEls = document.querySelectorAll('.stat-num[data-target]');
    if (!statEls.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    statEls.forEach(el => observer.observe(el));
  }

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1400;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    };

    requestAnimationFrame(tick);
  }


  /* ══════════════════════════════════════════
     ACTIVE NAV LINK
  ══════════════════════════════════════════ */
  function initActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });

    sections.forEach(s => observer.observe(s));
  }


  /* ══════════════════════════════════════════
     FOOTER YEAR
  ══════════════════════════════════════════ */
  function initFooterYear() {
    const el = document.getElementById('year');
    if (el) el.textContent = new Date().getFullYear();
  }

}());