import { CodeEditorState, findEntry, StageState, TerminalContent } from "./state.svelte";
import { compilePath } from "./compile";
import { settings } from "./settings.svelte";

function prettifyDate(date: Date): string {
    return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
    
}

export function compile() {
    const main = settings().compilation === "main" && findEntry("/main.knip")?.entry.type === "file";
    const path = main ? "/main.knip" : CodeEditorState.currentFile;
    if (path === null) return;

    const result = compilePath(path);
    if (!result) return;

    if (!result) {
        TerminalContent.push({
            text: `Nothing to compile: ${path} is not a .knip file`,
            kind: "error",
        });
        return;
    }

    let timeString: string = prettifyDate(new Date());
    TerminalContent.push({ text: `-- Compile started at ${timeString} --`, kind: "log" });
    for (const e of result.errors) {
        TerminalContent.push({
            text: `${e.source}: ${e.message}`,
            kind: e.severity,
            location: e.location && { path, line: e.location.line, column: e.location.column },
        });
    }
    timeString = prettifyDate(new Date());
    TerminalContent.push({ text: `-- Compile ended at ${timeString} --`, kind: "log" });

    if (result.sb3) StageState.sb3 = result.sb3;
}
