import { compileToSb3, type AssetReader, type ImportResolver } from "@katnip-org/compiler";
import { Project, ProjectContent } from "./state.svelte";
import type { FilesystemEntry, FilesystemFile } from "./types";

function lookup(path: string): FilesystemFile | null {
    let node: FilesystemEntry = Project.files;
    for (const seg of path.split("/").filter(Boolean)) {
        if (node.type !== "directory") return null;
        node = node.files[seg];
        if (!node) return null;
    }
    return node.type === "file" ? node : null;
}

function text(c: string | Uint8Array): string {
    return typeof c === "string" ? c : new TextDecoder().decode(c);
}
function bytes(c: string | Uint8Array): Uint8Array {
    return typeof c === "string" ? new TextEncoder().encode(c) : c;
}

function resolvePath(specifier: string, fromPath: string) {
    // Bare specifiers are sibling-relative: "foo.knip" from /a/b.knip is /a/foo.knip, not /foo.knip
    const relative = /^[./]/.test(specifier) ? specifier : `./${specifier}`;
    return new URL(relative, `file://${fromPath}`).pathname;
}

const resolve: ImportResolver = (specifier, fromPath) => {
    const path = resolvePath(specifier, fromPath);
    const file = lookup(path);
    return file ? { path, source: text(ProjectContent[file.contentIdx]) } : null;
}

const readAsset: AssetReader = (specifier, fromPath) => {
    const file = lookup(resolvePath(specifier, fromPath));
    return file ? bytes(ProjectContent[file.contentIdx]) : null;
}

/** Shared by the compile button and editor diagnostics so both see the same imports/assets. */
export function compilerOptions(path: string) {
    return { path, resolve, readAsset };
}

export function compile(entry: FilesystemFile) {
    return compileToSb3(text(ProjectContent[entry.contentIdx]), compilerOptions(entry.path));
}

export function compilePath(path: string) {
    if (!path.endsWith(".knip")) return null;

    const entry = lookup(path);
    return entry ? compile(entry) : null;
}