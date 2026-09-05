import type { Scaffolding } from "@turbowarp/scaffolding";
import type { ProjectConfig, EditorState, ContextMenuState, FilesystemEntry, FilesystemDirectory, TerminalLine } from "./types";

export const Project: ProjectConfig = $state({
    name: "My Project",
    files: {
        type: "directory",
        name: "/",
        path: "/",
        files: {
            "hello.md": {
                type: "file",
                name: "hello.md",
                path: "/hello.md",
                contentIdx: 0,
            },
            "thing.json": {
                type: "file",
                name: "thing.json",
                path: "/thing.json",
                contentIdx: 1,
            },
            "test.knip": {
                type: "file",
                name: "test.knip",
                path: "/test.knip",
                contentIdx: 2,
            },
            "settings.toml": {
                type: "file",
                name: "settings.toml",
                path: "/settings.toml",
                contentIdx: 3,
            },
        },
    },
});

export const ProjectContent: Array<string | Uint8Array> = $state([]);

/** Bytes that are valid UTF-8 become text; anything else stays binary. */
export function bytesToContent(bytes: Uint8Array): string | Uint8Array {
    try { return new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch { return bytes; }
}

/** Adds or replaces a file at the FS root. */
export function uploadFile(name: string, bytes: Uint8Array) {
    const content = bytesToContent(bytes);

    const existing = Project.files.files[name];
    if (existing?.type === "file") {
        ProjectContent[existing.contentIdx] = content;
        return;
    }
    const contentIdx = ProjectContent.push(content) - 1;
    Project.files.files[name] = { type: "file", name, path: `/${name}`, contentIdx };
}
ProjectContent[0] = "## haiii :3";
ProjectContent[1] = `{
    "hello": "world",
    "myArray": [
        1,
        "2",
        null
    ]
}`
ProjectContent[2] = `public score: num = 0;

proc award(points: num) -> void {
    score += points;
}

sprite Cat {
    events.onFlag() {
        pen.down();
        for (side, 4) {
            motion.forward(100);
            motion.turn(90);
            award(10);
        }
        pen.up();
        looks.say(f"Scored {score}!", 2);
    }
}
`;
ProjectContent[3] = `# Katnip compilation settings

# --- Web-Editor Options ---

# Decide how the web editor submits your project for compilation
# "open-editor" -> Send my current file and any imported files
# "main" -> Search for a file named "main.knip", fallback to "open-editor"
compilation = "open-editor" # enum: (open-editor, main)


# --- Compiler Options ---

`;

export const CodeEditorState: EditorState = $state({
    currentFile: null,
    currentFileContent: null,
    createEntryName: null,
    createEntryType: null,
    createEntryPath: null,
    renameEntryPath: null,
    renameEntryName: null,
    reveal: null
});

export const ContextMenu: ContextMenuState = $state({
    x: 0,
    y: 0,
    entry: null,
    parent: null
});

export function openContextMenu(x: number, y: number, entry: FilesystemEntry, parent: FilesystemDirectory | null) {
    ContextMenu.x = x;
    ContextMenu.y = y;
    ContextMenu.entry = entry;
    ContextMenu.parent = parent;
}

export function closeContextMenu() {
    ContextMenu.entry = null;
    ContextMenu.parent = null;
}

export function beginCreate(type: "file" | "directory", dirPath: string) {
    CodeEditorState.createEntryPath = dirPath;
    CodeEditorState.createEntryName = "";
    CodeEditorState.createEntryType = type;
}

export function beginRename(entry: FilesystemEntry) {
    CodeEditorState.renameEntryPath = entry.path;
    CodeEditorState.renameEntryName = entry.name;
}

export function cancelRename() {
    CodeEditorState.renameEntryPath = null;
    CodeEditorState.renameEntryName = null;
}

function repath(entry: FilesystemEntry, path: string) {
    entry.path = path;
    if (entry.type === "directory") {
        for (const child of Object.values(entry.files)) repath(child, `${path}/${child.name}`);
    }
}

/** Renames `entry` inside `parent`. No-op if the name is empty or taken. */
export function renameEntry(entry: FilesystemEntry, parent: FilesystemDirectory, name: string) {
    name = name.trim();
    if (!name || name === entry.name || parent.files[name]) return;

    const oldPath = entry.path;
    const base = parent.path === "/" ? "" : parent.path;
    const path = `${base}/${name}`;

    // Rebuild instead of delete+add so the entry keeps its position.
    parent.files = Object.fromEntries(
        Object.entries(parent.files).map(([k, v]) => k === entry.name ? [name, v] : [k, v])
    );
    entry = parent.files[name];
    entry.name = name;
    repath(entry, path);

    fixOpenPaths(oldPath, path);
}

function fixOpenPaths(oldPath: string, path: string) {
    const moved = (p: string | null | undefined) =>
        p === oldPath ? path : p?.startsWith(`${oldPath}/`) ? path + p.slice(oldPath.length) : p;
    CodeEditorState.currentFile = moved(CodeEditorState.currentFile) ?? null;
    CodeEditorState.focusedEntry = moved(CodeEditorState.focusedEntry) ?? undefined;
}

/** Finds an entry and its parent by path. */
export function findEntry(path: string): { entry: FilesystemEntry; parent: FilesystemDirectory | null } | null {
    let parent: FilesystemDirectory | null = null;
    let entry: FilesystemEntry = Project.files;
    for (const seg of path.split("/").filter(Boolean)) {
        if (entry.type !== "directory" || !entry.files[seg]) return null;
        parent = entry;
        entry = entry.files[seg];
    }
    return { entry, parent };
}

/** Moves the entry at `srcPath` into the directory `dest`. No-op if invalid, same parent, into itself, or name taken. */
export function moveEntry(srcPath: string, dest: FilesystemDirectory) {
    const found = findEntry(srcPath);
    if (!found?.parent) return;
    const { entry, parent } = found;
    if (parent === dest || dest.path === srcPath || dest.path.startsWith(`${srcPath}/`)) return;
    if (dest.files[entry.name]) return;

    delete parent.files[entry.name];
    dest.files[entry.name] = entry;
    const base = dest.path === "/" ? "" : dest.path;
    repath(entry, `${base}/${entry.name}`);
    fixOpenPaths(srcPath, entry.path);
}

export function cancelCreate() {
    CodeEditorState.createEntryPath = null;
    CodeEditorState.createEntryName = null;
    CodeEditorState.createEntryType = null;
}

export const StageState: {
    sb3: Uint8Array | null;
    scaffolding: Scaffolding | null;
} = $state({ sb3: null, scaffolding: null });

export const TerminalContent: TerminalLine[] = $state([]);

/** Opens the file at `path` in the editor and jumps to `line`/`column`. */
export function openAt(path: string, line: number, column: number) {
    const found = findEntry(path);
    if (found?.entry.type !== "file") return;
    CodeEditorState.currentFile = path;
    CodeEditorState.currentFileContent = found.entry.contentIdx;
    CodeEditorState.focusedEntry = path;
    CodeEditorState.focusedEntryType = "file";
    CodeEditorState.reveal = { line, column };
}