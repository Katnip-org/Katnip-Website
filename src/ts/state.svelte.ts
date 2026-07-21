import type { ProjectConfig, EditorState } from "./types";

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
                content: 0
            },
            "thing.json": {
                type: "file",
                name: "thing.json",
                path: "/thing.json",
                content: 1
            }
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

export const CodeEditorState: EditorState = $state({
    currentFile: null,
    currentFileContent: null,
    createEntryName: null,
    createEntryType: null,
    createEntryPath: null
});