import { zipSync } from "fflate";
import { importProject, snapshot } from "./package";
import { CodeEditorState, openAt, Project, TerminalContent } from "./state.svelte";

export interface SavedProject {
    id: string;
    name: string;
    updatedAt: number;
    openFile: string | null;
    zip: Uint8Array;
}

const STORE = "projects";
const SAVE_DELAY = 500;

// Captured at load, before anything is restored over the example project.
const template = {
    name: Project.name,
    openFile: CodeEditorState.currentFile,
    zip: zipSync(snapshot()),
};

const db = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open("katnip", 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
});

async function run<T>(mode: IDBTransactionMode, op: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const tx = (await db).transaction(STORE, mode);
    const req = op(tx.objectStore(STORE));
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve(req.result);
        tx.onerror = tx.onabort = () => reject(tx.error);
    });
}

let currentId = $state<string>(crypto.randomUUID());
let pending: (() => Promise<void>) | null = null;
let timer: ReturnType<typeof setTimeout>;
let saveFailing = false;

export function isCurrent(id: string) {
    return id === currentId;
}

function flush() {
    clearTimeout(timer);
    const save = pending;
    pending = null;
    return save?.();
}

function startAutosave() {
    $effect.root(() => {
        $effect(() => {
            const files = snapshot();
            const name = Project.name;
            const id = currentId;

            clearTimeout(timer);
            pending = async () => {
                try {
                    const project: SavedProject = { id, name, updatedAt: Date.now(), openFile: CodeEditorState.currentFile, zip: zipSync(files) };
                    await run("readwrite", (store) => store.put(project));
                    saveFailing = false;
                } catch (e) {
                    // Once per outage, otherwise this repeats on every edit.
                    if (!saveFailing) TerminalContent.push({ text: `Could not save project: ${e}. Use Export to keep your work.`, kind: "error" });
                    saveFailing = true;
                }
            };
            timer = setTimeout(flush, SAVE_DELAY);
        });
    });
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") flush();
    });
}

function show(id: string, project: { name: string; openFile: string | null; zip: Uint8Array }) {
    importProject(project.name, project.zip);
    currentId = id;
    if (project.openFile) openAt(project.openFile, 1, 1);
}

export async function listProjects() {
    const projects = await run<SavedProject[]>("readonly", (store) => store.getAll());
    return projects.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function newProject() {
    await flush();
    show(crypto.randomUUID(), template);
}

export async function openProject(project: SavedProject) {
    await flush();
    show(project.id, project);
}

export async function importAsNewProject(name: string, bytes: Uint8Array) {
    await flush();
    show(crypto.randomUUID(), { name, openFile: null, zip: bytes });
}

export async function deleteProject(id: string) {
    if (id !== currentId) {
        await run("readwrite", (store) => store.delete(id));
        return;
    }
    clearTimeout(timer);
    pending = null;
    await run("readwrite", (store) => store.delete(id));

    const [next] = await listProjects();
    if (next) show(next.id, next);
    else show(crypto.randomUUID(), template);
}

/** Reopens the latest project, then starts saving. Without storage the editor still works, just unsaved. */
export async function restoreProjects() {
    try {
        const [latest] = await listProjects();
        if (latest) show(latest.id, latest);
        navigator.storage?.persist();
    } catch (e) {
        TerminalContent.push({ text: `Could not load saved projects: ${e}`, kind: "error" });
    }
    startAutosave();
}
