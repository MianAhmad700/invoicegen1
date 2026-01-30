import { initStudents, loadStudents } from "./students.js";
import { initEvents, loadEventSelects } from "./events.js";
import { initRegistrations, loadStudentSelect } from "./registrations.js";
import { initInvoices, loadInvoices } from "./invoice.js";

document.addEventListener("DOMContentLoaded", () => {
    // Initialize Modules
    initStudents();
    initEvents();
    initRegistrations();
    initInvoices();

    // Mobile Menu Logic
    const mobileMenuBtn = document.getElementById("mobile-menu-toggle");
    const navbarNav = document.getElementById("navbar-nav");

    function toggleNavbar(show) {
        if (navbarNav) {
            if (show) {
                navbarNav.classList.add("show");
            } else {
                navbarNav.classList.remove("show");
            }
        }
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const isShown = navbarNav.classList.contains("show");
            toggleNavbar(!isShown);
        });
    }

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
        if (window.innerWidth <= 768 && 
            navbarNav && navbarNav.classList.contains("show") && 
            !navbarNav.contains(e.target) && 
            e.target !== mobileMenuBtn) {
            toggleNavbar(false);
        }
    });

    // Navigation Logic
    const navButtons = document.querySelectorAll(".nav-btn");
    const sections = document.querySelectorAll(".section");

    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.dataset.target;
            
            // Update Active Button
            navButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            // Close Navbar on Mobile Selection
            if (window.innerWidth <= 768) {
                toggleNavbar(false);
            }

            // Show Target Section
            sections.forEach(section => {
                section.classList.remove("active");
                if (section.id === targetId) {
                    section.classList.add("active");
                }
            });

            // Refresh Data based on Section
            switch (targetId) {
                case "students":
                    loadStudents();
                    break;
                case "events":
                    loadEventSelects();
                    break;
                case "registrations":
                    loadStudentSelect();
                    loadEventSelects();
                    break;
                case "invoices":
                    loadInvoices();
                    break;
                case "dashboard":
                    // Optionally refresh dashboard stats if we extract that logic
                    // For now, simple re-inits or just leaving it is fine as stats might be in init
                    // But usually stats need refreshing too.
                    // The stats are in initEvents (activeEvents) and initStudents (totalStudents) and initInvoices (totalRevenue)
                    // We should probably export those specific update functions if we want real-time dashboard
                    // But for now, let's at least ensure the main lists are updated.
                    break;
            }
        });
    });
});
