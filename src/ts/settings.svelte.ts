import { findEntry, ProjectContent, uploadFile } from "./state.svelte";

const PATH = "/settings.toml";

const DEFAULTS = {
    compilation: "open-editor" as "open-editor" | "main",
    turboMode: false,
    compression: 6,
    highQualityPen: false,
    framerate: 30,
    interpolation: false,
    fencing: true,
    miscLimits: true,
    maxClones: 300,
};
export type Settings = typeof DEFAULTS;

// Basic regex is simpler than full toml unless I need more later like arrays or something
const VALUE = String.raw`("[^"]*"|true|false|-?\d+)`;
const LINE = new RegExp(String.raw`^\s*(\w+)\s*=\s*` + VALUE);

function contentIdx(): number | null {
    const found = findEntry(PATH);
    return found?.entry.type === "file" ? found.entry.contentIdx : null;
}

function source(): string {
    const i = contentIdx();
    const c = i === null ? "" : ProjectContent[i];
    return typeof c === "string" ? c : "";
}

function literal(value: string | number | boolean) {
    return typeof value === "string" ? `"${value}"` : String(value);
}

/** Missing file, missing key or a value the field can't hold all fall back to the default. */
export function settings(): Settings {
    const out = { ...DEFAULTS };
    for (const line of source().split("\n")) {
        const m = LINE.exec(line);
        if (!m || !(m[1] in out)) continue;
        const v = m[2];
        const parsed = v[0] === '"' ? v.slice(1, -1) : v === "true" ? true : v === "false" ? false : +v;
        if (typeof parsed === typeof DEFAULTS[m[1] as keyof Settings]) (out as any)[m[1]] = parsed;
    }
    if (out.compilation !== "main") out.compilation = "open-editor";
    out.compression = Math.min(9, Math.max(1, out.compression));
    out.framerate = Math.min(250, Math.max(1, out.framerate));
    out.maxClones = Math.max(1, out.maxClones);
    return out;
}

/** Writes one key back into settings.toml, keeping comments and layout intact. */
export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    const found = findEntry(PATH);
    if (found && found.entry.type !== "file") return; // something else owns the name

    const src = source();
    const line = new RegExp(String.raw`^(\s*${key}\s*=\s*)` + VALUE, "m");
    const next = line.test(src)
        ? src.replace(line, `$1${literal(value)}`)
        : `${src ? `${src.trimEnd()}\n` : ""}${key} = ${literal(value)}\n`;

    const i = contentIdx();
    if (i === null) uploadFile(PATH.slice(1), new TextEncoder().encode(next));
    else ProjectContent[i] = next;
}
