<script lang="ts">
    import Play from "@lucide/svelte/icons/play"
    import "../../css/topbar.css";
    import { CodeEditorState, Project, StageState } from "../../ts/state.svelte";
    import { compilePath } from "../../ts/compile";

    function run() {
        const path = CodeEditorState.currentFile;
        const result = path === null ? null : compilePath(path);
        if (!result) return;

        // TODO: Do a real terminal
        for (const e of result.errors) {
            console[e.severity === "error" ? "error" : "warn"](`${e.source}: ${e.message}`);
        }

        if (result.sb3) StageState.sb3 = result.sb3;
    }
</script>

<div class="topbar">
    <div class="l">
        <img src="/src/assets/logo.svg" alt="Katnip Logo" width="30" height="30" />
        <p>Katnip</p>
        <input class="projectName" bind:value={Project.name}>
    </div>
    <div class="r">
        <button onclick={run} title="Run">
            <Play size=16/>
            Run
        </button>
    </div>
</div>