<script lang="ts">
    import Play from "@lucide/svelte/icons/play";
    import logo from "../../assets/logo.svg";
    import "../../css/topbar.css";
    import { CodeEditorState, Project, StageState } from "../../ts/state.svelte";
    import { compilePath } from "../../ts/compile";
    import { TerminalContent } from "../../ts/state.svelte";

    function prettifyDate(date: Date): string {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    }

    function compile() {
        const path = CodeEditorState.currentFile;
        const result = path === null ? null : compilePath(path);
        if (!result) return;

        let timeString: string = prettifyDate(new Date());
        TerminalContent.push({ text: `-- Compile started at ${timeString} --`, kind: "log" });
        for (const e of result.errors) {
            e.location
            TerminalContent.push({
                text: `${e.source}${e.location ? ` [ln ${e.location.line}, col ${e.location.column}]` : ""}: ${e.message}`, 
                kind: e.severity 
            });
        }
        timeString = prettifyDate(new Date());
        TerminalContent.push({ text: `-- Compile ended at ${timeString} --`, kind: "log" });

        if (result.sb3) StageState.sb3 = result.sb3;
    }
</script>

<div class="topbar">
    <div class="l">
        <img src={logo} alt="Katnip Logo" width="30" height="30" />
        <p>Katnip</p>
        <input class="projectName" bind:value={Project.name}>
    </div>
    <div class="compile">
        <button onclick={compile} title="Compile">
            <Play size=16/>
            Compile
        </button>
    </div>
</div>