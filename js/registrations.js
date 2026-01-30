import { db, collection, addDoc, getDocs, query, where, orderBy, getDoc, doc, handleFirebaseError } from "./firebase-config.js";
import { loadInvoices } from "./invoice.js";

// DOM Elements
const regStudentSelect = document.getElementById("reg-student-select");
const regEventSelect = document.getElementById("reg-event-select");
const regSegmentsContainer = document.getElementById("reg-segments-container");
const regSegmentsList = document.getElementById("reg-segments-list");
const regTotalAmountEl = document.getElementById("reg-total-amount");
const registrationForm = document.getElementById("registration-form");

// Initialize
export function initRegistrations() {
    if (registrationForm) {
        registrationForm.addEventListener("submit", handleRegistration);
    }
    
    if (regEventSelect) {
        regEventSelect.addEventListener("change", handleEventChange);
    }

    loadStudentSelect();
}

// Load Students into Dropdown
export async function loadStudentSelect() {
    if (!regStudentSelect) return;

    try {
        const q = query(collection(db, "students"), orderBy("name"));
        const querySnapshot = await getDocs(q);
        
        // Keep first option
        const firstOption = regStudentSelect.options[0];
        regStudentSelect.innerHTML = "";
        regStudentSelect.appendChild(firstOption);

        querySnapshot.forEach(doc => {
            const student = doc.data();
            const option = document.createElement("option");
            option.value = doc.id;
            option.textContent = `${student.name} (${student.class}-${student.section})`;
            regStudentSelect.appendChild(option);
        });

    } catch (error) {
        console.error("Error loading students for registration: ", error);
    }
}

// Handle Event Selection - Load Segments
async function handleEventChange() {
    const eventId = regEventSelect.value;
    
    if (!eventId) {
        regSegmentsContainer.classList.add("hidden");
        return;
    }

    regSegmentsContainer.classList.remove("hidden");
    regSegmentsList.innerHTML = "Loading segments...";
    regTotalAmountEl.textContent = "0.00";

    try {
        const q = query(collection(db, "segments"), where("eventId", "==", eventId));
        const querySnapshot = await getDocs(q);

        regSegmentsList.innerHTML = "";
        
        if (querySnapshot.empty) {
            regSegmentsList.innerHTML = "No segments available for this event.";
            return;
        }

        querySnapshot.forEach(doc => {
            const segment = doc.data();
            const div = document.createElement("div");
            div.className = "form-group";
            div.innerHTML = `
                <label>
                    <input type="checkbox" class="segment-checkbox" 
                        value="${doc.id}" 
                        data-fee="${segment.fee}"
                        data-name="${segment.segmentName}">
                    ${segment.segmentName} - $${segment.fee.toFixed(2)}
                </label>
            `;
            regSegmentsList.appendChild(div);
        });

        // Add listeners to checkboxes for live total calculation
        const checkboxes = document.querySelectorAll(".segment-checkbox");
        checkboxes.forEach(cb => {
            cb.addEventListener("change", calculateTotal);
        });

    } catch (error) {
        handleFirebaseError(error, "Loading Segments for Registration");
        regSegmentsList.innerHTML = "Error loading segments.";
    }
}

// Calculate Total
function calculateTotal() {
    const checkboxes = document.querySelectorAll(".segment-checkbox:checked");
    let total = 0;
    checkboxes.forEach(cb => {
        total += parseFloat(cb.dataset.fee);
    });
    regTotalAmountEl.textContent = total.toFixed(2);
    return total;
}

// Handle Registration Submission
async function handleRegistration(e) {
    e.preventDefault();

    const studentId = regStudentSelect.value;
    const eventId = regEventSelect.value;
    const totalAmount = calculateTotal();
    
    if (!studentId || !eventId) {
        alert("Please select student and event.");
        return;
    }

    const selectedSegments = [];
    document.querySelectorAll(".segment-checkbox:checked").forEach(cb => {
        selectedSegments.push({
            segmentId: cb.value,
            segmentName: cb.dataset.name,
            fee: parseFloat(cb.dataset.fee)
        });
    });

    if (selectedSegments.length === 0) {
        if (!confirm("No segments selected. Continue with $0 amount?")) {
            return;
        }
    }

    // Generate Invoice Number (Simple Timestamp based or Random)
    const invoiceNo = "INV-" + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100);

    try {
        // 1. Create Registration
        const regRef = await addDoc(collection(db, "registrations"), {
            studentId,
            eventId,
            totalAmount,
            paymentStatus: "Pending", // Default
            invoiceNo,
            createdAt: new Date()
        });

        // 2. Add Registration Segments
        const batchPromises = selectedSegments.map(seg => {
            return addDoc(collection(db, "registration_segments"), {
                registrationId: regRef.id,
                ...seg
            });
        });
        await Promise.all(batchPromises);

        alert(`Registration successful! Invoice #${invoiceNo} generated.`);
        
        // Reset form
        registrationForm.reset();
        regSegmentsContainer.classList.add("hidden");
        regTotalAmountEl.textContent = "0.00";

        // Refresh Invoices List
        loadInvoices();

    } catch (error) {
        handleFirebaseError(error, "Registration Failed");
    }
}
