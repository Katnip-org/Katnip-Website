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
    content: number;
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