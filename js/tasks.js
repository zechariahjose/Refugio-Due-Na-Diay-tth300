document.addEventListener("DOMContentLoaded", () => {
    const taskTableBody = document.getElementById("taskTableBody");
    const modal = document.getElementById("taskModal");
    const taskForm = document.getElementById("taskForm");
    const newTaskButton = document.getElementById("newTaskButton");
    const closeTaskModal = document.getElementById("closeTaskModal");
    const cancelTaskModal = document.getElementById("cancelTaskModal");
    const taskModalTitle = document.getElementById("taskModalTitle");
    const deleteTaskButton = document.getElementById("deleteTaskButton");
    const taskSearchInput = document.getElementById("taskSearchInput");
    const filterButtons = document.querySelectorAll(".chip");

    if (!taskTableBody || !taskForm) {
        return;
    }

    if (modal) {
        modal.hidden = true;
    }

    let activeFilter = "all";

    function populateSubjectOptions() {
        const subjectSelect = document.getElementById("taskSubject");

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

    function openTaskModal(task = null) {
        if (modal) {
            modal.hidden = false;
        }

        populateSubjectOptions();

        if (!task) {
            taskForm.reset();
            document.getElementById("taskId").value = "";
            document.getElementById("taskPriority").value = "medium";
            document.getElementById("taskStatus").value = "not-started";
            document.getElementById("taskProgress").value = "0";
            taskModalTitle.textContent = "Add task";
            deleteTaskButton.hidden = true;
            return;
        }

        document.getElementById("taskId").value = task.id;
        document.getElementById("taskTitle").value = task.title || "";
        document.getElementById("taskDescription").value = task.description || "";
        document.getElementById("taskSubject").value = task.subjectId;
        document.getElementById("taskDeadline").value = task.deadline || "";
        document.getElementById("taskPriority").value = task.priority || "medium";
        document.getElementById("taskStatus").value = task.status || "not-started";
        document.getElementById("taskProgress").value = task.progress || 0;
        taskModalTitle.textContent = "Edit task";
        deleteTaskButton.hidden = false;
    }

    function closeTaskModalWindow() {
        if (modal) {
            modal.hidden = true;
        }
        taskForm.reset();
        document.getElementById("taskId").value = "";
    }

    function getFilteredTasks() {
        let tasks = getTasks();
        const searchTerm = (taskSearchInput ? taskSearchInput.value.trim().toLowerCase() : "");

        if (activeFilter !== "all") {
            tasks = tasks.filter(task => task.status === activeFilter);
        }

        if (searchTerm) {
            tasks = tasks.filter(task => task.title.toLowerCase().includes(searchTerm));
        }

        return tasks.sort((a, b) => {
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            return new Date(a.deadline) - new Date(b.deadline);
        });
    }

    function renderTasks() {
        const tasks = getFilteredTasks();

        if (!tasks.length) {
            taskTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">No tasks match your current filter.</td>
                </tr>
            `;
            return;
        }

        taskTableBody.innerHTML = tasks.map(task => {
            const subject = getSubjectById(task.subjectId);
            const statusClass = task.status ? `status-${task.status.replace(/\s+/g, "-")}` : "status-not-started";

            return `
                <tr>
                    <td>
                        <strong>${task.title}</strong><br>
                        <small>${task.description || "No description"}</small>
                    </td>
                    <td>${subject ? subject.name : "Unknown"}</td>
                    <td>${task.deadline || "No deadline"}</td>
                    <td>
                        <select class="table-select" data-field="priority" data-id="${task.id}">
                            <option value="high" ${task.priority === "high" ? "selected" : ""}>High</option>
                            <option value="medium" ${task.priority === "medium" || !task.priority ? "selected" : ""}>Medium</option>
                            <option value="low" ${task.priority === "low" ? "selected" : ""}>Low</option>
                        </select>
                    </td>
                    <td>
                        <select class="table-select" data-field="status" data-id="${task.id}">
                            <option value="not-started" ${task.status === "not-started" ? "selected" : ""}>Not started</option>
                            <option value="in-progress" ${task.status === "in-progress" ? "selected" : ""}>In progress</option>
                            <option value="completed" ${task.status === "completed" ? "selected" : ""}>Completed</option>
                        </select>
                    </td>
                    <td>
                        ${task.progress || 0}%
                        <div class="progress-line"><span style="width: ${task.progress || 0}%"></span></div>
                    </td>
                    <td>
                        <button class="secondary-btn small-btn" type="button" data-action="edit" data-id="${task.id}">Edit</button>
                        <button class="danger-btn small-btn" type="button" data-action="delete" data-id="${task.id}">Delete</button>
                    </td>
                </tr>
            `;
        }).join("");
    }

    function saveTask(event) {
        event.preventDefault();

        const formData = new FormData(taskForm);
        const title = (formData.get("title") || "").toString().trim();

        if (!title) {
            alert("Task title is required.");
            return;
        }

        const tasks = getTasks();
        const taskId = document.getElementById("taskId").value;
        const subjectId = Number(formData.get("subjectId"));
        const payload = {
            title,
            description: (formData.get("description") || "").toString().trim(),
            subjectId: Number.isFinite(subjectId) ? subjectId : 1,
            deadline: (formData.get("deadline") || "").toString(),
            priority: (formData.get("priority") || "medium").toString(),
            status: (formData.get("status") || "not-started").toString(),
            progress: Math.min(100, Math.max(0, Number(formData.get("progress") || 0)))
        };

        if (taskId) {
            const index = tasks.findIndex(task => String(task.id) === String(taskId));

            if (index >= 0) {
                tasks[index] = { ...tasks[index], ...payload };
            }
        } else {
            const nextId = tasks.length ? Math.max(...tasks.map(task => Number(task.id || 0))) + 1 : 1;
            tasks.push({ id: nextId, ...payload });
        }

        saveTasks(tasks);
        closeTaskModalWindow();
        renderTasks();
    }

    function deleteTask(taskId) {
        const tasks = getTasks().filter(task => String(task.id) !== String(taskId));
        saveTasks(tasks);
        closeTaskModalWindow();
        renderTasks();
    }

    newTaskButton?.addEventListener("click", () => {
        if (modal) {
            modal.hidden = false;
        }
        openTaskModal();
    });

    closeTaskModal?.addEventListener("click", closeTaskModalWindow);
    cancelTaskModal?.addEventListener("click", closeTaskModalWindow);

    modal?.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeTaskModalWindow();
        }
    });

    taskForm.addEventListener("submit", saveTask);

    deleteTaskButton?.addEventListener("click", () => {
        const taskId = document.getElementById("taskId").value;

        if (!taskId) {
            return;
        }

        deleteTask(taskId);
    });

    taskTableBody.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-action]");

        if (!button) {
            return;
        }

        const taskId = button.dataset.id;
        const action = button.dataset.action;

        if (action === "edit") {
            const task = getTasks().find(item => String(item.id) === String(taskId));

            if (task) {
                if (modal) {
                    modal.hidden = false;
                }
                openTaskModal(task);
            }
        }

        if (action === "delete") {
            deleteTask(taskId);
        }
    });

    taskTableBody.addEventListener("change", (event) => {
        const field = event.target.closest("select[data-field]");

        if (!field) {
            return;
        }

        const taskId = field.dataset.id;
        const tasks = getTasks();
        const taskIndex = tasks.findIndex(task => String(task.id) === String(taskId));

        if (taskIndex === -1) {
            return;
        }

        const updatedTask = { ...tasks[taskIndex], [field.dataset.field]: field.value };
        tasks[taskIndex] = updatedTask;
        saveTasks(tasks);
        renderTasks();
    });

    taskSearchInput?.addEventListener("input", renderTasks);

    filterButtons.forEach(button => {
        button.addEventListener("click", () => {
            activeFilter = button.dataset.filter || "all";
            filterButtons.forEach(item => item.classList.toggle("active", item === button));
            renderTasks();
        });
    });

        window.wkkDataReady.then(() => {
            populateSubjectOptions();
            renderTasks();
        });

    if (new URLSearchParams(window.location.search).has("new")) {
        openTaskModal();
    }
});