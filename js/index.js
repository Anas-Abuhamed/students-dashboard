const popup = document.getElementById("student-popup");
const overlay = document.querySelector(".overlay");
const searchInput = document.getElementById("search-input");
const popupForm = document.querySelector(".popup-form")
const form = popupForm.querySelector("form");
const cancelBtn = document.getElementById("cancel-student");
const addStudentBtn = document.getElementById("open-popup");
let students = getStudentsFromLocalStorage();
// global btns
let editBtns;
let deleteBtns;
// global edit informations
let isEditing = false;
let editIndex = null;
let updatingElement;
// Sort and filter elements by, variables:
let sortValue = document.querySelector(".sort-input .select-list");
let currentSort = sortValue.value;
const gpaConditionSelect = document.querySelector(".filter-input .select-list");
const gpaThresholdInput = document.querySelector(".gpa-threshold");
const resetBtn = document.querySelector(".reset-button")

let gpaChartV;


// display students for 1st time base on sort value
applyCurrentSortAndFilterThenDisplay()
// Open add student popup
function showPopup() {
    popup.classList.remove("hidden");
    overlay.classList.remove("hidden");
    document.getElementById("student-name").focus();
}

function hidePopup() {
    popup.classList.add("hidden");
    overlay.classList.add("hidden");
    form.reset();
    isEditing = false;
    editIndex = null;
}
popupForm.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
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
        showConfirmPopup("Are you sure want to edit this student's information ?", (confirm) => {
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
    const tableBody = document.querySelector("tbody");
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
            showConfirmPopup("Are you sure want to delete this student ?", (confirm) => deleteStudent(e, confirm))
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
    document.querySelector(".students-number span").textContent = total;
    document.querySelector(".avg-gpa span").textContent = avgGPA;
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
}

// Get and set students in local storage

function getStudentsFromLocalStorage() {
    const students = localStorage.getItem("students");
    return students ? JSON.parse(students) : [];
}
function saveStudentsToLocalStorage() {
    localStorage.setItem("students", JSON.stringify(students));
}

// confirmation popup
function showConfirmPopup(message, callback) {
    // popup for add & delete confirmation
    const popup = document.querySelector(".confirm-popup");
    popup.innerHTML = `
    <div class="confirm-popup-overlay">
        <div class="confirm-popup-content">
        <p>${message}</p>
        <button class="cancel btn">Cancel</button>
        <button class="confirm btn">Confirm</button>
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
sortValue.addEventListener("change", (e) => {
    currentSort = sortValue.value;
    applyCurrentSortAndFilterThenDisplay()
})
gpaThresholdInput.addEventListener("input", applyCurrentSortAndFilterThenDisplay);
gpaConditionSelect.addEventListener("change", applyCurrentSortAndFilterThenDisplay);
function applyCurrentSortAndFilterThenDisplay() {
    let filtered = [...students];
    const condition = gpaConditionSelect.value;
    const threshold = parseFloat(gpaThresholdInput.value);
    if (condition === "all") {
        gpaThresholdInput.disabled = true;
        gpaThresholdInput.value = ""
    }
    else {
        gpaThresholdInput.disabled = false
    }
    if (!isNaN(threshold)) {
        if (condition === "above") {
            filtered = filtered.filter(student => student.gpa > threshold);
        } else if (condition === "below") {
            filtered = filtered.filter(student => student.gpa < threshold);
        }
    }
    if (currentSort === "name") {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (currentSort === "gpa") {
        filtered.sort((a, b) => b.gpa - a.gpa);
    }

    displayStudents(filtered);
}
resetBtn.addEventListener("click", (e) => {
    resetFilters();
})
function resetFilters() {
    sortValue.value = "default";
    gpaConditionSelect.value = "all";
    gpaThresholdInput.value = "";
    gpaThresholdInput.disabled = true;
    currentSort = "default";
    applyCurrentSortAndFilterThenDisplay();
}


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

function getGPA(students) {
    const counters = [0, 0, 0, 0]
    students.forEach((student) => {
        if (student.gpa >= 0 && student.gpa < 1) counters[0]++;
        else if (student.gpa >= 1 && student.gpa < 2) counters[1]++;
        else if (student.gpa >= 2 && student.gpa < 3) counters[2]++;
        else if (student.gpa >= 3 && student.gpa <= 4) counters[3]++;
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
                label: "gpa degree",
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
                    beginAtZero: true
                }
            }
        }
    })
}


