// En & ar, (valid en & ar)
// global btns
// global edit informations
// Sort and filter elements by, variables:
document.addEventListener('DOMContentLoaded', async function () {
    loadLanguagePreference();
    setupLanguageToggle();
    await init();
});
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

//
const translations = {
    ar: {
        title: "لوحة تحكم الطلاب",
        header: "لوحة تحكم الطلاب",
        arabic: "العربية",
        english: "الإنجليزية",
        search_placeholder: "ابحث عن طالب...",
        add_student_btn: "إضافة طالب",
        gpa_filter: "تصفية المعدل:",
        all: "الكل",
        above: "أعلى من",
        below: "أقل من",
        gpa_threshold_placeholder: "حد المعدل",
        export_json: "تصدير JSON",
        reset_filters: "إعادة التصفية",
        add_student_header: "إضافة طالب جديد",
        name_placeholder: "الاسم",
        gpa_placeholder: "المعدل",
        major_placeholder: "التخصص",
        cancel_btn: "إلغاء",
        save_btn: "حفظ",
        name_header: "الاسم",
        gpa_header: "المعدل",
        major_header: "التخصص",
        actions_header: "الإجراءات",
        statistics: "إحصائيات",
        number_of_students: "عدد الطلاب:",
        avg_gpa: "متوسط المعدل:",
        count_per_major: "عدد الطلاب لكل تخصص:"
    },
    en: {
        title: "Students Dashboard",
        header: "Students Dashboard",
        arabic: "Arabic",
        english: "English",
        search_placeholder: "Search Student...",
        add_student_btn: "Add Student",
        gpa_filter: "GPA Filter:",
        all: "All",
        above: "Above",
        below: "Below",
        gpa_threshold_placeholder: "GPA Threshold",
        export_json: "Export to JSON",
        reset_filters: "Reset Filters",
        add_student_header: "Add New Student",
        name_placeholder: "Name",
        gpa_placeholder: "GPA",
        major_placeholder: "Major",
        cancel_btn: "Cancel",
        save_btn: "Save",
        name_header: "Name",
        gpa_header: "GPA",
        major_header: "Major",
        actions_header: "Actions",
        statistics: "Statistics",
        number_of_students: "Number of Students:",
        avg_gpa: "Average GPA:",
        count_per_major: "Count Per Major:"
    }
};

async function changeLanguage(lang) {
    currentLanguage = lang;
    // Update all translatable elements
    document.querySelectorAll("[data-translate]").forEach((el) => {
        const key = el.dataset.translate;
        if (translations[lang] && translations[lang][key]) {
            el.innerHTML = translations[lang][key];
        }
    });

    // Update placeholders
    document.querySelectorAll("input[data-translate]").forEach((el) => {
        const key = el.dataset.translate;
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
    localStorage.setItem('preferredLanguage', lang);
    students = await getStudentsFromLocalStorage()
    applyCurrentSortAndFilterThenDisplay();
    resetFilters()

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
function loadLanguagePreference() {
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && translations[savedLang]) {
        currentLanguage = savedLang;
        document.getElementById(savedLang).checked = true;
        document.getElementById(savedLang === 'ar' ? 'en' : 'ar').checked = false;
        changeLanguage(currentLanguage);
    }
    else {
        localStorage.setItem("preferredLanguage", "en");
        document.getElementById("en").checked = true
        currentLanguage = "en";
        changeLanguage(currentLanguage);
    }
}

// Fixed event listeners for language toggles
function setupLanguageToggle() {
    const arCheckbox = document.getElementById("ar");
    const enCheckbox = document.getElementById("en");

    arCheckbox.addEventListener("change", function () {
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
addStudentBtn.addEventListener("click", showPopup);

// Search functionality
searchInput.addEventListener("input", () => {
    search();
});
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

function checkInputs() {
    let allFilled = true;
    let englishLettersPattern = /^[A-Za-z\s]+$/
    let arabicLettersPattern = /^[\u0600-\u06FF\s]+$/

    formInputs.forEach(input => {
        let value = input.value.trim();
        if (value === "") {
            allFilled = false;
        }
        if (input.getAttribute("id") == "student-gpa") {
            if (isNaN(input.value) || parseFloat(input.value) < 0 || parseFloat(input.value) > 4)
                allFilled = false;
        }
        else if (currentLanguage == "en" && !englishLettersPattern.test(value)) {
            allFilled = false;
        }
        else if (currentLanguage == "ar" && !arabicLettersPattern.test(value)) {
            allFilled = false;
        }

    });

    addSaveBtn.disabled = !allFilled;
}

formInputs.forEach(input => {
    input.addEventListener("input", checkInputs);
});

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("student-name").value.trim();
    const gpa = parseFloat(document.getElementById("student-gpa").value.trim());
    const major = document.getElementById("student-major").value.trim();
    const isUpdatedNameExist = students.findIndex(
        (student) => student.name === name
    );
    if (isUpdatedNameExist != -1 && isUpdatedNameExist != editIndex) {
        alert("name already exist !");
        return;
    }
    if (isNaN(gpa) || gpa < 0 || gpa > 4) {
        alert("Please enter a valid GPA between 0 and 4.");
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
        showConfirmPopup(currentLanguage == "en" ? "Are you sure want to edit this student ?" : "هل أنت متأكد أنك تريد تعديل هذا الطالب", (confirm) => {
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
            alert("Name already exists!");
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
    tableBody.innerHTML = "";
    students.forEach((student) => {
        const row = document.createElement("tr");
        row.classList.add("row");
        row.setAttribute("data-id", student.id);
        row.innerHTML = `
            <td class="name">${student.name}</td>
            <td class="gpa">${student.gpa.toFixed(2)}</td>
            <td class="major">${student.major}</td>
            <td class="actions">
                <button class="edit"><i class="fas fa-edit"></i></button>
                <button class="delete"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
        // Add event listeners for delete button
        const deleteBtn = row.querySelector(".delete");
        // deleteBtn.addEventListener("click", deleteStudent);
        deleteBtn.addEventListener("click", (e) => {
            showConfirmPopup(currentLanguage == "en" ? "Are you sure want to delete this student ?" : "هل أنت متأكد أنك تريد حذف هذا الطالب", (confirm) => deleteStudent(e, confirm))
        }
        );
        // Add event listeners for edit button
        const editBtn = row.querySelector(".edit");
        editBtn.addEventListener("click", editStudent);
    });
    showStatistics();
    gpaChart(students);
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
    document.querySelector(".major-count").innerHTML = ""
    for (const major in majorCount) {
        document.querySelector(".major-count").innerHTML += `<p>${major} : ${majorCount[major]}</p>`
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
    let students = await setJSONFile(`students-${currentLanguage}`, `students-${currentLanguage}.json`)
    return await JSON.parse(students)
}
function saveStudentsToLocalStorage() {
    localStorage.setItem(`students-${currentLanguage}`, JSON.stringify(students));
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
function showConfirmPopup(message, callback) {
    overlay.classList.remove("hidden")
    // popup for add & delete confirmation
    const popup = document.querySelector(".confirm-popup");
    popup.innerHTML = `
    <div class="confirm-popup-overlay">
        <div class="confirm-popup-content">
        <p>${message}</p>
        <button class="cancel btn">${currentLanguage == "en" ? "Cancel" : "إلغاء"}</button>
        <button class="confirm btn">${currentLanguage == "en" ? "Confirm" : "تأكيد"}</button>
    </div>
    </div>
    `;
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
}
)
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
                label: currentLanguage === "en" ? "GPA degree" : "درجة المعدل",
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
            }
        }
    })
}









