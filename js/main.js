/**
 * main.js
 * Handles:
 *   - Loading & rendering portfolio data from portfolio.txt
 *   - Custom cursor
 *   - Navbar scroll behaviour + mobile toggle
 *   - Scroll reveal & text animations (zero external dependency)
 *   - Animated stat counters
 *   - Active nav-link highlight
 *   - Footer year
 */

(function () {
  'use strict';

  const PORTFOLIO_FILE = 'portfolio.txt';
  const PROJECT_KEYS = new Set([
    'title',
    'description',
    'desc',
    'tags',
    'link',
    'url',
    'accent',
    'featured',
  ]);

  document.documentElement.classList.add('js');

  // Start fetching immediately in parallel with HTML parsing.
  const portfolioPromise = fetchPortfolioText();

  document.addEventListener('DOMContentLoaded', async () => {
    initCursor();
    initNavbar();
    initMobileNav();
    initTextReveal();
    initScrollNameScatter();
    initDirectionalSlides();
    initActiveNav();
    initFooterYear();

    try {
      const result = await portfolioPromise;
      if (result.ok) {
        const portfolioData = parsePortfolioText(result.text);
        renderPortfolio(portfolioData);
      } else {
        renderLoadStatus(result);
      }
    } catch (error) {
      renderLoadStatus({
        ok: false,
        isFileProtocol: window.location.protocol === 'file:',
        error,
      });
    }

    initScrollWordReveal();
    initTriggeredAnimations();
    initReveal();
    initCounters();

    if (window.location.hash) {
      const target = document.getElementById(window.location.hash.slice(1));
      if (target) {
        requestAnimationFrame(() => target.scrollIntoView({ behavior: 'auto' }));
      }
    }
  });


  /* ══════════════════════════════════════════
     PORTFOLIO DATA LOADER & PARSER (portfolio.txt)
  ══════════════════════════════════════════ */
  async function fetchPortfolioText() {
    try {
      const response = await fetch(PORTFOLIO_FILE, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} while loading ${PORTFOLIO_FILE}`);
      }
      const text = await response.text();
      return { ok: true, text };
    } catch (error) {
      return {
        ok: false,
        isFileProtocol: window.location.protocol === 'file:',
        error,
      };
    }
  }

  function parsePortfolioText(rawText) {
    const data = {
      stats: { projectsCount: '', experience: '', availability: '' },
      aboutHighlights: [],
      skills: [],
      projects: [],
      email: '',
      links: [],
    };

    const lines = String(rawText || '').replace(/\r\n?/g, '\n').split('\n');
    let currentSection = '';
    let currentSkillGroup = null;
    let currentProject = null;
    let lastProjectField = '';

    const flushProject = () => {
      if (!currentProject) return;
      if (currentProject.title || currentProject.description) {
        data.projects.push(currentProject);
      }
      currentProject = null;
      lastProjectField = '';
    };

    const ensureSkillGroup = (title) => {
      const existing = data.skills.find(
        group => group.title.toLowerCase() === title.toLowerCase(),
      );
      if (existing) return existing;
      const created = { title, items: [] };
      data.skills.push(created);
      return created;
    };

    lines.forEach(rawLine => {
      const trimmed = rawLine.trim();
      if (!trimmed) return;

      // Inside [SKILLS], "## Group" defines a skill category rather than a comment.
      const isSkillHeading = currentSection === 'SKILLS' && /^##\s+/.test(trimmed);
      if (!isSkillHeading && trimmed.startsWith('#')) return;

      const sectionMatch = trimmed.match(/^\[\s*([A-Za-z0-9 _-]+?)\s*\]$/);
      if (sectionMatch) {
        flushProject();
        const rawSection = sectionMatch[1].trim().toUpperCase();
        const sectionAliases = {
          STAT: 'STATS',
          SKILL: 'SKILLS',
          PROJECT: 'PROJECTS',
          LINK: 'LINKS',
        };
        currentSection = sectionAliases[rawSection] || rawSection;
        currentSkillGroup = null;
        lastProjectField = '';
        return;
      }

      if (currentSection === 'STATS') {
        const kv = splitKeyValue(trimmed);
        if (!kv) return;
        const key = kv.key.toLowerCase();
        if (key === 'projects count' || key === 'projects') {
          data.stats.projectsCount = kv.value;
        } else if (key === 'experience' || key === 'years experience') {
          data.stats.experience = kv.value;
        } else if (key === 'availability') {
          data.stats.availability = kv.value;
        }
        return;
      }

      if (currentSection === 'ABOUT HIGHLIGHTS') {
        const item = stripListPrefix(trimmed);
        if (item) data.aboutHighlights.push(item);
        return;
      }

      if (currentSection === 'SKILLS') {
        if (isSkillHeading) {
          const groupTitle = trimmed.replace(/^##\s+/, '').trim();
          currentSkillGroup = groupTitle ? ensureSkillGroup(groupTitle) : null;
          return;
        }
        const skillName = stripListPrefix(trimmed);
        if (!skillName) return;
        if (!currentSkillGroup) {
          currentSkillGroup = ensureSkillGroup('Skills');
        }
        currentSkillGroup.items.push(skillName);
        return;
      }

      if (currentSection === 'PROJECTS') {
        if (/^-{3,}$/.test(trimmed)) {
          flushProject();
          return;
        }

        const kv = splitKeyValue(trimmed);
        const key = kv ? kv.key.toLowerCase() : '';
        if (kv && PROJECT_KEYS.has(key)) {
          if (key === 'title' && currentProject && currentProject.title) {
            flushProject();
          }
          if (!currentProject) {
            currentProject = {
              title: '',
              description: '',
              tags: [],
              link: '#',
              accent: false,
            };
          }

          if (key === 'title') {
            currentProject.title = kv.value;
            lastProjectField = 'title';
          } else if (key === 'description' || key === 'desc') {
            currentProject.description = kv.value;
            lastProjectField = 'description';
          } else if (key === 'tags') {
            currentProject.tags = kv.value
              .split(',')
              .map(tag => tag.trim())
              .filter(Boolean);
            lastProjectField = 'tags';
          } else if (key === 'link' || key === 'url') {
            currentProject.link = kv.value;
            lastProjectField = 'link';
          } else if (key === 'accent' || key === 'featured') {
            currentProject.accent = /^(true|yes|1)$/i.test(kv.value);
            lastProjectField = 'accent';
          }
          return;
        }

        if (currentProject && lastProjectField === 'description') {
          currentProject.description = currentProject.description
            ? `${currentProject.description} ${trimmed}`
            : trimmed;
        }
        return;
      }

      if (currentSection === 'LINKS') {
        const cleanLine = stripListPrefix(trimmed);
        const kv = splitKeyValue(cleanLine);
        if (!kv || !kv.value) return;

        if (kv.key.toLowerCase() === 'email') {
          data.email = /^mailto:/i.test(kv.value) ? kv.value : `mailto:${kv.value}`;
        } else {
          data.links.push({ label: kv.key, url: kv.value });
        }
      }
    });

    flushProject();
    return data;
  }

  function splitKeyValue(line) {
    const colonIndex = line.indexOf(':');
    if (colonIndex <= 0) return null;
    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();
    return key ? { key, value } : null;
  }

  function stripListPrefix(line) {
    return line.replace(/^[-*]\s+/, '').trim();
  }

  function sanitizeUrl(rawUrl) {
    const trimmed = String(rawUrl || '').trim();
    if (!trimmed || /^(none|n\/a)$/i.test(trimmed)) return '';
    if (trimmed === '#' || /^(#|\/|\.\.?\/)/.test(trimmed)) return trimmed;

    try {
      const parsed = new URL(trimmed, window.location.href);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'mailto:') {
        return trimmed;
      }
    } catch (_) {
      return '#';
    }
    return '#';
  }

  function renderPortfolio(data) {
    renderStats(data);
    renderAboutSkills(data);
    renderProjects(data);
    renderSkills(data);
    renderLinks(data);
  }

  function renderStats(data) {
    const projectsStat = document.getElementById('stat-projects');
    if (projectsStat) {
      const rawCount = data.stats.projectsCount;
      let count = data.projects.length;
      if (rawCount && rawCount.toLowerCase() !== 'auto') {
        const parsed = parseInt(rawCount, 10);
        if (!Number.isNaN(parsed) && parsed >= 0) {
          count = parsed;
        }
      }
      projectsStat.dataset.target = String(count);
      projectsStat.textContent = '0';
    }

    const expStat = document.getElementById('stat-experience');
    if (expStat && data.stats.experience) {
      expStat.textContent = data.stats.experience;
    }

    const availabilityEl = document.getElementById('about-availability-text');
    if (availabilityEl && data.stats.availability) {
      availabilityEl.textContent = data.stats.availability;
    }
  }

  function renderAboutSkills(data) {
    const container = document.getElementById('about-skills');
    if (!container) return;

    const items = data.aboutHighlights.length
      ? data.aboutHighlights
      : data.skills.flatMap(group => group.items);

    const fragment = document.createDocumentFragment();
    items.forEach(skill => {
      const li = document.createElement('li');
      li.textContent = skill;
      fragment.append(li);
    });
    container.replaceChildren(fragment);
  }

  function renderProjects(data) {
    const container = document.getElementById('projects-grid');
    if (!container) return;

    if (!data.projects.length) {
      container.replaceChildren(createStatusNotice('No projects listed in portfolio.txt yet.'));
      return;
    }

    const fragment = document.createDocumentFragment();
    data.projects.forEach((project, index) => {
      const article = document.createElement('article');
      article.className = project.accent
        ? 'project-card project-card--accent reveal'
        : 'project-card reveal';

      const header = document.createElement('div');
      header.className = 'project-card-header';

      const num = document.createElement('span');
      num.className = 'project-number';
      num.textContent = String(index + 1).padStart(2, '0');
      header.append(num);

      const safeLink = sanitizeUrl(project.link);
      if (safeLink) {
        const link = document.createElement('a');
        link.className = 'icon-link';
        link.href = safeLink;
        link.setAttribute(
          'aria-label',
          project.title ? `View ${project.title}` : 'View project',
        );
        link.textContent = '↗';
        if (/^https?:/i.test(safeLink)) {
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
        }
        header.append(link);
      }

      const title = document.createElement('h3');
      title.className = 'project-title';
      title.setAttribute('data-scroll-words', '');
      title.textContent = project.title || 'Untitled Project';

      const desc = document.createElement('p');
      desc.className = 'project-desc';
      desc.setAttribute('data-scroll-words', '');
      desc.textContent = project.description;

      const tagsList = document.createElement('ul');
      tagsList.className = 'project-tags';
      project.tags.forEach(tag => {
        const li = document.createElement('li');
        li.textContent = tag;
        tagsList.append(li);
      });

      article.append(header, title, desc, tagsList);
      fragment.append(article);
    });

    container.replaceChildren(fragment);
  }

  function renderSkills(data) {
    const container = document.getElementById('skills-groups');
    if (!container) return;

    if (!data.skills.length) {
      container.replaceChildren(createStatusNotice('No skills listed in portfolio.txt yet.'));
      return;
    }

    const fragment = document.createDocumentFragment();
    data.skills.forEach(group => {
      const groupDiv = document.createElement('div');
      groupDiv.className = 'skill-group';

      const heading = document.createElement('h3');
      heading.setAttribute('data-scroll-words', '');
      heading.textContent = group.title;

      const list = document.createElement('ul');
      group.items.forEach(skill => {
        const li = document.createElement('li');
        li.setAttribute('data-scroll-words', '');
        li.textContent = skill;
        list.append(li);
      });

      groupDiv.append(heading, list);
      fragment.append(groupDiv);
    });

    container.replaceChildren(fragment);
  }

  function renderLinks(data) {
    const emailBtn = document.getElementById('contact-email');
    if (emailBtn && data.email) {
      emailBtn.href = sanitizeUrl(data.email) || '#';
    }

    const linksContainer = document.getElementById('contact-links');
    if (!linksContainer) return;

    const fragment = document.createDocumentFragment();
    data.links.forEach((item, index) => {
      const safeUrl = sanitizeUrl(item.url);
      if (!safeUrl) return;

      const anchor = document.createElement('a');
      anchor.href = safeUrl;
      anchor.textContent = item.label;
      anchor.style.transitionDelay = `${Math.min(index, 6) * 100}ms`;
      if (/^https?:/i.test(safeUrl)) {
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
      }
      fragment.append(anchor);
    });

    if (!fragment.children.length) {
      linksContainer.replaceChildren(createStatusNotice('No links listed in portfolio.txt yet.'));
      return;
    }

    linksContainer.replaceChildren(fragment);
  }

  function renderLoadStatus(result) {
    const message = result && result.isFileProtocol
      ? `Cannot load ${PORTFOLIO_FILE} directly over file:// due to browser security rules. Run a local server (e.g. python3 -m http.server 8080) and open http://localhost:8080, or view the live GitHub Pages site.`
      : `Unable to load ${PORTFOLIO_FILE}. Please verify the file exists and is accessible.`;

    ['projects-grid', 'skills-groups', 'contact-links'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.replaceChildren(createStatusNotice(message));
    });
  }

  function createStatusNotice(text) {
    const notice = document.createElement('p');
    notice.className = 'portfolio-status';
    notice.textContent = text;
    return notice;
  }

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

    // Expand on interactive elements (delegated so dynamically rendered links work too)
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest('a, button')) {
        cursor.classList.add('expanded');
        follower.classList.add('expanded');
      }
    });

    document.addEventListener('mouseout', (e) => {
      const interactive = e.target.closest('a, button');
      if (interactive && !interactive.contains(e.relatedTarget)) {
        cursor.classList.remove('expanded');
        follower.classList.remove('expanded');
      }
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
    const els = Array.from(document.querySelectorAll('.reveal'));
    if (!els.length) return;

    const revealInView = () => {
      const thresholdY = window.innerHeight + 80;
      els.forEach(el => {
        if (el.classList.contains('visible')) return;
        const rect = el.getBoundingClientRect();
        if (rect.top <= thresholdY) {
          el.classList.add('visible');
        }
      });
    };

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target); // animate once
          }
        });
      }, {
        threshold: 0.01,
        rootMargin: '0px 0px 80px 0px',
      });

      els.forEach(el => observer.observe(el));
    }

    window.addEventListener('scroll', revealInView, { passive: true });
    window.addEventListener('resize', revealInView, { passive: true });
    revealInView();
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