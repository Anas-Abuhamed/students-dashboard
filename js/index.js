// React basics, react state events, react components, react hooks
// global btns
// global edit informations
// Sort and filter elements by, variables:
// i18n
// Add event listeners for language toggles
// Cookie
document.addEventListener('DOMContentLoaded', async function () {
    await main();
    await loadLanguagePreference();
    setupLanguageToggle();
    await init();
});
if (window.location.pathname === "/" || window.location.pathname === "") {
    location.replace("/pages/index.html");
}
const popup = document.getElementById("student-popup");
const overlay = document.querySelector(".overlay");
const searchInput = document.getElementById("search-input");
const popupForm = document.querySelector(".popup-form")
const form = popupForm.querySelector("form");
const formInputs = popupForm.querySelectorAll("form input");
const cancelBtn = document.getElementById("cancel-student");
const addStudentBtn = document.getElementById("open-popup");
const addSaveBtn = document.querySelector("#save-student");
const tableBody = document.querySelector("tbody");
let sortIcons = document.querySelectorAll(".container table th i");
const gpaConditionSelect = document.querySelector(".filter-input .select-list");
const gpaThresholdInput = document.querySelector(".gpa-threshold");
const resetBtn = document.querySelector(".reset-button")
const JSONExportBtn = document.querySelector(".to-json-button");
const sortValues = Object.freeze({
    DEFAULT: "default",
    NAME: "name",
    GPA: "gpa",
    MAJOR: "major"
})

const filterValues = Object.freeze({
    ALL: "all",
    ABOVE: "above",
    BELOW: "below"
})
let nameAscending = true;
let gpaAscending = true;
let majorAscending = true;
let students;
let deleteBtns;
let editBtns;
let isEditing = false;
let editIndex = null;
let updatingElement;
let currentSort = sortValues.DEFAULT;
let gpaChartV;
let currentLanguage = 'en';
// // converted to JSON
let translations;
async function main() {
    translations = await getTranslations();
}

function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

async function getTranslations() {
    try {
        const [enRes, arRes] = await Promise.all([
            fetch('../locales/translations-en.json'),
            fetch('../locales/translations-ar.json')
        ]);

        if (!enRes.ok || !arRes.ok) {
            throw new Error("Failed to load translations");
        }

        const [enJson, arJson] = await Promise.all([
            enRes.json(),
            arRes.json()
        ]);

        return { en: enJson.en, ar: arJson.ar };
    } catch (error) {
        console.error("Error fetching translations:", error);
        return {};
    }
}

async function changeLanguage(lang) {
    currentLanguage = lang;
    // Update all translatable elements
    document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.dataset.i18n;
        if (translations[lang] && translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });

    // Update placeholders
    document.querySelectorAll("input[data-i18n]").forEach((el) => {
        const key = el.dataset.i18n;
        if (translations[lang] && translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });

    // Update page title
    if (translations[lang].title) {
        document.title = translations[lang].title;
    }

    // Update page direction
    updatePageDirection();

    // Save language preference
    document.cookie = `preferredLanguage=${lang}; path=/; max-age=3600`; // 1 hour expiration
    currentLanguage = getCookie("preferredLanguage") || "en";
    students = await getStudentsFromLocalStorage()
    applyCurrentSortAndFilterThenDisplay();
    resetFilters();
}

function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

// Update page direction for RTL/LTR support
function updatePageDirection() {
    const body = document.body;
    const html = document.documentElement;

    if (currentLanguage === 'ar') {
        html.setAttribute('dir', 'rtl');
        html.setAttribute('lang', 'ar');
        body.style.textAlign = 'right';
    } else {
        html.setAttribute('dir', 'ltr');
        html.setAttribute('lang', 'en');
        body.style.textAlign = 'left';
    }
}

// Load saved language preference
async function loadLanguagePreference() {
    const savedLang = getCookie("preferredLanguage");
    const otherLang = savedLang === 'ar' ? 'en' : 'ar';
    if (savedLang && translations[savedLang]) {
        currentLanguage = savedLang;
        document.getElementById(savedLang === 'ar' ? 'en' : 'ar').checked = false;
        document.getElementById(savedLang === 'ar' ? 'ar' : 'en').checked = true;
    }
    else {
        document.getElementById("en").checked = true
        currentLanguage = "en";
    }
    await changeLanguage(currentLanguage);
}

