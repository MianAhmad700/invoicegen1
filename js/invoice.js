import { db, collection, getDocs, doc, getDoc, query, orderBy, updateDoc, where, handleFirebaseError } from "./firebase-config.js";

// DOM Elements
const invoicesTableBody = document.getElementById("invoices-table-body");
const totalRevenueEl = document.getElementById("total-revenue");
const invoicePrintView = document.getElementById("invoice-print-view");
const btnPrintAction = document.getElementById("btn-print-action");
const btnCloseInvoice = document.getElementById("btn-close-invoice");

// Initialize
export function initInvoices() {
    loadInvoices();

    if (btnCloseInvoice) {
        btnCloseInvoice.addEventListener("click", () => {
            invoicePrintView.classList.add("hidden");
        });
    }

    if (btnPrintAction) {
        btnPrintAction.addEventListener("click", () => {
            window.print();
        });
    }
}

// Load Invoices (Registrations)
export async function loadInvoices() {
    if (!invoicesTableBody) return;

    invoicesTableBody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';

    try {
        const q = query(collection(db, "registrations"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        invoicesTableBody.innerHTML = "";
        
        let totalRevenue = 0;
        let count = 0;

        if (querySnapshot.empty) {
            invoicesTableBody.innerHTML = '<tr><td colspan="6">No invoices found.</td></tr>';
            if (totalRevenueEl) totalRevenueEl.textContent = "$0.00";
            return;
        }

        // We need to fetch student and event details for each registration
        // For a large app, we would duplicate data or use a backend, but here we'll fetch client-side.
        for (const docSnapshot of querySnapshot.docs) {
            const reg = docSnapshot.data();
            const regId = docSnapshot.id;
            
            // Parallel fetch for student and event
            const [studentSnap, eventSnap] = await Promise.all([
                getDoc(doc(db, "students", reg.studentId)),
                getDoc(doc(db, "events", reg.eventId))
            ]);

            const studentName = studentSnap.exists() ? studentSnap.data().name : "Unknown Student";
            const eventName = eventSnap.exists() ? eventSnap.data().eventName : "Unknown Event";

            totalRevenue += reg.totalAmount || 0;

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${reg.invoiceNo}</td>
                <td>${studentName}</td>
                <td>${eventName}</td>
                <td>$${reg.totalAmount.toFixed(2)}</td>
                <td>
                    <span class="status-badge ${reg.paymentStatus.toLowerCase()}">${reg.paymentStatus}</span>
                    ${reg.paymentStatus === 'Pending' ? `<button class="btn-sm btn-pay" data-id="${regId}">Mark Paid</button>` : ''}
                </td>
                <td>
                    <button class="btn-sm btn-view-invoice" data-id="${regId}">View/Print</button>
                </td>
            `;
            invoicesTableBody.appendChild(row);
            count++;
        }

        if (totalRevenueEl) {
            totalRevenueEl.textContent = "$" + totalRevenue.toFixed(2);
        }

        // Add Event Listeners for buttons
        document.querySelectorAll(".btn-view-invoice").forEach(btn => {
            btn.addEventListener("click", (e) => openInvoice(e.target.dataset.id));
        });

        document.querySelectorAll(".btn-pay").forEach(btn => {
            btn.addEventListener("click", (e) => markAsPaid(e.target.dataset.id));
        });

    } catch (error) {
        console.error("Error loading invoices: ", error);
        invoicesTableBody.innerHTML = '<tr><td colspan="6">Error loading data.</td></tr>';
    }
}

// Mark as Paid
async function markAsPaid(regId) {
    if (!confirm("Mark this invoice as PAID?")) return;

    try {
        const regRef = doc(db, "registrations", regId);
        await updateDoc(regRef, {
            paymentStatus: "Paid"
        });
        loadInvoices(); // Refresh
    } catch (error) {
        handleFirebaseError(error, "Updating Payment Status");
    }
}

// Open Invoice View
async function openInvoice(regId) {
    try {
        // Fetch Registration
        const regSnap = await getDoc(doc(db, "registrations", regId));
        if (!regSnap.exists()) return;
        const reg = regSnap.data();

        // Fetch Student & Event
        const [studentSnap, eventSnap] = await Promise.all([
            getDoc(doc(db, "students", reg.studentId)),
            getDoc(doc(db, "events", reg.eventId))
        ]);
        
        const student = studentSnap.exists() ? studentSnap.data() : {};
        const event = eventSnap.exists() ? eventSnap.data() : {};

        // Fetch Segments
        const q = query(collection(db, "registration_segments"), where("registrationId", "==", regId));
        const segSnaps = await getDocs(q);

        // Populate DOM
        document.getElementById("print-invoice-no").textContent = reg.invoiceNo;
        document.getElementById("print-date").textContent = reg.createdAt.toDate().toLocaleDateString();
        document.getElementById("print-status").textContent = reg.paymentStatus;
        
        document.getElementById("print-student-name").textContent = student.name || "N/A";
        document.getElementById("print-student-details").textContent = 
            `Class: ${student.class || '-'}, Sec: ${student.section || '-'}, Roll: ${student.rollNo || '-'}`;
        
        document.getElementById("print-event-name").textContent = event.eventName || "N/A";
        document.getElementById("print-event-date").textContent = event.eventDate || "-";

        const itemsBody = document.getElementById("print-items-body");
        itemsBody.innerHTML = "";
        
        segSnaps.forEach(doc => {
            const seg = doc.data();
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${seg.segmentName}</td>
                <td class="text-right">$${seg.fee.toFixed(2)}</td>
            `;
            itemsBody.appendChild(row);
        });

        document.getElementById("print-total").textContent = "$" + reg.totalAmount.toFixed(2);

        // Show Modal
        invoicePrintView.classList.remove("hidden");

    } catch (error) {
        handleFirebaseError(error, "Opening Invoice");
    }
}
