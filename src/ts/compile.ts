import { compileToSb3, type ImportResolver } from "@katnip-org/compiler";
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

const resolve: ImportResolver = (specifier, fromPath) => {
    // Bare specifiers are sibling-relative: "foo.knip" from /a/b.knip is /a/foo.knip, not /foo.knip
    const relative = /^[./]/.test(specifier) ? specifier : `./${specifier}`;
    const path = new URL(relative, `file://${fromPath}`).pathname;
    const file = lookup(path);
    return file ? { path, source: ProjectContent[file.contentIdx] } : null;
}

export function compile(entry: FilesystemFile) {
    return compileToSb3(ProjectContent[entry.contentIdx], { path: entry.path, resolve });
}

export function compilePath(path: string) {
    if (!path.endsWith(".knip")) return null;

    const entry = lookup(path);
    return entry ? compile(entry) : null;
}