export const COSTUME_FORMATS = ["svg", "png", "jpg", "jpeg", "bmp", "gif"] as const;
export const SOUND_FORMATS = ["wav", "mp3"] as const;

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

    renameEntryPath: string | null;
    renameEntryName: string | null;

    /** Set to jump the editor to a position; the editor clears it once applied. */
    reveal: { line: number; column: number } | null;
}

export interface TerminalLine {
    text: string;
    kind: "log" | "warning" | "error";
    location?: { path: string; line: number; column: number };
}

export interface ContextMenuState {
    x: number;
    y: number;

    // entry === null means the menu is closed; parent === null means it is the root,
    // which cannot be deleted.
    entry: FilesystemEntry | null;
    parent: FilesystemDirectory | null;
}
