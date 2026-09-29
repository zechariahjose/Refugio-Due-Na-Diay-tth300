document.addEventListener("DOMContentLoaded", () => {
    const subjectsGrid = document.getElementById("subjectsGrid");
    const subjectModal = document.getElementById("subjectModal");
    const subjectForm = document.getElementById("subjectForm");
    const newSubjectButton = document.getElementById("newSubjectButton");
    const closeSubjectModal = document.getElementById("closeSubjectModal");
    const cancelSubjectModal = document.getElementById("cancelSubjectModal");
    const subjectModalTitle = document.getElementById("subjectModalTitle");
    const deleteSubjectButton = document.getElementById("deleteSubjectButton");

    if (!subjectsGrid || !subjectForm) {
        return;
    }

    function renderSubjects() {
        const subjects = getSubjects();

        if (!subjects.length) {
            subjectsGrid.innerHTML = '<div class="empty-state">No subjects yet.</div>';
            return;
        }

        subjectsGrid.innerHTML = subjects.map(subject => {
            const relatedTasks = getTasks().filter(task => Number(task.subjectId) === Number(subject.id));
            const completedCount = relatedTasks.filter(task => task.status === "completed").length;
            const progress = relatedTasks.length ? Math.round((completedCount / relatedTasks.length) * 100) : 0;

            return `
                <article class="subject-card">
                    <div class="subject-card-header">
                        <h3>${subject.name}</h3>
                        <span class="subject-code">${subject.code}</span>
                    </div>
                    <p>${subject.instructor}</p>
                    <div class="subject-meta">
                        <span>${relatedTasks.length} tasks</span>
                        <span>${completedCount} completed</span>
                    </div>
                    <div class="progress-line">
                        <span style="width: ${progress}%"></span>
                    </div>
                    <div class="form-actions" style="margin-top: 16px; justify-content: flex-end;">
                        <div class="form-actions-right">
                            <button class="secondary-btn small-btn" type="button" data-action="edit" data-id="${subject.id}">Edit</button>
                            <button class="danger-btn small-btn" type="button" data-action="delete" data-id="${subject.id}">Delete</button>
                        </div>
                    </div>
                </article>
            `;
        }).join("");
    }

    function openSubjectModal(subject = null) {
        if (!subject) {
            subjectForm.reset();
            document.getElementById("subjectId").value = "";
            subjectModalTitle.textContent = "Add subject";
            deleteSubjectButton.hidden = true;
            if (subjectModal) subjectModal.hidden = false;
            return;
        }

        document.getElementById("subjectId").value = subject.id;
        document.getElementById("subjectName").value = subject.name || "";
        document.getElementById("subjectCode").value = subject.code || "";
        document.getElementById("subjectInstructor").value = subject.instructor || "";
        subjectModalTitle.textContent = "Edit subject";
        deleteSubjectButton.hidden = false;
        if (subjectModal) subjectModal.hidden = false;
    }

    function closeSubjectModalWindow() {
        if (subjectModal) {
            subjectModal.hidden = true;
        }
        subjectForm.reset();
        document.getElementById("subjectId").value = "";
    }

    function saveSubject(event) {
        event.preventDefault();

        const formData = new FormData(subjectForm);
        const name = (formData.get("name") || "").toString().trim();
        const code = (formData.get("code") || "").toString().trim();
        const instructor = (formData.get("instructor") || "").toString().trim();

        if (!name || !code || !instructor) {
            alert("All subject fields are required.");
            return;
        }

        const subjects = getSubjects();
        const subjectId = document.getElementById("subjectId").value;
        const payload = { name, code, instructor };

        if (subjectId) {
            const index = subjects.findIndex(subject => String(subject.id) === String(subjectId));

            if (index >= 0) {
                subjects[index] = { ...subjects[index], ...payload };
            }
        } else {
            const nextId = subjects.length ? Math.max(...subjects.map(subject => Number(subject.id || 0))) + 1 : 1;
            subjects.push({ id: nextId, ...payload });
        }

        saveSubjects(subjects);
        closeSubjectModalWindow();
        renderSubjects();
    }

    function deleteSubject(subjectId) {
        const tasks = getTasks();
        const hasLinkedTasks = tasks.some(task => Number(task.subjectId) === Number(subjectId));

        if (hasLinkedTasks) {
            const proceed = window.confirm("This subject has tasks assigned to it. Delete it anyway?");
            if (!proceed) {
                return;
            }

            const updatedTasks = tasks.map(task => {
                if (Number(task.subjectId) === Number(subjectId)) {
                    return { ...task, subjectId: 0 };
                }
                return task;
            });
            saveTasks(updatedTasks);
        }

        const subjects = getSubjects().filter(subject => String(subject.id) !== String(subjectId));
        saveSubjects(subjects);
        closeSubjectModalWindow();
        renderSubjects();
    }

    newSubjectButton?.addEventListener("click", () => openSubjectModal());
    closeSubjectModal?.addEventListener("click", closeSubjectModalWindow);
    cancelSubjectModal?.addEventListener("click", closeSubjectModalWindow);

    subjectModal?.addEventListener("click", (event) => {
        if (event.target === subjectModal) {
            closeSubjectModalWindow();
        }
    });

    subjectForm.addEventListener("submit", saveSubject);

    deleteSubjectButton?.addEventListener("click", () => {
        const subjectId = document.getElementById("subjectId").value;
        if (subjectId) {
            deleteSubject(subjectId);
        }
    });

    subjectsGrid.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-action]");

        if (!button) {
            return;
        }

        const subjectId = button.dataset.id;
        const action = button.dataset.action;

        if (action === "edit") {
            const subject = getSubjects().find(item => String(item.id) === String(subjectId));
            if (subject) {
                openSubjectModal(subject);
            }
        }

        if (action === "delete") {
            deleteSubject(subjectId);
        }
    });

    renderSubjects();
});