// Fixed event listeners for language toggles
function setupLanguageToggle() {
    const arCheckbox = document.getElementById("ar");
    const enCheckbox = document.getElementById("en");
    currentLanguage == "ar" ? arCheckbox.previousElementSibling.style.display = 'none' : enCheckbox.previousElementSibling.style.display = 'none';
    currentLanguage == "ar" ? arCheckbox.style.display = 'none' : enCheckbox.style.display = 'none';

    arCheckbox.addEventListener("change", function () {
        this.previousElementSibling.style.display = 'none';
        this.style.display = 'none';
        enCheckbox.previousElementSibling.style.display = 'inline-block';
        enCheckbox.style.display = 'inline-block';
        if (this.checked) {
            enCheckbox.checked = false;
            changeLanguage("ar");
        } else {
            // If unchecked and English is not checked, default to English
            if (!enCheckbox.checked) {
                enCheckbox.checked = true;
                changeLanguage("en");
            }
        }
    });

    enCheckbox.addEventListener("change", function () {
        this.previousElementSibling.style.display = 'none';
        this.style.display = 'none';
        arCheckbox.previousElementSibling.style.display = 'inline-block';
        arCheckbox.style.display = 'inline-block';
        if (this.checked) {
            arCheckbox.checked = false;
            changeLanguage("en");
        } else {
            // If unchecked and Arabic is not checked, default to English
            if (!arCheckbox.checked) {
                this.checked = true;
                changeLanguage("en");
            }
        }
    });
}

// display students for 1st time base on sort value
async function init() {
    students = await getStudentsFromLocalStorage();
    applyCurrentSortAndFilterThenDisplay();
}
// Open add student popup
function showPopup() {
    popup.classList.remove("hidden");
    overlay.classList.remove("hidden");
    document.getElementById("student-name").focus();
    checkInputs();
}

function hidePopup() {
    popup.classList.add("hidden");
    overlay.classList.add("hidden");
    popupForm.classList.add("hidden")
    form.reset();
    isEditing = false;
    editIndex = null;
}
popupForm.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && checkInputs()) {
        form.requestSubmit();
    } else if (e.key === "Escape") {
        hidePopup();
    }
})
cancelBtn.addEventListener("click", hidePopup);
overlay.addEventListener("click", hidePopup);
addStudentBtn.addEventListener("click", () => {
    showPopup();
    const popupTitle = document.querySelector(".popup-title");
    popupTitle.textContent = translations[currentLanguage]["add_student_header"];
}
);

// Search functionality
searchInput.addEventListener("input", debounce(() => {
    search();
}, 300));
function search() {
    const studentsName = document.querySelectorAll("tbody tr td.name");
    studentsName.forEach((name) => {
        name.parentElement.style.display = name.textContent
            .toLowerCase()
            .includes(searchInput.value.trim().toLowerCase())
            ? ""
            : "none";
    });
}

// Add student functionality

function isValidName(value) {
    return currentLanguage === "en"
        ? /^[A-Za-z0-9\s]+$/.test(value)
        : /^[\u0600-\u06FF0-9\s]+$/.test(value);
}

function checkInputs(changedInput) {
    let allFilled = true;
    if (changedInput) {

        const value = changedInput.value.trim();
        if (changedInput.getAttribute("id") === "student-gpa") {
            if (!isValidGPA(value)) {
                showToast(translations[currentLanguage]["gpa_validation_error"]);
                changedInput.value = value.slice(0, -1);
            }
            else {
                addSaveBtn.disabled = true;
            }
        } else {
            // Name and Major validation
            if (currentLanguage === "en" && !isValidName(changedInput.value)) {
                changedInput.value = changedInput.value.split('').filter((char) => isValidName(char)).join(''); // Remove last character if invalid
                showToast(translations[currentLanguage]["text_validation_error"]);
            } else if (currentLanguage === "ar" && !isValidName(changedInput.value)) {
                changedInput.value = changedInput.value.split('').filter((char) => isValidName(char)).join('');
                showToast(translations[currentLanguage]["text_validation_error"]);
            }
            else {
                addSaveBtn.disabled = true;
            }
        }
    }
    formInputs.forEach(input => {
        let value = input.value.trim();
        if (value === "") {
            allFilled = false;
        }
        if (input.getAttribute("id") == "student-gpa") {
            if (isNaN(input.value) || parseFloat(input.value) < 0 || parseFloat(input.value) > 4)
                allFilled = false;
        }
        else if (currentLanguage == "en" && !isValidName(value)) {
            allFilled = false;
        }
        else if (currentLanguage == "ar" && !isValidName(value)) {
            allFilled = false;
        }
    });

    addSaveBtn.disabled = !allFilled;
}

