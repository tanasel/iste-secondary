(function () {
  var data = window.PLAN_DATA;

  function createElement(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function clearElement(element) {
    while (element.firstChild) element.removeChild(element.firstChild);
  }

  function getStoredSubject() {
    try {
      return localStorage.getItem("iste-coordinator-subject");
    } catch (error) {
      return null;
    }
  }

  function storeSubject(subjectKey) {
    try {
      localStorage.setItem("iste-coordinator-subject", subjectKey);
    } catch (error) {
      return;
    }
  }

  function copyText(text, callback) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { callback(true); },
        function () { fallbackCopy(text, callback); }
      );
      return;
    }
    fallbackCopy(text, callback);
  }

  function fallbackCopy(text, callback) {
    var textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    var copied = false;
    try {
      copied = Boolean(document.execCommand && document.execCommand("copy"));
    } catch (error) {
      copied = false;
    }

    document.body.removeChild(textarea);
    callback(copied);
  }

  function initSubjectLens() {
    var select = document.querySelector("[data-subject-lens-select]");
    var results = document.querySelector("[data-subject-lens-results]");
    var heading = document.querySelector("[data-subject-lens-heading]");
    var copyButton = document.querySelector("[data-copy-lens]");
    var toggleButton = document.querySelector("[data-toggle-lens]");
    var printButton = document.querySelector("[data-print-page]");
    var status = document.querySelector("[data-copy-status]");

    if (!select || !results || !heading || !data || !data.standards || !data.programmes || !data.activities) {
      return;
    }

    var myp = data.programmes.find(function (programme) {
      return programme.key === "myp";
    });
    if (!myp) return;

    var subjects = myp.units.filter(function (unit) {
      return unit.type === "subject";
    });
    var selectedSubject = null;
    var allOpen = false;

    clearElement(select);
    subjects.forEach(function (subject) {
      var option = document.createElement("option");
      option.value = subject.key;
      option.textContent = subject.label;
      select.appendChild(option);
    });

    function setStatus(message) {
      if (!status) return;
      status.textContent = message;
      if (message) {
        window.setTimeout(function () {
          if (status.textContent === message) status.textContent = "";
        }, 2400);
      }
    }

    function buildCopyText() {
      if (!selectedSubject) return "";
      var lines = [
        "ISH ISTE department starter",
        "Subject: " + selectedSubject.label,
        "",
        "Choose ONE standard for an upcoming unit:"
      ];

      data.standards.forEach(function (standard) {
        var activity = data.activities.myp[selectedSubject.key][standard.key];
        lines.push(standard.num + " " + standard.name + ": " + standard.line + ".");
        lines.push("Try: " + activity);
        lines.push("");
      });

      lines.push("Department move: name one standard, agree one observable student look-for, try it once, then bring back a work sample, student voice and one teacher observation.");
      lines.push("Source: https://tanasel.github.io/iste-secondary/standards.html");
      return lines.join("\n");
    }

    function renderSubject(subjectKey) {
      selectedSubject = subjects.find(function (subject) {
        return subject.key === subjectKey;
      }) || subjects[0];
      if (!selectedSubject) return;

      select.value = selectedSubject.key;
      heading.textContent = selectedSubject.label;
      storeSubject(selectedSubject.key);
      clearElement(results);
      allOpen = false;

      data.standards.forEach(function (standard, index) {
        var activity = data.activities.myp[selectedSubject.key][standard.key];
        var details = createElement("details", "lens-card s" + (index + 1));
        if (index === 0) details.open = true;

        var summary = document.createElement("summary");
        var number = createElement("span", "lens-number", standard.num);
        var summaryCopy = createElement("span", "lens-summary-copy");
        var name = createElement("strong", null, standard.name);
        var line = createElement("small", null, standard.line);
        var marker = createElement("span", "lens-marker", "+");
        marker.setAttribute("aria-hidden", "true");
        summaryCopy.appendChild(name);
        summaryCopy.appendChild(line);
        summary.appendChild(number);
        summary.appendChild(summaryCopy);
        summary.appendChild(marker);

        var body = createElement("div", "lens-card-body");
        var ideaLabel = createElement("span", "mini-label", "SUBJECT IDEA");
        var idea = createElement("p", null, activity);
        var link = document.createElement("a");
        link.className = "text-link";
        link.href = "plan.html?programme=myp&unit=" + encodeURIComponent(selectedSubject.key) + "&standard=" + encodeURIComponent(standard.key);
        link.textContent = "Plan this for a year group →";
        body.appendChild(ideaLabel);
        body.appendChild(idea);
        body.appendChild(link);

        details.appendChild(summary);
        details.appendChild(body);
        results.appendChild(details);
      });

      if (toggleButton) {
        toggleButton.textContent = "Open all ideas";
        toggleButton.setAttribute("aria-expanded", "false");
      }
    }

    select.addEventListener("change", function () {
      renderSubject(select.value);
    });

    if (toggleButton) {
      toggleButton.addEventListener("click", function () {
        allOpen = !allOpen;
        Array.prototype.forEach.call(results.querySelectorAll("details"), function (details) {
          details.open = allOpen;
        });
        toggleButton.textContent = allOpen ? "Close all ideas" : "Open all ideas";
        toggleButton.setAttribute("aria-expanded", String(allOpen));
      });
    }

    if (copyButton) {
      copyButton.addEventListener("click", function () {
        copyText(buildCopyText(), function (copied) {
          setStatus(copied ? "Department starter copied." : "Copy was blocked. Select the text from an open idea instead.");
        });
      });
    }

    if (printButton) {
      printButton.addEventListener("click", function () {
        document.body.classList.add("print-subject-lens");
        window.print();
      });
      window.addEventListener("afterprint", function () {
        document.body.classList.remove("print-subject-lens");
      });
    }

    var stored = getStoredSubject();
    var initial = subjects.some(function (subject) { return subject.key === stored; }) ? stored : subjects[0].key;
    renderSubject(initial);
  }

  function initBriefing() {
    var dialog = document.querySelector("[data-briefing-dialog]");
    var openButtons = Array.prototype.slice.call(document.querySelectorAll("[data-open-briefing]"));
    if (!dialog || !openButtons.length) return;

    var slides = Array.prototype.slice.call(dialog.querySelectorAll("[data-briefing-slide]"));
    var previous = dialog.querySelector("[data-briefing-prev]");
    var next = dialog.querySelector("[data-briefing-next]");
    var close = dialog.querySelector("[data-close-briefing]");
    var count = dialog.querySelector("[data-briefing-count]");
    var progress = dialog.querySelector("[data-briefing-progress]");
    var jump = dialog.querySelector("[data-briefing-jump]");
    var current = 0;

    function renderSlide(index) {
      current = Math.max(0, Math.min(index, slides.length - 1));
      slides.forEach(function (slide, slideIndex) {
        slide.hidden = slideIndex !== current;
      });
      if (count) count.textContent = (current + 1) + " / " + slides.length;
      if (progress) progress.style.width = (((current + 1) / slides.length) * 100) + "%";
      if (previous) previous.disabled = current === 0;
      if (next) {
        next.disabled = current === slides.length - 1;
        next.textContent = current === slides.length - 1 ? "Ready" : "Next →";
      }
    }

    function openBriefing() {
      renderSlide(0);
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
        dialog.classList.add("is-fallback");
      }
      document.body.classList.add("briefing-open");
      if (close) close.focus();
    }

    function closeBriefing() {
      if (typeof dialog.close === "function" && dialog.open) {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
      document.body.classList.remove("briefing-open");
      openButtons[0].focus();
    }

    openButtons.forEach(function (button) {
      button.addEventListener("click", openBriefing);
    });
    if (previous) previous.addEventListener("click", function () { renderSlide(current - 1); });
    if (next) next.addEventListener("click", function () { renderSlide(current + 1); });
    if (close) close.addEventListener("click", closeBriefing);
    if (jump) jump.addEventListener("click", closeBriefing);

    dialog.addEventListener("close", function () {
      document.body.classList.remove("briefing-open");
    });

    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) closeBriefing();
    });

    dialog.addEventListener("keydown", function (event) {
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        renderSlide(current + 1);
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        renderSlide(current - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        renderSlide(0);
      } else if (event.key === "End") {
        event.preventDefault();
        renderSlide(slides.length - 1);
      }
    });

    renderSlide(0);

    try {
      if (new URLSearchParams(window.location.search).get("briefing") === "1") {
        openBriefing();
      }
    } catch (error) {
      return;
    }
  }

  initSubjectLens();
  initBriefing();
})();
