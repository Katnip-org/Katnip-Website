import type { Scaffolding } from "@turbowarp/scaffolding";
import type {
    ProjectConfig,
    EditorState,
    ContextMenuState,
    FilesystemEntry,
    FilesystemDirectory,
    TerminalLine,
} from "./types";

export const Project: ProjectConfig = $state({
    name: "My Project",
    files: {
        type: "directory",
        name: "/",
        path: "/",
        files: {
            "readme.md": {
                type: "file",
                name: "readme.md",
                path: "/readme.md",
                contentIdx: 0,
            },
            "main.knip": {
                type: "file",
                name: "main.knip",
                path: "/main.knip",
                contentIdx: 1,
            },
            "settings.toml": {
                type: "file",
                name: "settings.toml",
                path: "/settings.toml",
                contentIdx: 2,
            },
            assets: {
                type: "directory",
                name: "assets",
                path: "/assets",
                files: {
                    "placeholder.png": {
                        type: "file",
                        name: "placeholder.png",
                        path: "/assets/placeholder.png",
                        contentIdx: 3,
                    },
                },
            },
            data: {
                type: "directory",
                name: "data",
                path: "/data",
                files: {
                    "config.json": {
                        type: "file",
                        name: "config.json",
                        path: "/data/config.json",
                        contentIdx: 4,
                    },
                },
            },
        },
    },
});

export const ProjectContent: Array<string | Uint8Array> = $state([]);

/** Bytes that are valid UTF-8 become text; anything else stays binary. */
export function bytesToContent(bytes: Uint8Array): string | Uint8Array {
    try {
        return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
        return bytes;
    }
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
ProjectContent[0] = `This is a Katnip project.
Edit main.knip and press the green flag to run it.
`;
ProjectContent[1] = `public score: num = 0;

proc award(points: num) -> void {
    score += points;
}

sprite Cat {
    costume "./assets/placeholder.png";

    private config: dict<str, str | num> = import("./data/config.json");

    events.onFlag() {
        looks.say(Str(config["greeting"]), Num(config["greetingSeconds"]));

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
ProjectContent[2] = `# Katnip compilation settings

# --- Web-Editor Options ---

# Decide how the web editor submits your project for compilation
# "open-editor" -> Send my current file and any imported files
# "main" -> Search for a file named "main.knip", fallback to "open-editor"
compilation = "open-editor" # enum: (open-editor, main)

# Enable / Disable Turbo mode
# True -> Enabled; everything runs as fast as possible
# False -> Disabled; everything runs 'normally'
turboMode = false # enum: (true, false)


# --- Compiler Options ---

# Decide what level of compression the internal ZIP'ing tool uses
# 1..9 -> Lower = faster but bigger zip file; Higher = slower but smaller zip file
compression = 6 # type: int[1..9]


# --- Scaffolding Options ---

# Draw pen lines at your screen's resolution instead of the stage's
highQualityPen = false # enum: (true, false)

# How many times per second scripts run
framerate = 30 # type: int[1..250]

# Smooth motion between frames
interpolation = false # enum: (true, false)

# Keep sprites from moving fully off the stage
fencing = true # enum: (true, false)

# Keep Scratch's limits on things like pen size, costume effects and simultaneous sounds
miscLimits = true # enum: (true, false)

# How many clones can exist at once
maxClones = 300 # type: int[1..]
`;
ProjectContent[3] = Uint8Array.from(
    atob(
        "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAIAAADYYG7QAAAAUUlEQVR42u3WsQ0AIAgEQNZwXddxH9fRBaA0FlxCScJVz8fZM5818nm8H0BAQP1Anw5X+0BAQA1BkhoICEgf8jqAgPQhSQ0EBKQPeR1AQJ1BF4Vldg+3ULQhAAAAAElFTkSuQmCC",
    ),
    c => c.charCodeAt(0),
);
ProjectContent[4] = `{
    "greeting": "Hello from data/config.json!",
    "greetingSeconds": 2
}
`;

export const CodeEditorState: EditorState = $state({
    currentFile: "/main.knip",
    currentFileContent: 1,
    focusedEntry: "/main.knip",
    focusedEntryType: "file",
    createEntryName: null,
    createEntryType: null,
    createEntryPath: null,
    renameEntryPath: null,
    renameEntryName: null,
    reveal: null,
});

export const ContextMenu: ContextMenuState = $state({
    x: 0,
    y: 0,
    entry: null,
    parent: null,
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
        Object.entries(parent.files).map(([k, v]) => (k === entry.name ? [name, v] : [k, v])),
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
