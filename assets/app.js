(function () {
  var root = document.documentElement;
  var storageKey = "iste-secondary-theme";
  var nav = document.getElementById("site-nav");
  var menuButton = document.querySelector("[data-menu-toggle]");
  var themeButton = document.querySelector("[data-theme-toggle]");
  var year = document.querySelector("[data-year]");

  function getStoredTheme() {
    try {
      return localStorage.getItem(storageKey);
    } catch (error) {
      return null;
    }
  }

  function storeTheme(theme) {
    try {
      localStorage.setItem(storageKey, theme);
    } catch (error) {
      return;
    }
  }

  function applyTheme(theme) {
    var nextTheme = theme === "dark" ? "dark" : "light";
    root.setAttribute("data-theme", nextTheme);

    if (themeButton) {
      var isDark = nextTheme === "dark";
      themeButton.setAttribute("aria-pressed", String(isDark));
      themeButton.setAttribute(
        "aria-label",
        isDark ? "Switch to light theme" : "Switch to dark theme"
      );
    }
  }

  function closeMenu() {
    if (!menuButton || !nav) return;
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open menu");
    nav.classList.remove("is-open");
  }

  function toggleMenu() {
    if (!menuButton || !nav) return;
    var isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Open menu" : "Close menu");
    nav.classList.toggle("is-open", !isOpen);
  }

  function closestElement(target, selector) {
    if (!target) return null;
    if (target.closest) return target.closest(selector);
    if (target.parentElement && target.parentElement.closest) {
      return target.parentElement.closest(selector);
    }
    return null;
  }

  function getHashTarget(hash) {
    if (!hash || hash.length < 2) return null;
    try {
      return document.getElementById(decodeURIComponent(hash.slice(1)));
    } catch (error) {
      return null;
    }
  }

  function alignHashTarget() {
    var target = getHashTarget(window.location.hash);
    if (!target) return;
    window.requestAnimationFrame(function () {
      var header = document.querySelector(".site-header");
      var jumpNav = document.querySelector(".page-jump-nav");
      var offset = (header ? header.offsetHeight : 0) + (jumpNav ? jumpNav.offsetHeight : 0) + 8;
      var top = target.getBoundingClientRect().top + window.scrollY - offset;
      var previousScrollBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      window.scrollTo(0, Math.max(0, top));
      window.requestAnimationFrame(function () {
        root.style.scrollBehavior = previousScrollBehavior;
      });
    });
  }

  function settleHashTarget() {
    alignHashTarget();
    window.setTimeout(alignHashTarget, 180);
  }

  function initPageJumpNav() {
    var jumpNav = document.querySelector(".page-jump-nav");
    if (!jumpNav) return;

    var links = Array.prototype.slice.call(jumpNav.querySelectorAll('a[href^="#"]'));
    var items = links.map(function (link) {
      return {
        link: link,
        section: getHashTarget(link.getAttribute("href"))
      };
    }).filter(function (item) {
      return item.section;
    });
    var jumpScroller = jumpNav.querySelector(".page-jump-inner");
    var activeLink = null;
    var ticking = false;

    function setActive(link) {
      var changed = activeLink !== link;
      activeLink = link;
      links.forEach(function (candidate) {
        if (candidate === link) {
          candidate.setAttribute("aria-current", "location");
        } else {
          candidate.removeAttribute("aria-current");
        }
      });

      if (changed && link && jumpScroller && jumpScroller.scrollWidth > jumpScroller.clientWidth) {
        var desiredLeft = link.offsetLeft - (jumpScroller.clientWidth - link.offsetWidth) / 2;
        var maxLeft = jumpScroller.scrollWidth - jumpScroller.clientWidth;
        jumpScroller.scrollLeft = Math.max(0, Math.min(maxLeft, desiredLeft));
      }
    }

    function updateActive() {
      ticking = false;
      if (!items.length) return;

      var header = document.querySelector(".site-header");
      var offset = (header ? header.offsetHeight : 0) + jumpNav.offsetHeight + 40;
      var position = window.scrollY + offset;
      var active = null;
      var activeTop = -1;
      var hash = window.location.hash;

      items.forEach(function (item) {
        var itemTop = item.section.offsetTop;
        if (itemTop > position) return;
        if (itemTop > activeTop || (itemTop === activeTop && item.link.getAttribute("href") === hash)) {
          active = item.link;
          activeTop = itemTop;
        }
      });
      if (Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 2) {
        active = items[items.length - 1].link;
      }
      setActive(active);
    }

    links.forEach(function (link) {
      link.addEventListener("click", function () {
        setActive(link);
      });
    });

    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateActive);
    }, { passive: true });
    window.addEventListener("resize", updateActive);
    window.addEventListener("hashchange", updateActive);
    updateActive();
  }

  applyTheme(getStoredTheme() || "light");

  if (themeButton) {
    themeButton.addEventListener("click", function () {
      var nextTheme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      storeTheme(nextTheme);
    });
  }

  if (menuButton && nav) {
    menuButton.addEventListener("click", toggleMenu);

    nav.addEventListener("click", function (event) {
      if (closestElement(event.target, "a")) closeMenu();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu();
    });

    document.addEventListener("click", function (event) {
      var clickedHeader = closestElement(event.target, ".site-header");
      if (!clickedHeader) closeMenu();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1080) closeMenu();
    });
  }

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  initPageJumpNav();

  if (window.location.hash) {
    window.addEventListener("load", settleHashTarget);
    window.addEventListener("pageshow", settleHashTarget);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(settleHashTarget);
    }
  }
})();
