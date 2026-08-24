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
                contentIdx: 0
            },
            "thing.json": {
                type: "file",
                name: "thing.json",
                path: "/thing.json",
                contentIdx: 1
            },
            "test.knip": {
                type: "file",
                name: "test.knip",
                path: "/test.knip",
                contentIdx: 2
            },
        }
    }
});

export const ProjectContent: Array<string> = $state([]);
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

export const CodeEditorState: EditorState = $state({
    currentFile: null,
    currentFileContent: null,
    createEntryName: null,
    createEntryType: null,
    createEntryPath: null
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

export function cancelCreate() {
    CodeEditorState.createEntryPath = null;
    CodeEditorState.createEntryName = null;
    CodeEditorState.createEntryType = null;
}
