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
      if (window.innerWidth > 820) closeMenu();
    });
  }

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }
})();