formInputs.forEach(inputs => {
    inputs.addEventListener("input", (e) => {
        checkInputs(e.target)
    }
    );
});
function showToast(message, duration = 1500) {
    const toast = document.querySelector('.toast');
    toast.textContent = message;
    toast.classList.add('show');
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hidden');
    }, duration);
}
function isValidGPA(gpa) {
    return !isNaN(gpa) && gpa >= 0 && gpa <= 4;
}

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("student-name").value.trim();
    const gpa = parseFloat(document.getElementById("student-gpa").value.trim());
    const major = document.getElementById("student-major").value.trim();
    const isUpdatedNameExist = students.findIndex(
        (student) => student.name === name
    );
    if (isUpdatedNameExist != -1 && isUpdatedNameExist != editIndex) {
        showToast(translations[currentLanguage]["name_exists"]);
        return;
    }
    if (!isValidGPA(gpa)) {
        showToast(translations[currentLanguage]["gpa_validation_error"]);
        return;
    }
    if (isEditing) {
        const indexToEdit = editIndex;
        hidePopup();
        const editedStudent = {
            ...students[indexToEdit],
            name,
            gpa,
            major,
        };
        showConfirmPopup(translations[currentLanguage]["confirmation_edit"], (confirm) => {
            if (confirm) {
                students[indexToEdit] = editedStudent;
                saveStudentsToLocalStorage();
                applyCurrentSortAndFilterThenDisplay()
                updatingElement = null
            }
            else {
                editStudent(updatingElement)
            }
        })

    } else {
        const isNameExist = students.findIndex((student) => student.name === name);
        if (isNameExist !== -1) {
            showToast(translations[currentLanguage]["name_exists"]);
            return;
        }

        const newStudent = {
            id: Date.now(),
            name,
            gpa,
            major,
        };
        students.push(newStudent);
        saveStudentsToLocalStorage();
        applyCurrentSortAndFilterThenDisplay()
        hidePopup();
    }

});

// Display students in the table
function displayStudents(students) {
    tableBody.textContent = "";
    const fragment = document.createDocumentFragment();

    students.forEach((student) => {
        const row = createStudentRecord(student);
        fragment.append(row);
        // Add event listeners for delete button
        const deleteBtn = row.querySelector(".delete");
        deleteBtn.addEventListener("click", (e) => {
            showConfirmPopup(translations[currentLanguage]["confirmation_delete"], (confirm) => deleteStudent(e, confirm))
        });
        // Add event listeners for edit button
        const editBtn = row.querySelector(".edit");
        editBtn.addEventListener("click", editStudent);
    });
    tableBody.appendChild(fragment);
    showStatistics();
    gpaChart(students);
}

function createStudentRecord(student) {
    const row = document.createElement("tr");
    row.classList.add("row");
    row.setAttribute("data-id", student.id);
    const keys = ["name", "gpa", "major"];
    keys.forEach(key => {
        const cell = document.createElement("td");
        cell.classList.add(key)
        if (key === "gpa") {
            cell.textContent = student[key].toFixed(2);
        }
        else {
            cell.textContent = student[key];
        }
        row.append(cell);
    })
    const actionsCell = document.createElement("td");
    actionsCell.classList.add("actions");
    const editBtn = document.createElement("button");
    editBtn.classList.add("edit");
    let i = document.createElement("i");
    i.classList.add("fas", "fa-edit");
    editBtn.appendChild(i);
    i = document.createElement("i");
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete");
    i.classList.add("fas", "fa-trash-alt");
    deleteBtn.appendChild(i);
    actionsCell.append(editBtn, deleteBtn);
    row.append(actionsCell);
    return row;
}
// show Statistics
function showStatistics() {
    const total = students.length;
    const avgGPA = total === 0 ? 0.00 : (students.reduce((acc, cur) => acc + cur.gpa, 0) / total).toFixed(2);
    const majorCount = {};
    students.forEach(student => {
        majorCount[student.major] = (majorCount[student.major] || 0) + 1;
    })
    document.querySelector(".students-number + span").textContent = total;
    document.querySelector(".avg-gpa + span").textContent = avgGPA;
    document.querySelector(".major-count").textContent = ""
    for (const major in majorCount) {
        const p = document.createElement("p");
        p.textContent = `${major} : ${majorCount[major]}`
        document.querySelector(".major-count").append(p);
    }
}

