import { unzipSync, zipSync } from "fflate";
import { Writer, Project as SCSFProject } from "@flufi/scsf";
import { bytesToContent, CodeEditorState, Project, ProjectContent, StageState } from "./state.svelte";
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

/** Every file in the project as zip entries. */
export function snapshot() {
    const files: Record<string, Uint8Array> = {};
    collect(Project.files, files);
    return files;
}

export function exportProject() {
    const blob = new Blob([zipSync(snapshot())], { type: "application/zip" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${Project.name.trim() || "project"}${EXT}`;
    a.click();
    URL.revokeObjectURL(a.href);
}

export function exportSB3() {
    const data = StageState.sb3;
    if (!data) return;
    const blob = new Blob([data as BlobPart], { type: "application/zip" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${Project.name.trim() || "project"}.sb3`;
    a.click();
    URL.revokeObjectURL(a.href);
}

export function exportSCSF() {
    const data = StageState.sb3;
    if (!data) return;
    const unzipped: Record<string, Uint8Array<ArrayBufferLike>> = unzipSync(data);
    const projectJSONBytes = unzipped["project.json"];
    if (!projectJSONBytes) return;

    delete unzipped["project.json"];
    const JSONObject = JSON.parse(new TextDecoder("utf-8").decode(projectJSONBytes));
    JSONObject.meta.agent ??= "";
    // SCSF also requires rotation centers, which the compiler omits for imported bitmaps
    // Scratch centers those, so do the same: PNG width/height live at bytes 16..23 (IHDR)
    for (const target of JSONObject.targets) {
        for (const costume of target.costumes) {
            if (typeof costume.rotationCenterX === "number" && typeof costume.rotationCenterY === "number") continue;
            const img = unzipped[costume.md5ext];
            const png = costume.dataFormat === "png" && img?.length >= 24;
            const view = png ? new DataView(img.buffer, img.byteOffset, img.byteLength) : null;
            costume.rotationCenterX ??= view ? view.getUint32(16) / 2 : 0;
            costume.rotationCenterY ??= view ? view.getUint32(20) / 2 : 0;
        }
    }
    const project = SCSFProject.parseJson(JSONObject);
    const writer = new Writer("binary");
    writer.writeProject(project);
    const scsf = writer.getBytes();

    unzipped["project.scsf"] = scsf as Uint8Array<ArrayBufferLike>;
    const SCSFData = zipSync(unzipped);
    const blob = new Blob([SCSFData as BlobPart], { type: "application/zip" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${Project.name.trim() || "project"}.sb3`;
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
        if (entryName.endsWith("/")) {
            mkdirp(root, segs);
            continue;
        }
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
    StageState.scaffolding?.stopAll();
    StageState.sb3 = null; // belongs to the previous project
}
