window.addEventListener("DOMContentLoaded", function() {
  const html            = document.querySelector("html");
  const navBtn          = document.querySelector(".navbar-btn");
  const navList         = document.querySelector(".navbar-list");
  const backToTopFixed  = document.querySelector(".back-to-top-fixed");
  let lastTop           = 0;
  let lastRefreshTime   = 0;
  let frameCount        = 0;
  let refreshRate       = 0;
  let theme             = window.localStorage.getItem('theme') || '';

  theme && html.classList.add(theme)


  /**
   * 初始化刷新率估计
   */
  const estimateRefreshRate = () => {
      const currentTime = performance.now();
      if (currentTime - lastRefreshTime >= 1000) { // fps
          refreshRate = frameCount;
          frameCount = 0;
          lastRefreshTime = currentTime;
      } else {
          frameCount++;
      }
      requestAnimationFrame(estimateRefreshRate);
  }
  
  estimateRefreshRate();

  const goScrollTop = () => {
    let currentTop = getScrollTop()
    let speed = Math.floor(-currentTop / (refreshRate / 6))
    if (currentTop > lastTop + 0.5 || currentTop < lastTop - 0.5 ) {
      // interrupt the animation
      return lastTop = 0
    }
    let distance = currentTop + speed;
    lastTop = distance;
    document.documentElement.scrollTop = distance;
    distance > 0 && window.requestAnimationFrame(goScrollTop)
  }

  const toggleBackToTopBtn = (top) => {
    top = top || getScrollTop()
    if (top >= 100) {
      backToTopFixed.classList.add("show")
    } else {
      backToTopFixed.classList.remove("show")
    }
  }

  toggleBackToTopBtn()

  // theme light click
  document.querySelector('#theme-light').addEventListener('click', function () {
    html.classList.remove('theme-dark')
    html.classList.add('theme-light')
    window.localStorage.setItem('theme', 'theme-light')
  })

  // theme dark click
  document.querySelector('#theme-dark').addEventListener('click', function () {
    html.classList.remove('theme-light')
    html.classList.add('theme-dark')
    window.localStorage.setItem('theme', 'theme-dark')
  })

  // theme auto click
  document.querySelector('#theme-auto').addEventListener('click', function() {
    html.classList.remove('theme-light')
    html.classList.remove('theme-dark')
    window.localStorage.setItem('theme', '')
  })

  // mobile nav click
  navBtn.addEventListener("click", function () {
    html.classList.toggle("show-mobile-nav");
    this.classList.toggle("active");
  });

  // mobile nav link click
  navList.addEventListener("click", function (e) {
    if (e.target.nodeName == "A" && html.classList.contains("show-mobile-nav")) {
      navBtn.click()
    }
  })

  // click back to top
  backToTopFixed.addEventListener("click", function () {
    lastTop = getScrollTop()
    goScrollTop()
  });

  window.addEventListener("scroll", function () {
    toggleBackToTopBtn()
  }, { passive: true });

  /** handle lazy bg iamge */
  handleLazyBG();

  // ---- 目录栏折叠 ----
  const tocSidebar = document.querySelector('#toc-sidebar');
  const tocToggle = document.querySelector('#toc-toggle');
  if (tocSidebar && tocToggle) {
    if (localStorage.getItem('toc-collapsed') === '1') {
      tocSidebar.classList.add('collapsed');
    }
    tocToggle.addEventListener('click', function () {
      tocSidebar.classList.toggle('collapsed');
      localStorage.setItem('toc-collapsed', tocSidebar.classList.contains('collapsed') ? '1' : '0');
    });
  }

  // ---- 目录 scroll-spy + 平滑滚动 ----
  function decodeAnchor(href) {
    let id = href.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch (e) {
      // 保持原样
    }
    return id;
  }

  const tocLinks = document.querySelectorAll('.toc-sidebar__body a[href^="#"]');
  const headings = [];
  tocLinks.forEach(function (link) {
    const el = document.getElementById(decodeAnchor(link.getAttribute('href')));
    if (el) headings.push({ el: el, link: link });
  });

  if (headings.length > 0) {
    tocLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        const id = decodeAnchor(link.getAttribute('href'));
        const el = document.getElementById(id);
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.replaceState(null, null, '#' + id);
        }
      });
    });

    function updateScrollSpy() {
      let current = null;
      for (let i = 0; i < headings.length; i++) {
        if (headings[i].el.getBoundingClientRect().top <= 100) {
          current = headings[i];
        } else {
          break;
        }
      }
      if (!current && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        current = headings[headings.length - 1];
      }
      headings.forEach(function (h) {
        h.link.classList.toggle('active', h === current);
      });
    }

    window.addEventListener('scroll', updateScrollSpy, { passive: true });
    updateScrollSpy();
  }

  // ---- 评论抽屉 ----
  const commentFab = document.querySelector('#comment-fab');
  const commentDrawer = document.querySelector('#comment-drawer');
  const commentMask = document.querySelector('#comment-mask');
  const commentClose = document.querySelector('#comment-close');

  function initTwikoo() {
    if (window.__twikooInited || !window.__twikooEnvId) return;
    window.__twikooInited = true;
    function doInit() {
      twikoo.init({
        envId: window.__twikooEnvId,
        el: '#twikoo_thread',
        lang: 'zh-CN'
      });
    }
    if (typeof twikoo !== 'undefined') {
      doInit();
      return;
    }
    const script = document.createElement('script');
    script.src = window.__twikooJs || 'https://cdn.jsdelivr.net/npm/twikoo@1.6.44/dist/twikoo.min.js';
    script.onload = doInit;
    script.onerror = function () {
      window.__twikooInited = false;
    };
    document.head.appendChild(script);
  }

  function openCommentDrawer() {
    if (!commentDrawer) return;
    commentDrawer.classList.add('open');
    if (commentMask) commentMask.classList.add('show');
    document.documentElement.style.overflow = 'hidden';

    // 懒加载 Twikoo
    initTwikoo();
  }

  function closeCommentDrawer() {
    if (!commentDrawer) return;
    commentDrawer.classList.remove('open');
    if (commentMask) commentMask.classList.remove('show');
    document.documentElement.style.overflow = '';
  }

  if (commentFab) commentFab.addEventListener('click', openCommentDrawer);
  if (commentClose) commentClose.addEventListener('click', closeCommentDrawer);
  if (commentMask) commentMask.addEventListener('click', closeCommentDrawer);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && commentDrawer && commentDrawer.classList.contains('open')) {
      closeCommentDrawer();
    }
  });
});

/**
 * 获取当前滚动条距离顶部高度
 *
 * @returns 距离高度
 */
function getScrollTop () {
  return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
}

function querySelectorArrs (selector) {
  return Array.from(document.querySelectorAll(selector))
}


function handleLazyBG () {
  const lazyBackgrounds = querySelectorArrs('[background-image-lazy]')
  let lazyBackgroundsCount = lazyBackgrounds.length
  if (lazyBackgroundsCount > 0) {
    let lazyBackgroundObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function({ isIntersecting, target }) {
        if (isIntersecting) {
          let img = target.dataset.img
          if (img) {
            target.style.backgroundImage = `url(${img})`
          }
          lazyBackgroundObserver.unobserve(target)
          lazyBackgroundsCount --
        }
        if (lazyBackgroundsCount <= 0) {
          lazyBackgroundObserver.disconnect()
        }
      })
    })

    lazyBackgrounds.forEach(function(lazyBackground) {
      lazyBackgroundObserver.observe(lazyBackground)
    })
  }
}