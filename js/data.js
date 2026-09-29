const STORAGE_KEYS = {
    subjects: "wkk_subjects",
    tasks: "wkk_tasks",
    studySessions: "wkk_study_sessions",
    initialized: "wkk_initialized"
};

let databaseReady = false;
let persistenceQueue = Promise.resolve();

function loadFromStorage(key, fallback) {
    const storedValue = localStorage.getItem(key);

    if (!storedValue) {
        return fallback;
    }

    try {
        return JSON.parse(storedValue);
    } catch (error) {
        return fallback;
    }
}

function notifyDataUpdated() {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("wkk:data-updated"));
    }
}

function persistCollection(resource, items) {
    if (!databaseReady) return Promise.resolve();

    persistenceQueue = persistenceQueue.then(async () => {
        try {
            const response = await fetch(`/api/${resource}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(items)
            });
            if (!response.ok) {
                const result = await response.json().catch(() => ({}));
                throw new Error(result.error || `HTTP ${response.status}`);
            }
        } catch (error) {
            console.error(`Could not save ${resource} to the database:`, error);
        }
    });

    return persistenceQueue;
}

function saveSubjects(subjects) {
    localStorage.setItem(STORAGE_KEYS.subjects, JSON.stringify(subjects));
    notifyDataUpdated();
    persistCollection("subjects", subjects);
}

function saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
    notifyDataUpdated();
    persistCollection("tasks", tasks);
}

function saveStudySessions(studySessions) {
    localStorage.setItem(STORAGE_KEYS.studySessions, JSON.stringify(studySessions));
    notifyDataUpdated();
    persistCollection("studySessions", studySessions);
}

function getSubjects() {
    return loadFromStorage(STORAGE_KEYS.subjects, []);
}

function getTasks() {
    return loadFromStorage(STORAGE_KEYS.tasks, []);
}

function getStudySessions() {
    return loadFromStorage(STORAGE_KEYS.studySessions, []);
}

function getSubjectById(subjectId) {
    const id = Number(subjectId);
    return getSubjects().find(subject => subject.id === id);
}

function initializeData() {
    if (localStorage.getItem(STORAGE_KEYS.initialized)) {
        return;
    }

    const subjects = [
        {
            id: 1,
            name: "Web Development",
            code: "IT 204",
            instructor: "Mr. Santos"
        },
        {
            id: 2,
            name: "Mathematics",
            code: "MATH 101",
            instructor: "Ms. Garcia"
        },
        {
            id: 3,
            name: "Biology",
            code: "BIO 102",
            instructor: "Dr. Reyes"
        }
    ];

    const tasks = [
        {
            id: 1,
            title: "Web System Project",
            description: "Build the student productivity system frontend.",
            subjectId: 1,
            deadline: "2026-09-12",
            priority: "high",
            status: "in-progress",
            progress: 80
        },
        {
            id: 2,
            title: "Mathematics Assignment",
            description: "Complete exercises from Chapter 5.",
            subjectId: 2,
            deadline: "2026-09-14",
            priority: "medium",
            status: "not-started",
            progress: 40
        },
        {
            id: 3,
            title: "Biology Reading",
            description: "Read Chapter 4 and create notes.",
            subjectId: 3,
            deadline: "2026-09-17",
            priority: "low",
            status: "not-started",
            progress: 20
        },
        {
            id: 4,
            title: "Research Summary",
            description: "Submit the short draft for biology research.",
            subjectId: 3,
            deadline: "2026-09-11",
            priority: "high",
            status: "in-progress",
            progress: 65
        }
    ];

    const studySessions = [
        {
            id: 1,
            subjectId: 1,
            topic: "Frontend Development",
            date: "2026-09-11",
            startTime: "19:00",
            duration: 60
        },
        {
            id: 2,
            subjectId: 2,
            topic: "Calculus Review",
            date: "2026-09-12",
            startTime: "17:00",
            duration: 90
        },
        {
            id: 3,
            subjectId: 3,
            topic: "Cell Structure Notes",
            date: "2026-09-13",
            startTime: "18:30",
            duration: 45
        }
    ];

    saveSubjects(subjects);
    saveTasks(tasks);
    saveStudySessions(studySessions);

    localStorage.setItem(STORAGE_KEYS.initialized, "true");
}

initializeData();

async function loadDatabaseData() {
    try {
        const [subjectsResponse, tasksResponse, sessionsResponse] = await Promise.all([
            fetch("/api/subjects"),
            fetch("/api/tasks"),
            fetch("/api/studySessions")
        ]);
        if (![subjectsResponse, tasksResponse, sessionsResponse].every(response => response.ok)) {
            throw new Error("The API returned an error while loading data.");
        }

        const [subjects, tasks, studySessions] = await Promise.all([
            subjectsResponse.json(),
            tasksResponse.json(),
            sessionsResponse.json()
        ]);
        const databaseIsEmpty = !subjects.length && !tasks.length && !studySessions.length;

        if (databaseIsEmpty) {
            databaseReady = true;
            await persistCollection("subjects", getSubjects());
            await persistCollection("tasks", getTasks());
            await persistCollection("studySessions", getStudySessions());
        } else {
            localStorage.setItem(STORAGE_KEYS.subjects, JSON.stringify(subjects.map(item => ({ ...item, id: Number(item.id) }))));
            localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks.map(item => ({ ...item, id: Number(item.id), subjectId: Number(item.subjectId) || 0 }))));
            localStorage.setItem(STORAGE_KEYS.studySessions, JSON.stringify(studySessions.map(item => ({ ...item, id: Number(item.id), subjectId: Number(item.subjectId) || 0, duration: Number(item.duration) }))));
            databaseReady = true;
        }
    } catch (error) {
        databaseReady = true;
        console.warn("Using browser storage because the SQL API could not be reached:", error.message);
    }

    notifyDataUpdated();
}

window.wkkDataReady = loadDatabaseData();