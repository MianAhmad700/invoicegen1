import { db, collection, addDoc, getDocs, query, where, orderBy, handleFirebaseError } from "./firebase-config.js";

// DOM Elements
const addEventForm = document.getElementById("add-event-form");
const segmentEventSelect = document.getElementById("segment-event-select");
const segmentManager = document.getElementById("segment-manager");
const addSegmentForm = document.getElementById("add-segment-form");
const segmentsList = document.getElementById("segments-list");
const activeEventsEl = document.getElementById("active-events");

// Initialize
export function initEvents() {
    if (addEventForm) {
        addEventForm.addEventListener("submit", handleAddEvent);
    }
    
    if (segmentEventSelect) {
        segmentEventSelect.addEventListener("change", handleSegmentEventChange);
        loadEventSelects(); // Initial load
    }

    if (addSegmentForm) {
        addSegmentForm.addEventListener("submit", handleAddSegment);
    }

    updateActiveEventsCount();
}

// Add Event
async function handleAddEvent(e) {
    e.preventDefault();

    const name = document.getElementById("event-name").value;
    const date = document.getElementById("event-date").value;
    const description = document.getElementById("event-desc").value;
    const isActive = document.getElementById("event-active").checked;

    try {
        await addDoc(collection(db, "events"), {
            eventName: name,
            eventDate: date,
            description,
            isActive,
            createdAt: new Date()
        });

        alert("Event created successfully!");
        addEventForm.reset();
        loadEventSelects(); // Refresh dropdowns
        updateActiveEventsCount();
    } catch (error) {
        handleFirebaseError(error, "Adding Event");
    }
}

// Populate all event select dropdowns (including those in other modules if passed, 
// but here we primarily target the ones we know about or provide an export)
export async function loadEventSelects() {
    try {
        const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        // Target specific dropdowns
        const dropdowns = [
            document.getElementById("segment-event-select"),
            document.getElementById("reg-event-select") // In registrations module
        ];

        const events = [];
        querySnapshot.forEach(doc => {
            events.push({ id: doc.id, ...doc.data() });
        });

        dropdowns.forEach(select => {
            if (!select) return;
            
            // Keep the first option (placeholder)
            const firstOption = select.options[0];
            select.innerHTML = "";
            select.appendChild(firstOption);

            events.forEach(event => {
                const option = document.createElement("option");
                option.value = event.id;
                option.textContent = `${event.eventName} (${event.eventDate})`;
                if (!event.isActive) {
                    option.textContent += " [Inactive]";
                    // option.disabled = true; // Optional: disable inactive events
                }
                select.appendChild(option);
            });
        });

    } catch (error) {
        handleFirebaseError(error, "Loading Events");
    }
}

// Handle Segment Event Selection
async function handleSegmentEventChange() {
    const eventId = segmentEventSelect.value;
    if (!eventId) {
        segmentManager.classList.add("hidden");
        return;
    }

    segmentManager.classList.remove("hidden");
    loadSegments(eventId);
}

// Add Segment
async function handleAddSegment(e) {
    e.preventDefault();

    const eventId = segmentEventSelect.value;
    const name = document.getElementById("segment-name").value;
    const fee = parseFloat(document.getElementById("segment-fee").value);

    if (!eventId) return;

    try {
        await addDoc(collection(db, "segments"), {
            eventId,
            segmentName: name,
            fee
        });

        document.getElementById("segment-name").value = "";
        document.getElementById("segment-fee").value = "";
        loadSegments(eventId);
    } catch (error) {
        handleFirebaseError(error, "Adding Segment");
    }
}

// Load Segments for a specific event
async function loadSegments(eventId) {
    segmentsList.innerHTML = "<li>Loading...</li>";

    try {
        const q = query(collection(db, "segments"), where("eventId", "==", eventId));
        const querySnapshot = await getDocs(q);

        segmentsList.innerHTML = "";
        
        if (querySnapshot.empty) {
            segmentsList.innerHTML = "<li>No segments added yet.</li>";
            return;
        }

        querySnapshot.forEach(doc => {
            const segment = doc.data();
            const li = document.createElement("li");
            li.className = "list-group-item";
            li.innerHTML = `
                <span>${segment.segmentName}</span>
                <strong>$${segment.fee.toFixed(2)}</strong>
            `;
            segmentsList.appendChild(li);
        });

    } catch (error) {
        handleFirebaseError(error, "Loading Segments");
        segmentsList.innerHTML = "<li>Error loading segments.</li>";
    }
}

async function updateActiveEventsCount() {
    if (!activeEventsEl) return;
    try {
        const q = query(collection(db, "events"), where("isActive", "==", true));
        const snap = await getDocs(q);
        activeEventsEl.textContent = snap.size;
    } catch (e) {
        console.error(e);
    }
}
