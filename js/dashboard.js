document.addEventListener("DOMContentLoaded", () => {
    refreshDashboard();
    window.addEventListener("wkk:data-updated", refreshDashboard);
});

function refreshDashboard() {
    loadStatistics();
    loadPriorityTasks();
    loadUpcomingTasks();
}

function loadStatistics() {
    const tasks = getTasks();
    const today = new Date().toISOString().split("T")[0];

    const activeTasks = tasks.filter(task => task.status !== "completed");
    const dueToday = tasks.filter(task => task.deadline === today && task.status !== "completed");
    const overdue = tasks.filter(task => task.deadline < today && task.status !== "completed");
    const completed = tasks.filter(task => task.status === "completed");
    const completionRate = tasks.length
        ? Math.round((completed.length / tasks.length) * 100)
        : 0;

    document.getElementById("activeTasks").textContent = activeTasks.length;
    document.getElementById("dueToday").textContent = dueToday.length;
    document.getElementById("overdueTasks").textContent = overdue.length;
    document.getElementById("completedTasks").textContent = completed.length;
    document.getElementById("completionRate").textContent = `${completionRate}%`;

    const weekFocus = document.getElementById("weekFocus");
    if (weekFocus) {
        weekFocus.textContent = `${Math.max(0, dueToday.length + overdue.length)} tasks in focus`;
    }
}

function loadPriorityTasks() {
    const tasks = getTasks();
    const container = document.getElementById("priorityTasks");

    const priorityOrder = {
        high: 1,
        medium: 2,
        low: 3
    };

    const priorityTasks = tasks
        .filter(task => task.status !== "completed")
        .sort((a, b) => priorityOrder[a.priority || "medium"] - priorityOrder[b.priority || "medium"])
        .slice(0, 5);

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (priorityTasks.length === 0) {
        container.innerHTML = "<p class='empty-state'>You are all caught up. Great work.</p>";
        return;
    }

    priorityTasks.forEach(task => {
        const subject = getSubjectById(task.subjectId);
        const element = document.createElement("div");

        element.className = "task-item";
        element.innerHTML = `
            <div class="task-meta">
                <span class="priority-badge priority-${task.priority || "medium"}">${task.priority || "medium"}</span>
                <span class="status-badge status-${task.status || "not-started"}">${task.status || "not-started"}</span>
            </div>
            <h4>${task.title}</h4>
            <p><strong>Subject:</strong> ${subject ? subject.name : "Unknown"}</p>
            <p><strong>Deadline:</strong> ${task.deadline || "No deadline"}</p>
            <p><strong>Progress:</strong> ${task.progress || 0}%</p>
            <div class="progress-line"><span style="width: ${task.progress || 0}%"></span></div>
        `;

        container.appendChild(element);
    });
}

function loadUpcomingTasks() {
    const tasks = getTasks();
    const today = new Date().toISOString().split("T")[0];

    const upcomingTasks = tasks
        .filter(task => task.deadline >= today && task.status !== "completed")
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 5);

    const container = document.getElementById("upcomingTasks");
    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (upcomingTasks.length === 0) {
        container.innerHTML = "<p class='empty-state'>No upcoming deadlines.</p>";
        return;
    }

    upcomingTasks.forEach(task => {
        const entry = document.createElement("div");
        entry.className = "entry";
        entry.innerHTML = `<strong>${task.deadline}</strong> — ${task.title}`;
        container.appendChild(entry);
    });
}