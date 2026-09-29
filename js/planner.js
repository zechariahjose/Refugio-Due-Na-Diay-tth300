document.addEventListener("DOMContentLoaded", () => {
    const plannerWeek = document.getElementById("plannerWeek");
    const sessionModal = document.getElementById("sessionModal");
    const sessionForm = document.getElementById("sessionForm");
    const newSessionButton = document.getElementById("newSessionButton");
    const closeSessionModal = document.getElementById("closeSessionModal");
    const cancelSessionModal = document.getElementById("cancelSessionModal");
    const sessionModalTitle = document.getElementById("sessionModalTitle");
    const deleteSessionButton = document.getElementById("deleteSessionButton");

    if (!plannerWeek || !sessionForm) {
        return;
    }

    const days = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
    ];

    function populateSubjectOptions() {
        const subjectSelect = document.getElementById("sessionSubject");

        if (!subjectSelect) {
            return;
        }

        const subjects = getSubjects();

        if (!subjects.length) {
            subjectSelect.innerHTML = '<option value="">No subjects available</option>';
            return;
        }

        subjectSelect.innerHTML = subjects.map(subject => {
            return `<option value="${subject.id}">${subject.name}</option>`;
        }).join("");
    }

    function renderPlanner() {
        const sessions = getStudySessions().sort((a, b) => {
            const aDate = new Date(`${a.date}T${a.startTime || "00:00"}:00`);
            const bDate = new Date(`${b.date}T${b.startTime || "00:00"}:00`);
            return aDate - bDate;
        });

        plannerWeek.innerHTML = days.map(day => {
            const daySessions = sessions.filter(session => {
                if (!session.date) {
                    return false;
                }
                const sessionDate = new Date(session.date + "T00:00:00");
                return sessionDate.toLocaleDateString("en-US", { weekday: "long" }) === day;
            });

            return `
                <div class="day-card">
                    <h3>${day}</h3>
                    <div class="session-list">
                        ${daySessions.length ? daySessions.map(session => {
                            const subject = getSubjectById(session.subjectId);
                            return `
                                <div class="session-item">
                                    <h4>${session.topic}</h4>
                                    <div class="session-meta">
                                        <span>${subject ? subject.name : "Unknown"}</span>
                                        <span>${session.startTime}</span>
                                        <span>${session.duration} min</span>
                                    </div>
                                    <div class="form-actions" style="margin-top: 12px; justify-content: flex-end;">
                                        <div class="form-actions-right">
                                            <button class="secondary-btn small-btn" type="button" data-action="edit" data-id="${session.id}">Edit</button>
                                            <button class="danger-btn small-btn" type="button" data-action="delete" data-id="${session.id}">Delete</button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join("") : '<p class="empty-state">No study sessions.</p>'}
                    </div>
                </div>
            `;
        }).join("");
    }

    function openSessionModal(session = null) {
        populateSubjectOptions();

        if (!session) {
            sessionForm.reset();
            document.getElementById("sessionId").value = "";
            document.getElementById("sessionDuration").value = "60";
            sessionModalTitle.textContent = "Add session";
            deleteSessionButton.hidden = true;
            if (sessionModal) sessionModal.hidden = false;
            return;
        }

        document.getElementById("sessionId").value = session.id;
        document.getElementById("sessionTopic").value = session.topic || "";
        document.getElementById("sessionSubject").value = session.subjectId;
        document.getElementById("sessionDate").value = session.date || "";
        document.getElementById("sessionStartTime").value = session.startTime || "";
        document.getElementById("sessionDuration").value = session.duration || 60;
        sessionModalTitle.textContent = "Edit session";
        deleteSessionButton.hidden = false;
        if (sessionModal) sessionModal.hidden = false;
    }

    function closeSessionModalWindow() {
        if (sessionModal) {
            sessionModal.hidden = true;
        }
        sessionForm.reset();
        document.getElementById("sessionId").value = "";
    }

    function saveSession(event) {
        event.preventDefault();

        const formData = new FormData(sessionForm);
        const topic = (formData.get("topic") || "").toString().trim();
        const date = (formData.get("date") || "").toString();
        const startTime = (formData.get("startTime") || "").toString();
        const duration = Number(formData.get("duration") || 0);
        const subjectId = Number(formData.get("subjectId") || 0);

        if (!topic || !date || !startTime || !duration) {
            alert("Please complete the session details.");
            return;
        }

        const sessions = getStudySessions();
        const sessionId = document.getElementById("sessionId").value;
        const payload = {
            topic,
            subjectId: Number.isFinite(subjectId) ? subjectId : 1,
            date,
            startTime,
            duration: Math.max(15, duration)
        };

        if (sessionId) {
            const index = sessions.findIndex(session => String(session.id) === String(sessionId));

            if (index >= 0) {
                sessions[index] = { ...sessions[index], ...payload };
            }
        } else {
            const nextId = sessions.length ? Math.max(...sessions.map(session => Number(session.id || 0))) + 1 : 1;
            sessions.push({ id: nextId, ...payload });
        }

        saveStudySessions(sessions);
        closeSessionModalWindow();
        renderPlanner();
    }

    function deleteSession(sessionId) {
        const sessions = getStudySessions().filter(session => String(session.id) !== String(sessionId));
        saveStudySessions(sessions);
        closeSessionModalWindow();
        renderPlanner();
    }

    newSessionButton?.addEventListener("click", () => openSessionModal());
    closeSessionModal?.addEventListener("click", closeSessionModalWindow);
    cancelSessionModal?.addEventListener("click", closeSessionModalWindow);

    sessionModal?.addEventListener("click", (event) => {
        if (event.target === sessionModal) {
            closeSessionModalWindow();
        }
    });

    sessionForm.addEventListener("submit", saveSession);

    deleteSessionButton?.addEventListener("click", () => {
        const sessionId = document.getElementById("sessionId").value;
        if (sessionId) {
            deleteSession(sessionId);
        }
    });

    plannerWeek.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-action]");

        if (!button) {
            return;
        }

        const sessionId = button.dataset.id;
        const action = button.dataset.action;

        if (action === "edit") {
            const session = getStudySessions().find(item => String(item.id) === String(sessionId));
            if (session) {
                openSessionModal(session);
            }
        }

        if (action === "delete") {
            deleteSession(sessionId);
        }
    });

    window.wkkDataReady.then(() => {
        populateSubjectOptions();
        renderPlanner();
    });
});