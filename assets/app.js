(function () {
  "use strict";

  var root = document.documentElement;
  var nav = document.getElementById("resource-nav");
  var menuButton = document.querySelector("[data-menu-toggle]");
  var status = document.getElementById("ish-preference-status");
  var year = document.querySelector("[data-year]");
  var controls = {
    contrast: {
      button: document.querySelector('[data-ish-toggle="contrast"]'),
      attribute: "data-contrast",
      key: "ishacademy:contrast",
      on: "high",
      onLabel: "High",
      offLabel: "Default",
      announcement: "High contrast"
    },
    font: {
      button: document.querySelector('[data-ish-toggle="font"]'),
      attribute: "data-font",
      key: "ishacademy:font",
      on: "dyslexic",
      onLabel: "Dyslexia",
      offLabel: "Default",
      announcement: "Dyslexia-friendly font"
    }
  };

  function storedValue(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function storeValue(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      return;
    }
  }

  function setControl(control, enabled, announce) {
    if (!control.button) return;
    var stateLabel = control.button.querySelector("[data-ish-state]");
    if (enabled) root.setAttribute(control.attribute, control.on);
    else root.removeAttribute(control.attribute);
    control.button.setAttribute("aria-pressed", String(enabled));
    if (stateLabel) stateLabel.textContent = enabled ? control.onLabel : control.offLabel;
    storeValue(control.key, enabled ? control.on : "default");
    if (announce && status) status.textContent = control.announcement + (enabled ? " on" : " off");
  }

  // Framed inside ISH Academy (page 1032): follow that page's Contrast and Font switches, sent with postMessage.
  // Nothing is stored here: the Academy page keeps the choice.
  window.addEventListener("message", function (event) {
    if (event.origin !== "https://www.ish.academy") return;
    var data = event.data;
    if (!data || data.type !== "ish-prefs") return;
    if (data.contrast === "high") root.setAttribute("data-contrast", "high");
    else root.removeAttribute("data-contrast");
    if (data.font === "dyslexic") root.setAttribute("data-font", "dyslexic");
    else root.removeAttribute("data-font");
  });

  Object.keys(controls).forEach(function (name) {
    var control = controls[name];
    if (!control.button) return;
    var enabled = root.getAttribute(control.attribute) === control.on || storedValue(control.key) === control.on;
    setControl(control, enabled, false);
    control.button.addEventListener("click", function () {
      setControl(control, control.button.getAttribute("aria-pressed") !== "true", true);
    });
  });

  function closeMenu() {
    if (!menuButton || !nav) return;
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open resource menu");
    nav.classList.remove("is-open");
  }

  if (menuButton && nav) {
    menuButton.addEventListener("click", function () {
      var isOpen = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!isOpen));
      menuButton.setAttribute("aria-label", isOpen ? "Open resource menu" : "Close resource menu");
      nav.classList.toggle("is-open", !isOpen);
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeMenu();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) closeMenu();
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-print]"), function (button) {
    button.addEventListener("click", function () {
      window.print();
    });
  });

  window.addEventListener("storage", function (event) {
    Object.keys(controls).forEach(function (name) {
      var control = controls[name];
      if (event.key === control.key) setControl(control, event.newValue === control.on, false);
    });
  });

  if (year) year.textContent = String(new Date().getFullYear());
})();