// Edit student information functionality
function editStudent(e) {
    updatingElement = e;
    const row = e.target.closest("tr");
    const id = row.getAttribute("data-id");
    const studentIndex = students.findIndex((student) => student.id == id);
    const student = students[studentIndex];
    document.getElementById("student-name").value = student.name;
    document.getElementById("student-gpa").value = student.gpa.toFixed(2);
    document.getElementById("student-major").value = student.major;
    isEditing = true;
    editIndex = studentIndex;
    const popupTitle = document.querySelector(".popup-title");
    popupTitle.textContent = translations[currentLanguage]["edit_student_header"];
    showPopup();
}

// Delete student functionality
function deleteStudent(e, confirmed) {
    if (confirmed) {
        const row = e.target.closest("tr");
        const id = row.getAttribute("data-id");
        students = students.filter((student) => student.id != id);
        row.remove();
        saveStudentsToLocalStorage();
        showStatistics()
    }
    else {
        overlay.classList.add("hidden")
    }
}

// Get and set students in local storage
// read from local storage if it's empty
async function getStudentsFromLocalStorage() {
    let students = await setJSONFile(`students-${currentLanguage}`, `../students-data/students-${currentLanguage}.json`)
    return await JSON.parse(students)
}
function saveStudentsToLocalStorage() {
    try {
        localStorage.setItem(`students-${currentLanguage}`, JSON.stringify(students));
    }
    catch (error) {
        console.error("Error saving students to local storage:", error);
        showToast("There was an error saving the data. Please try again.");
    }
}

async function setJSONFile(localStorageItemName, JSONFileName) {
    const students = localStorage.getItem(localStorageItemName);
    let data;
    if (students) {
        return students;
    }
    else {
        const result = await fetch(JSONFileName);
        data = await result.json();
        localStorage.setItem(localStorageItemName, JSON.stringify(data));
    }
    return JSON.stringify(data);
}

// confirmation popup
function createConfirmPopup(message) {
    const overlayDiv = document.createElement("div");
    overlayDiv.classList.add("confirm-popup-overlay");
    const contentDiv = document.createElement("div")
    contentDiv.classList.add("confirm-popup-content");
    const p = document.createElement("p");
    p.textContent = message;
    const cancelConfirmBtn = document.createElement("button");
    cancelConfirmBtn.classList.add("cancel", "btn");
    cancelConfirmBtn.textContent = translations[currentLanguage]["cancel_btn"];
    const addConfirmBtn = document.createElement("button");
    addConfirmBtn.classList.add("confirm", "btn");
    addConfirmBtn.textContent = translations[currentLanguage]["confirm_btn"];
    contentDiv.append(p, cancelConfirmBtn, addConfirmBtn);
    overlayDiv.append(contentDiv);
    return overlayDiv;
}
function showConfirmPopup(message, callback) {
    overlay.classList.remove("hidden")
    // popup for add & delete confirmation
    const popup = document.querySelector(".confirm-popup");
    const createPopup = createConfirmPopup(message);
    popup.textContent = "";
    popup.append(createPopup);
    popup.classList.add("show");

    const cancelBtn = popup.querySelector(".cancel");
    const confirmBtn = popup.querySelector(".confirm");

    function close(result) {
        // To close popup
        popup.classList.remove("show");
        document.removeEventListener("keydown", handleKey);
        callback(result);
        if (result)
            overlay.classList.add("hidden")
    }

    cancelBtn.onclick = () => close(false);
    confirmBtn.onclick = () => close(true);

    function handleKey(e) {
        // for key actions
        if (e.key === "Enter") {
            close(true);
        } else if (e.key === "Escape") {
            close(false);
        }
    }

    document.addEventListener("keydown", handleKey);
}

