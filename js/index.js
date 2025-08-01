const popup = document.getElementById("student-popup");
const overlay = document.querySelector(".overlay");
const searchInput = document.getElementById("search-input");
const form = document.querySelector(".popup-form form");
const cancelBtn = document.getElementById("cancel-student");
const addStudentBtn = document.getElementById("open-popup");
let students = getStudentsFromLocalStorage();
let editBtns;
let deleteBtns;
let isEditing = false;
let editIndex = null;
displayStudents();
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
    editIndex = null
}

cancelBtn.addEventListener("click", hidePopup);
overlay.addEventListener("click", hidePopup);
addStudentBtn.addEventListener("click", showPopup);

// Search functionality
searchInput.addEventListener(("input"), () => {
    search();
})
function search() {
    const studentsName = document.querySelectorAll("tbody tr td.name");
    studentsName.forEach((name) => {
        name.parentElement.style.display = name.textContent.toLowerCase().includes(searchInput.value.trim().toLowerCase()) ? "" : "none"
    });
}

// Add student functionality
form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("student-name").value.trim();
    const gpa = parseFloat(document.getElementById("student-gpa").value.trim());
    const major = document.getElementById("student-major").value.trim();
    const isUpdatedNameExist = students.findIndex(student => student.name === name)
    if (isUpdatedNameExist != -1 && isUpdatedNameExist != editIndex) {
        alert("name already exist !")
        return;
    }
    if (isNaN(gpa) || gpa < 0 || gpa > 4) {
        alert("Please enter a valid GPA between 0 and 4.");
        return;
    }
    if (isEditing) {
        const editedStudent = {
            ...students[editIndex],
            name,
            gpa,
            major
        }
        students[editIndex] = editedStudent;
    }
    else {
        const isNameExist = students.findIndex(student => student.name === name);
        if (isNameExist !== -1) {
            alert("Name already exists!");
            return;
        }

        const newStudent = {
            id: Date.now(),
            name,
            gpa,
            major
        };
        students.push(newStudent);
    }
    saveStudentsToLocalStorage();
    displayStudents();
    hidePopup();
})
function createStudent(e) {
    e.preventDefault();
    const gpa = parseFloat(document.getElementById("student-gpa").value.trim());
    if (isNaN(gpa) || gpa < 0 || gpa > 4) {
        alert("Please enter a valid GPA between 0 and 4.");
        return;
    }
    const name = document.getElementById("student-name").value.trim();
    const major = document.getElementById("student-major").value.trim();
    const isNameExist = students.findIndex(student => student.name == name);
    if (isNameExist != -1) {
        alert("name already exist !")
        return;
    }
    const newStudent = {
        id: Date.now(),
        name,
        gpa,
        major
    }
    addStudent(newStudent);
}

// Display students in the table
function displayStudents() {
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
        form.reset();
        // Add event listeners for delete button
        const deleteBtn = row.querySelector(".delete");
        deleteBtn.addEventListener("click", deleteStudent);
        // Add event listeners for edit button
        const editBtn = row.querySelector(".edit");
        editBtn.addEventListener("click", editStudent);
    });
}

// Edit student information functionality
function editStudent(e) {
    const row = e.target.closest("tr");
    const id = row.getAttribute("data-id");
    const studentIndex = students.findIndex(student => student.id == id)
    const student = students[studentIndex];

    document.getElementById("student-name").value = student.name;
    document.getElementById("student-gpa").value = student.gpa.toFixed(2);
    document.getElementById("student-major").value = student.major;
    isEditing = true;
    editIndex = studentIndex
    showPopup();
}

// Delete student functionality
function deleteStudent(e) {
    const row = e.target.closest("tr");
    const id = row.getAttribute("data-id");
    students = students.filter(student => student.id != id);
    row.remove();
    saveStudentsToLocalStorage();
    displayStudents();
}




// Get and set students in local storage

function getStudentsFromLocalStorage() {
    const students = localStorage.getItem("students");
    return students ? JSON.parse(students) : [];
}
function saveStudentsToLocalStorage() {
    localStorage.setItem("students", JSON.stringify(students));
}