<script lang="ts">
    import Play from "@lucide/svelte/icons/play";
    import Book from "@lucide/svelte/icons/book";
    import Download from "@lucide/svelte/icons/download";
    import FolderOpen from "@lucide/svelte/icons/folder-open";
    import logo from "../../assets/logo.svg";
    import "../../css/topbar.css";
    import { Project } from "../../ts/state.svelte";
    import { compile } from "../../ts/actions.svelte";
    import { exportProject, importProject } from "../../ts/package";

    let importInput: HTMLInputElement;

    async function onImport() {
        const f = importInput.files?.[0];
        if (f) importProject(f.name, new Uint8Array(await f.arrayBuffer()));
        importInput.value = "";
    }
</script>

<div class="topbar">
    <div class="l">
        <img src={logo} alt="Katnip Logo" width="30" height="30" />
        <p>Katnip</p>
        <input class="projectName" bind:value={Project.name}>
    </div>
    <div class="compile">
        <button onclick={() => importInput.click()} title="Import .kpkg">
            <FolderOpen size=16 />
            Import
        </button>
        <input type="file" accept=".kpkg" hidden bind:this={importInput} onchange={onImport}>
        <button onclick={exportProject} title="Export .kpkg">
            <Download size=16 />
            Export
        </button>
        <a href="https://docs.katnip.org" target="_blank" rel="noopener noreferrer" title="docs">
            <Book size=16 />
            Docs
        </a>
        <button onclick={compile} title="Compile">
            <Play size=16/>
            Compile
        </button>
    </div>
</div>