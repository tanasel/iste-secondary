(function () {
  var planData = window.PLAN_DATA;
  var coachingStorageKey = "iste-coaching-stage";

  function byId(id) {
    return document.getElementById(id);
  }

  function createElement(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function clearElement(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function getStoredItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function setStoredItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      return;
    }
  }

  function populateSelect(select, items, getValue, getLabel) {
    clearElement(select);
    items.forEach(function (item) {
      var option = document.createElement("option");
      option.value = getValue(item);
      option.textContent = getLabel(item);
      select.appendChild(option);
    });
    select.value = items.length ? getValue(items[0]) : "";
  }

  function findByKey(items, key) {
    return items.find(function (item) {
      return item.key === key;
    });
  }

  function getStandardIndex(standardKey) {
    if (!planData || !planData.standards) return 1;
    var index = planData.standards.findIndex(function (standard) {
      return standard.key === standardKey;
    });
    return index >= 0 ? index + 1 : 1;
  }

  function clearPlanResult(resultRegion) {
    clearElement(resultRegion);
    resultRegion.hidden = true;
  }

  function buildPrompt(programme, standard, unit, year, topic, activity) {
    var topicStr = topic ? " Topic/context: " + topic + "." : "";
    if (unit.type === "task") {
      var role = programme.key === "dpcp"
        ? "an experienced IB Diploma Programme / Career-related Programme teacher or coordinator"
        : "an experienced IB MYP coordinator";
      var through = programme.key === "dpcp" ? "the " + unit.label : "the MYP " + unit.label;
      return "Act as " + role + " at an international secondary school. Design a practical task or approach for " + year + " that develops the ISTE Standard " + standard.num + " '" + standard.name + "' — students " + standard.line + " — through " + through + "." + topicStr + " Build it around this idea: \"" + activity + "\". Include: clear student instructions, formative checkpoints, success criteria tied to BOTH the standard and the relevant IB requirement (e.g. academic integrity, or the Extended Essay / CAS / Personal Project / Service / Reflective Project criteria), and the IB skills it develops. Keep it practical. Do not include or request any real student personal data.";
    }

    return "Act as an experienced IB MYP " + unit.label + " teacher at an international secondary school. Design a single, ready-to-teach lesson for " + year + " that develops the ISTE Standard " + standard.num + " '" + standard.name + "' — students " + standard.line + "." + topicStr + " Build the lesson around this activity idea: \"" + activity + "\". Include: a hook, a student-centred main task, formative checkpoints, success criteria tied to the standard, and one Approaches to Learning (ATL) skill it develops. Keep it practical and adaptable. Do not include or request any real student personal data.";
  }

  function setCopyLabel(button, label) {
    var originalLabel = button.getAttribute("data-original-label") || button.textContent;
    button.setAttribute("data-original-label", originalLabel);
    button.textContent = label;
    window.setTimeout(function () {
      button.textContent = originalLabel;
    }, 1500);
  }

  function fallbackCopy(textarea, button) {
    textarea.focus();
    textarea.select();

    try {
      if (document.execCommand && document.execCommand("copy")) {
        setCopyLabel(button, "Copied!");
        return;
      }
    } catch (error) {
      setCopyLabel(button, "Selected");
      return;
    }

    setCopyLabel(button, "Selected");
  }

  function copyPrompt(textarea, button) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textarea.value).then(
        function () {
          setCopyLabel(button, "Copied!");
        },
        function () {
          fallbackCopy(textarea, button);
        }
      );
      return;
    }

    fallbackCopy(textarea, button);
  }

  function openInTool(url, textarea, button) {
    // Open synchronously inside the click gesture (avoids popup blocking), then copy.
    window.open(url, "_blank", "noopener");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textarea.value).then(
        function () {
          setCopyLabel(button, "Prompt copied — paste it in");
        },
        function () {}
      );
    }
  }

  function renderPlanResult(resultRegion, programme, standard, unit, year, topic, activity) {
    var standardIndex = getStandardIndex(standard.key);
    var prompt = buildPrompt(programme, standard, unit, year, topic, activity);
    var resultGrid = createElement("div", "result-grid");

    var activityCard = createElement("article", "activity-card s" + standardIndex);
    var activityHeading = createElement("h2", null, "Try this — " + unit.label);
    var standardChip = createElement("p", "standard-chip", "ISTE " + standard.num + " · " + standard.name);
    var activityText = createElement("p", null, activity);
    activityCard.appendChild(activityHeading);
    activityCard.appendChild(standardChip);
    activityCard.appendChild(activityText);

    var promptCard = createElement("article", "prompt-card");
    var promptHeading = createElement("h2", null, "AI lesson prompt");
    var textarea = document.createElement("textarea");
    textarea.className = "prompt-output";
    textarea.readOnly = true;
    textarea.value = prompt;
    textarea.setAttribute("aria-label", "Generated AI lesson prompt");

    var actions = createElement("div", "prompt-actions");
    var copyButton = createElement("button", "button button-primary", "Copy prompt");
    copyButton.type = "button";
    copyButton.addEventListener("click", function () {
      copyPrompt(textarea, copyButton);
    });
    actions.appendChild(copyButton);

    var magicButton = createElement("button", "button button-ghost", "Open in Magic School");
    magicButton.type = "button";
    magicButton.addEventListener("click", function () {
      openInTool("https://app.magicschool.ai/tools", textarea, magicButton);
    });
    actions.appendChild(magicButton);

    var geminiButton = createElement("button", "button button-ghost", "Open in Gemini");
    geminiButton.type = "button";
    geminiButton.addEventListener("click", function () {
      openInTool("https://gemini.google.com/app", textarea, geminiButton);
    });
    actions.appendChild(geminiButton);

    var note = createElement(
      "p",
      "tool-note",
      "Tip: clicking a tool copies the prompt and opens it in a new tab — just paste (Cmd/Ctrl+V). Never include real student data."
    );
    promptCard.appendChild(promptHeading);
    promptCard.appendChild(textarea);
    promptCard.appendChild(actions);
    promptCard.appendChild(note);

    resultGrid.appendChild(activityCard);
    resultGrid.appendChild(promptCard);

    clearElement(resultRegion);
    resultRegion.appendChild(resultGrid);
    resultRegion.hidden = false;

    try {
      resultRegion.focus({ preventScroll: false });
    } catch (error) {
      resultRegion.focus();
    }
  }

  function initPlanTool() {
    var form = document.querySelector("[data-plan-tool]");
    if (!form) return;

    var standardSelect = byId("plan-standard");
    var unitSelect = byId("plan-unit");
    var unitLabel = document.querySelector("[data-unit-label]");
    var yearSelect = byId("plan-year");
    var topicInput = byId("plan-topic");
    var error = document.querySelector("[data-plan-error]");
    var button = document.querySelector("[data-plan-submit]");
    var resultRegion = document.querySelector("[data-plan-results]");
    var programmeGroup = document.querySelector("[data-programme-picker]");
    var programmeButtons = programmeGroup
      ? Array.prototype.slice.call(programmeGroup.querySelectorAll("[data-programme-option]"))
      : [];
    var currentProgramme = null;

    if (
      !planData ||
      !planData.standards ||
      !planData.programmes ||
      !planData.activities ||
      !standardSelect ||
      !unitSelect ||
      !unitLabel ||
      !yearSelect ||
      !topicInput ||
      !button ||
      !resultRegion ||
      !programmeButtons.length
    ) {
      if (error) error.textContent = "The Plan it data could not be loaded.";
      return;
    }

    populateSelect(
      standardSelect,
      planData.standards,
      function (standard) {
        return standard.key;
      },
      function (standard) {
        return standard.num + " — " + standard.name;
      }
    );

    function setProgrammeButtonState(programmeKey) {
      programmeButtons.forEach(function (programmeButton, index) {
        var isSelected = programmeButton.getAttribute("data-programme-option") === programmeKey;
        programmeButton.setAttribute("aria-checked", String(isSelected));
        programmeButton.tabIndex = isSelected || (!programmeKey && index === 0) ? 0 : -1;
      });
    }

    function setProgramme(programmeKey, clearResult) {
      var programme = findByKey(planData.programmes, programmeKey) || planData.programmes[0];
      if (!programme) return;

      currentProgramme = programme;
      unitLabel.textContent = programme.unitLabel;
      setProgrammeButtonState(programme.key);
      populateSelect(
        unitSelect,
        programme.units,
        function (unit) {
          return unit.key;
        },
        function (unit) {
          return unit.label;
        }
      );
      populateSelect(
        yearSelect,
        programme.years,
        function (year) {
          return year;
        },
        function (year) {
          return year;
        }
      );

      if (clearResult) {
        if (error) error.textContent = "";
        clearPlanResult(resultRegion);
      }
    }

    function moveProgrammeSelection(currentButton, direction) {
      var currentIndex = programmeButtons.indexOf(currentButton);
      if (currentIndex < 0) return;
      var nextIndex = (currentIndex + direction + programmeButtons.length) % programmeButtons.length;
      var nextButton = programmeButtons[nextIndex];
      nextButton.focus();
      setProgramme(nextButton.getAttribute("data-programme-option"), true);
    }

    function generatePlan() {
      var programme = currentProgramme;
      var standard = findByKey(planData.standards, standardSelect.value);
      var unit = programme ? findByKey(programme.units, unitSelect.value) : null;
      var year = yearSelect.value;
      var topic = topicInput.value.trim();

      if (!programme || !standard || !unit || !year) {
        if (error) error.textContent = "Choose a programme, standard, unit and year before planning.";
        (programme ? standard ? unit ? yearSelect : unitSelect : standardSelect : programmeButtons[0]).focus();
        return;
      }

      var activity =
        planData.activities[programme.key] &&
        planData.activities[programme.key][unit.key] &&
        planData.activities[programme.key][unit.key][standard.key];
      if (!activity) {
        if (error) error.textContent = "No activity is available for that combination yet.";
        return;
      }

      if (error) error.textContent = "";
      renderPlanResult(resultRegion, programme, standard, unit, year, topic, activity);
    }

    programmeButtons.forEach(function (programmeButton) {
      programmeButton.addEventListener("click", function () {
        setProgramme(programmeButton.getAttribute("data-programme-option"), true);
      });

      programmeButton.addEventListener("keydown", function (event) {
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          moveProgrammeSelection(programmeButton, 1);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          moveProgrammeSelection(programmeButton, -1);
        } else if (event.key === "Home") {
          event.preventDefault();
          programmeButtons[0].focus();
          setProgramme(programmeButtons[0].getAttribute("data-programme-option"), true);
        } else if (event.key === "End") {
          event.preventDefault();
          programmeButtons[programmeButtons.length - 1].focus();
          setProgramme(programmeButtons[programmeButtons.length - 1].getAttribute("data-programme-option"), true);
        } else if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          setProgramme(programmeButton.getAttribute("data-programme-option"), true);
        }
      });
    });

    setProgramme("myp", false);
    button.addEventListener("click", generatePlan);
    topicInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        generatePlan();
      }
    });
  }

  var stages = {
    aware: {
      name: "Aware",
      accent: "s1",
      next: "pick ONE standard and try one tool with support — model it before you assess it.",
      standards: [
        { label: "Empowered Learner", href: "standards.html#s1" },
        { label: "Digital Citizen", href: "standards.html#s2" }
      ],
      ctaLabel: "Try the Plan it tool",
      ctaHref: "plan.html"
    },
    connecting: {
      name: "Connecting",
      accent: "s3",
      next: "map a tool you already use to the standard it serves, then plan one lesson around that standard.",
      standards: [
        { label: "Knowledge Constructor", href: "standards.html#s3" },
        { label: "Creative Communicator", href: "standards.html#s6" }
      ],
      ctaLabel: "Plan a lesson",
      ctaHref: "plan.html"
    },
    embedding: {
      name: "Embedding",
      accent: "s4",
      next: "co-teach it with a colleague and check the look-fors — measure impact, not attendance.",
      standards: [
        { label: "Innovative Designer", href: "standards.html#s4" },
        { label: "Computational Thinker", href: "standards.html#s5" }
      ],
      ctaLabel: "See the standards",
      ctaHref: "standards.html"
    },
    coaching: {
      name: "Coaching",
      accent: "s7",
      next: "run a short ISH Academy session and share the Plan it tool — coach to the ISTE Standards for Coaches.",
      standards: [
        { label: "Global Collaborator", href: "standards.html#s7" },
        { label: "Digital Citizen", href: "standards.html#s2" }
      ],
      ctaLabel: "The coach's lens",
      ctaHref: "coaching.html#coach-lens"
    }
  };

  function renderStageResult(result, stage) {
    clearElement(result);
    result.className = "pathway-result " + stage.accent;

    var heading = createElement("h3", null, "Stage: " + stage.name + ".");
    var next = createElement("p", null);
    var nextStrong = createElement("strong", null, "Your next step: ");
    next.appendChild(nextStrong);
    next.appendChild(document.createTextNode(stage.next));

    var start = createElement("p", "start-links");
    var startStrong = createElement("strong", null, "Start with these standards: ");
    start.appendChild(startStrong);
    stage.standards.forEach(function (standard, index) {
      var link = document.createElement("a");
      link.href = standard.href;
      link.textContent = standard.label;
      start.appendChild(link);
      if (index < stage.standards.length - 1) {
        start.appendChild(document.createTextNode(", "));
      }
    });

    var cta = document.createElement("a");
    cta.className = "button button-primary";
    cta.href = stage.ctaHref;
    cta.textContent = stage.ctaLabel;

    result.appendChild(heading);
    result.appendChild(next);
    result.appendChild(start);
    result.appendChild(cta);
    result.hidden = false;
  }

  function initCoachingSelfCheck() {
    var group = document.querySelector("[data-stage-picker]");
    var result = document.querySelector("[data-stage-result]");
    if (!group || !result) return;

    var buttons = Array.prototype.slice.call(group.querySelectorAll("[data-stage-option]"));
    if (!buttons.length) return;

    function setButtonState(selectedKey) {
      buttons.forEach(function (button, index) {
        var isSelected = button.getAttribute("data-stage-option") === selectedKey;
        button.setAttribute("aria-checked", String(isSelected));
        button.tabIndex = isSelected || (!selectedKey && index === 0) ? 0 : -1;
      });
    }

    function selectStage(stageKey, persist) {
      var stage = stages[stageKey];
      if (!stage) return;
      setButtonState(stageKey);
      renderStageResult(result, stage);
      if (persist) setStoredItem(coachingStorageKey, stageKey);
    }

    function moveSelection(currentButton, direction) {
      var currentIndex = buttons.indexOf(currentButton);
      if (currentIndex < 0) return;
      var nextIndex = (currentIndex + direction + buttons.length) % buttons.length;
      var nextButton = buttons[nextIndex];
      nextButton.focus();
      selectStage(nextButton.getAttribute("data-stage-option"), true);
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        selectStage(button.getAttribute("data-stage-option"), true);
      });

      button.addEventListener("keydown", function (event) {
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          moveSelection(button, 1);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          moveSelection(button, -1);
        } else if (event.key === "Home") {
          event.preventDefault();
          buttons[0].focus();
          selectStage(buttons[0].getAttribute("data-stage-option"), true);
        } else if (event.key === "End") {
          event.preventDefault();
          buttons[buttons.length - 1].focus();
          selectStage(buttons[buttons.length - 1].getAttribute("data-stage-option"), true);
        } else if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          selectStage(button.getAttribute("data-stage-option"), true);
        }
      });
    });

    var storedStage = getStoredItem(coachingStorageKey);
    if (storedStage && stages[storedStage]) {
      selectStage(storedStage, false);
    } else {
      setButtonState(null);
    }
  }

  initPlanTool();
  initCoachingSelfCheck();
})();
