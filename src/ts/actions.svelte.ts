import { CodeEditorState, StageState } from "./state.svelte";
import { compilePath } from "./compile";
import { TerminalContent } from "./state.svelte";

function prettifyDate(date: Date): string {
    return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
    
}

export function compile() {
    const path = CodeEditorState.currentFile;
    if (path === null) return;

    const result = compilePath(path);
    if (!result) return;

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