// Sort functionality
// filter functionality
gpaThresholdInput.addEventListener("input", applyCurrentSortAndFilterThenDisplay);
gpaConditionSelect.addEventListener("change", applyCurrentSortAndFilterThenDisplay);
sortIcons.forEach((sortIcon) => {
    sortIcon.addEventListener("click", (e) => {
        sortIcon.classList.toggle("flipped")
        if (sortIcon.classList.contains(sortValues.NAME)) {
            currentSort = sortValues.NAME;
            nameAscending = !nameAscending
        }
        else if (sortIcon.classList.contains(sortValues.GPA)) {
            currentSort = sortValues.GPA;
            gpaAscending = !gpaAscending
        }
        else if (sortIcon.classList.contains(sortValues.MAJOR)) {
            currentSort = sortValues.MAJOR;
            majorAscending = !majorAscending
        }
        sortIcons.forEach((icon) => {
            if (icon !== sortIcon)
                icon.classList.remove("flipped")
        })
        applyCurrentSortAndFilterThenDisplay();
    })
})
function applyCurrentSortAndFilterThenDisplay() {
    resetBtn.disabled = false;
    let filtered = [...students];
    const condition = gpaConditionSelect.value;
    const threshold = parseFloat(gpaThresholdInput.value);
    if (condition === filterValues.ALL) {
        gpaThresholdInput.disabled = true;
        gpaThresholdInput.value = ""
    }
    else {
        gpaThresholdInput.disabled = false
    }
    if (!isNaN(threshold)) {
        if (condition === filterValues.ABOVE) {
            filtered = filtered.filter(student => student.gpa > threshold);
        } else if (condition === filterValues.BELOW) {
            filtered = filtered.filter(student => student.gpa < threshold);
        }
    }
    if (currentSort === sortValues.NAME) {
        filtered = sortByField(filtered, sortValues.NAME, nameAscending)
    } else if (currentSort === sortValues.GPA) {
        filtered = sortByField(filtered, sortValues.GPA, gpaAscending)
    }
    else if (currentSort === sortValues.MAJOR) {
        filtered = sortByField(filtered, sortValues.MAJOR, majorAscending)
    }

    displayStudents(filtered);
    updateResetBtnState()
}
function sortByField(arr, field, ascending) {
    return arr.sort((a, b) => {
        if (field === sortValues.GPA) return ascending ? a.gpa - b.gpa : b.gpa - a.gpa;
        return ascending
            ? a[field].localeCompare(b[field])
            : b[field].localeCompare(a[field]);
    });
}

// RESET BUTTON AND CHECKER

resetBtn.addEventListener("click", (e) => {
    resetFilters();
})

function resetFilters() {
    currentSort = sortValues.DEFAULT;
    gpaConditionSelect.value = filterValues.ALL;
    gpaThresholdInput.value = "";
    gpaThresholdInput.disabled = true;
    currentSort = sortValues.DEFAULT;
    resetBtn.disabled = true;
    sortIcons.forEach(sortIcon => { sortIcon.classList.remove("flipped") })
    applyCurrentSortAndFilterThenDisplay();
}

function updateResetBtnState() {
    const isSortDefault = currentSort === sortValues.DEFAULT;
    const isFilterDefault = gpaConditionSelect.value === filterValues.ALL && gpaThresholdInput.value.trim() === "";
    resetBtn.disabled = isSortDefault && isFilterDefault;
}

// JSON EXPORT
JSONExportBtn.addEventListener("click", exportToJSON);
function exportToJSON() {
    const dataStr = JSON.stringify(students, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "students.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// CHART

function getGPA(students) {
    const counters = [0, 0, 0, 0]
    students.forEach((student) => {
        let gpa = parseFloat(student.gpa);
        // switch
        switch (true) {
            case gpa < 1:
                counters[0]++;
                break
            case gpa < 2:
                counters[1]++;
                break
            case gpa < 3:
                counters[2]++
                break;
            default:
                counters[3]++
                break;
        }
    })
    return counters;
}

function gpaChart(students) {
    const ctx = document.getElementById("gpa-chart");
    if (gpaChartV) gpaChartV.destroy();
    gpaChartV = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["0-1", "1-2", "2-3", "3-4"],
            datasets: [{
                label: translations[currentLanguage]["chart_btn"],
                data: getGPA(students),
                backgroundColor: ["rgba(255, 99, 132, 0.6)",
                    "rgba(255, 206, 86, 0.6)",
                    "rgba(75, 192, 192, 0.6)",
                    "rgba(54, 162, 235, 0.6)"],
                borderColor: ["rgba(255, 99, 132, 1)",
                    "rgba(255, 206, 86, 1)",
                    "rgba(75, 192, 192, 1)",
                    "rgba(54, 162, 235, 1)"],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                },
                x: {
                    beginAtZero: true,
                }
            },
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            family: 'Arial',
                            size: 16
                        }
                    }
                },
                tooltip: {
                    enabled: true
                }
            },
        }
    })
}