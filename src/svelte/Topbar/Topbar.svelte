<script lang="ts">
    import Book from "@lucide/svelte/icons/book";
    import Download from "@lucide/svelte/icons/download";
    import Upload from "@lucide/svelte/icons/upload";
    import Menu from "@lucide/svelte/icons/menu";
    import logo from "../../assets/logo.svg";
    import "../../css/topbar.css";
    import "../../css/contextmenu.css";
    import { Project } from "../../ts/state.svelte";
    import { exportProject, importProject } from "../../ts/package";

    let importInput: HTMLInputElement;
    let menuOpen = $state(false);

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
    <div class="r">
        <input type="file" accept=".kpkg" hidden bind:this={importInput} onchange={onImport}>
        <a href="https://docs.katnip.org" target="_blank" rel="noopener noreferrer" title="Docs">
            <Book size=18 />
            Docs
        </a>
        <button onclick={(e) => { e.stopPropagation(); menuOpen = !menuOpen; }} title="Project">
            <Menu size=18 />
        </button>
        {#if menuOpen}
            <nav class="contextMenu" style="top: var(--topbar-size); right: var(--padding-min)">
                <button onclick={() => importInput.click()}><Upload size={14} /> Import</button>
                <button onclick={exportProject}><Download size={14} /> Export</button>
            </nav>
        {/if}
    </div>
</div>

<svelte:window
    onclick={() => menuOpen = false}
    onkeydowncapture={(e) => {
        if (!e.ctrlKey || e.altKey || e.shiftKey) return;
        const action = { s: exportProject, i: () => importInput.click() }[e.key.toLowerCase()];
        if (!action) return;
        e.preventDefault();
        action();
    }}
/>
