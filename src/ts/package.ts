import { unzipSync, zipSync } from "fflate";
import { bytesToContent, CodeEditorState, Project, ProjectContent } from "./state.svelte";
import type { FilesystemDirectory, FilesystemEntry } from "./types";

const EXT = ".kpkg";

function collect(entry: FilesystemEntry, out: Record<string, Uint8Array>) {
    const rel = entry.path.slice(1);
    if (entry.type === "file") {
        const c = ProjectContent[entry.contentIdx];
        out[rel] = typeof c === "string" ? new TextEncoder().encode(c) : c;
        return;
    }
    const children = Object.values(entry.files);
    if (rel && children.length === 0) out[`${rel}/`] = new Uint8Array(0);
    for (const child of children) collect(child, out);
}

export function exportProject() {
    const files: Record<string, Uint8Array> = {};
    collect(Project.files, files);
    const blob = new Blob([zipSync(files)], { type: "application/zip" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${Project.name.trim() || "project"}${EXT}`;
    a.click();
    URL.revokeObjectURL(a.href);
}

function mkdirp(root: FilesystemDirectory, segs: string[]): FilesystemDirectory {
    let dir = root;
    for (const seg of segs) {
        let next = dir.files[seg];
        if (next?.type !== "directory") {
            const base = dir.path === "/" ? "" : dir.path;
            next = dir.files[seg] = { type: "directory", name: seg, path: `${base}/${seg}`, files: {} };
        }
        dir = next;
    }
    return dir;
}

export function importProject(name: string, bytes: Uint8Array) {
    const root: FilesystemDirectory = { type: "directory", name: "/", path: "/", files: {} };
    const content: Array<string | Uint8Array> = [];

    for (const [entryName, data] of Object.entries(unzipSync(bytes))) {
        const segs = entryName.split("/").filter(Boolean);
        if (segs.length === 0) continue;
        if (entryName.endsWith("/")) { mkdirp(root, segs); continue; }
        const fileName = segs.pop()!;
        const dir = mkdirp(root, segs);
        const base = dir.path === "/" ? "" : dir.path;
        const contentIdx = content.push(bytesToContent(data)) - 1;
        dir.files[fileName] = { type: "file", name: fileName, path: `${base}/${fileName}`, contentIdx };
    }

    ProjectContent.length = 0;
    ProjectContent.push(...content);
    Project.files = root;
    Project.name = name.endsWith(EXT) ? name.slice(0, -EXT.length) : name;
    CodeEditorState.currentFile = null;
    CodeEditorState.currentFileContent = null;
    CodeEditorState.focusedEntry = undefined;
    CodeEditorState.focusedEntryType = undefined;
}
