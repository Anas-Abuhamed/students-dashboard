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
// display students for 1st time
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
                displayStudents();
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
        displayStudents();
        hidePopup();
    }

});

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
