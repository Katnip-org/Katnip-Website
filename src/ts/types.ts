export interface ProjectConfig {
    name: string;
    files: FilesystemDirectory;
}

export interface FilesystemDirectory {
    name: string;
    path: string;

    type: "directory";
    files: Record<string, FilesystemEntry>;
}

export interface FilesystemFile {
    name: string;
    path: string;

    type: "file";
    contentIdx: number;
}

export type FilesystemEntry = FilesystemDirectory | FilesystemFile;

export interface EditorState {
    currentFile: string | null;
    currentFileContent: number | null;

    focusedEntry?: string;
    focusedEntryType?: "file" | "directory";

    createEntryType: "file" | "directory" | null;
    createEntryName: string | null;
    createEntryPath: string | null;
}

export interface ContextMenuState {
    x: number;
    y: number;

    // entry === null means the menu is closed; parent === null means it is the root,
    // which cannot be deleted.
    entry: FilesystemEntry | null;
    parent: FilesystemDirectory | null;
}
