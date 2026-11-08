"use strict";

// Match the IDs in index.html and keep the existing degree storage key.
const fieldIds = {
  degree: "dg",
  major: "mj",
  minor: "mi",
  completed: "cr",
  inProgress: "in",
  required: "rq"
};
const degreeKey = "dukeTrackDegree";
const saveMessage = document.getElementById("save-message");

function readSaved(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

const savedDegree = readSaved(degreeKey, {});
for (const [field, id] of Object.entries(fieldIds)) {
  const input = document.getElementById(id);
  if (typeof savedDegree[field] === "string") {
    input.value = savedDegree[field];
  }
}

function updateProgress() {
  const completed = Math.max(0, Number(document.getElementById("cr").value));
  const required = Number(document.getElementById("rq").value);
  const hasGoal = required > 0;
  const percent = hasGoal ? Math.min(100, Math.round(completed / required * 100)) : 0;

  document.getElementById("credit-summary").textContent = hasGoal
    ? completed + " of " + required + " credits completed (" + percent + "%)"
    : "Enter the number of credits required.";
  document.getElementById("credit-remaining").textContent = hasGoal
    ? Math.max(0, required - completed) + " credits remaining."
    : "";
  document.getElementById("degree-progress-bar").style.width = percent + "%";
  document.getElementById("degree-progress").setAttribute("aria-valuenow", String(percent));
}

for (const id of ["cr", "rq"]) {
  document.getElementById(id).addEventListener("input", updateProgress);
}
updateProgress();

document.getElementById("save-degree").addEventListener("click", function () {
  const degreeInfo = {};
  for (const [field, id] of Object.entries(fieldIds)) {
    const input = document.getElementById(id);
    if (!input.reportValidity()) return;
    degreeInfo[field] = input.value;
  }

  if (Number(degreeInfo.required) < 1) {
    saveMessage.textContent = "Enter at least 1 required credit before saving.";
    return;
  }

  saveMessage.textContent = saveData(degreeKey, degreeInfo)
    ? "Degree information saved in this browser!"
    : "Your information could not be saved in this browser.";
});

function setUpCourseList(group) {
  const nameInput = document.getElementById(group + "-course-name");
  const creditsInput = document.getElementById(group + "-course-credits");
  const form = nameInput.closest("form");
  const button = form.querySelector("button");
  const list = document.getElementById(group + "-course-list");
  const summary = document.getElementById(group + "-summary");
  const key = "dukeTrackCourses-" + group;
  const savedCourses = readSaved(key, []);
  const courses = Array.isArray(savedCourses) ? savedCourses : [];

  summary.setAttribute("role", "status");

  function updateSummary() {
    const completed = courses.filter(course => course.completed).length;
    summary.textContent = courses.length
      ? completed + " of " + courses.length + " courses completed."
      : "No courses added yet. Expand the form below to add your first course.";
  }

  function saveCourses() {
    updateSummary();
    if (!saveData(key, courses)) {
      summary.textContent += " Changes could not be saved in this browser.";
    }
  }

  function showCourse(course, index) {
    const item = document.createElement("li");
    item.className = "form-check mb-2";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "form-check-input";
    checkbox.id = group + "-added-course-" + index;
    checkbox.checked = course.completed;

    const label = document.createElement("label");
    label.className = "form-check-label";
    label.htmlFor = checkbox.id;
    label.textContent = course.name + " — " + course.credits +
      (course.credits === 1 ? " credit" : " credits");
    label.style.textDecoration = checkbox.checked ? "line-through" : "";

    checkbox.addEventListener("change", function () {
      course.completed = checkbox.checked;
      label.style.textDecoration = checkbox.checked ? "line-through" : "";
      saveCourses();
    });

 const removeButton = document.createElement("button");
removeButton.type = "button";
removeButton.className = "course-remove";
removeButton.setAttribute("aria-label", "Remove " + course.name);
removeButton.innerHTML = `
  <svg width="14" height="14" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" stroke-width="1.75"
       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>
  </svg>
`;

removeButton.addEventListener("click", function () {
  courses.splice(index, 1);
  list.replaceChildren();
  courses.forEach(showCourse);
  saveCourses();
});

const courseLine = document.createElement("div");
courseLine.className = "d-flex align-items-center gap-2";
courseLine.append(label, removeButton);
item.append(checkbox, courseLine);
list.append(item);

}

  courses.forEach(showCourse);
  updateSummary();

  function addCourse(event) {
    event.preventDefault();
    const name = nameInput.value.trim();
    const credits = Number(creditsInput.value);
    if (!name || !Number.isInteger(credits) || credits < 1) {
      summary.textContent = "Enter a course name and at least 1 whole credit.";
      (!name ? nameInput : creditsInput).focus();
      return;
    }

    const course = { name, credits, completed: false };
    courses.push(course);
    showCourse(course, courses.length - 1);
    saveCourses();
    form.reset();
    nameInput.focus();
  }

  button.addEventListener("click", addCourse);
  form.addEventListener("submit", addCourse);
}

setUpCourseList("major");
setUpCourseList("minor");

// Save the existing checkbox IDs so the CSS completion styles return on refresh.
const genEdKey = "dukeTrackGenEd";
const savedChecks = readSaved(genEdKey, {});
const genEdChecks = document.querySelectorAll('#gen-ed input[type="checkbox"]');
const genEdMessage = document.createElement("p");
genEdMessage.className = "small";
genEdMessage.setAttribute("role", "status");
document.getElementById("genEdAccordion").before(genEdMessage);

for (const checkbox of genEdChecks) {
  checkbox.checked = savedChecks[checkbox.id] === true;
  checkbox.addEventListener("change", function () {
    const checkedStates = {};
    for (const input of genEdChecks) {
      checkedStates[input.id] = input.checked;
    }
    genEdMessage.textContent = saveData(genEdKey, checkedStates)
      ? ""
      : "General Education changes could not be saved in this browser.";
  });
}
