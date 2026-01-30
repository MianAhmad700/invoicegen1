import { db, collection, addDoc, getDocs, orderBy, query, handleFirebaseError } from "./firebase-config.js";

// DOM Elements
const addStudentForm = document.getElementById("add-student-form");
const studentsTableBody = document.getElementById("students-table-body");
const totalStudentsEl = document.getElementById("total-students");

// Initialize
export function initStudents() {
    if (addStudentForm) {
        addStudentForm.addEventListener("submit", handleAddStudent);
    }
    loadStudents();
}

// Add Student
async function handleAddStudent(e) {
    e.preventDefault();
    
    const name = document.getElementById("student-name").value;
    const studentClass = document.getElementById("student-class").value;
    const section = document.getElementById("student-section").value;
    const rollNo = document.getElementById("student-roll").value;

    try {
        await addDoc(collection(db, "students"), {
            name,
            class: studentClass,
            section,
            rollNo,
            createdAt: new Date()
        });
        
        alert("Student added successfully!");
        addStudentForm.reset();
        loadStudents(); // Refresh list
    } catch (error) {
        handleFirebaseError(error, "Adding Student");
    }
}

// Load Students
export async function loadStudents() {
    if (!studentsTableBody) return;

    studentsTableBody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
    
    try {
        const q = query(collection(db, "students"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        studentsTableBody.innerHTML = "";
        
        let count = 0;
        querySnapshot.forEach((doc) => {
            const student = doc.data();
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${student.name}</td>
                <td>${student.class}</td>
                <td>${student.section}</td>
                <td>${student.rollNo}</td>
            `;
            studentsTableBody.appendChild(row);
            count++;
        });

        if (totalStudentsEl) {
            totalStudentsEl.textContent = count;
        }

        if (count === 0) {
            studentsTableBody.innerHTML = '<tr><td colspan="4">No students found.</td></tr>';
        }

    } catch (error) {
        handleFirebaseError(error, "Loading Students");
        studentsTableBody.innerHTML = '<tr><td colspan="4">Error loading data.</td></tr>';
    }
}
