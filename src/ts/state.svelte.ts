import type { Scaffolding } from "@turbowarp/scaffolding";
import type { ProjectConfig, EditorState, ContextMenuState, FilesystemEntry, FilesystemDirectory } from "./types";

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

/** Adds or replaces a file at the FS root. Bytes that are valid UTF-8 are stored as text. */
export function uploadFile(name: string, bytes: Uint8Array) {
    let content: string | Uint8Array = bytes;
    try { content = new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch {}

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
    renameEntryName: null
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

    const moved = (p: string | null | undefined) =>
        p === oldPath ? path : p?.startsWith(`${oldPath}/`) ? path + p.slice(oldPath.length) : p;
    CodeEditorState.currentFile = moved(CodeEditorState.currentFile) ?? null;
    CodeEditorState.focusedEntry = moved(CodeEditorState.focusedEntry) ?? undefined;
}

export function cancelCreate() {
    CodeEditorState.createEntryPath = null;
    CodeEditorState.createEntryName = null;
    CodeEditorState.createEntryType = null;
}

export const StageState: {
    sb3: Uint8Array | null;
    scaffolding: Scaffolding | null;
    hasCompiled: boolean;
} = $state({ sb3: null, scaffolding: null, hasCompiled: false });

export const TerminalContent: Array<{ text: string; kind: "log" | "warning" | "error" }> = $state([]);