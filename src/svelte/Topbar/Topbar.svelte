<script lang="ts">
    import Book from "@lucide/svelte/icons/book";
    import Download from "@lucide/svelte/icons/download";
    import Upload from "@lucide/svelte/icons/upload";
    import File_Pen from "@lucide/svelte/icons/file-pen";
    import Cat from "@lucide/svelte/icons/cat";
    import Binary from "@lucide/svelte/icons/binary";
    import Plus from "@lucide/svelte/icons/plus";
    import Settings from "@lucide/svelte/icons/settings";
    import Trash from "@lucide/svelte/icons/trash";
    import logo from "../../assets/logo.svg";
    import "../../css/topbar.css";
    import "../../css/contextmenu.css";
    import { Project } from "../../ts/state.svelte";
    import { exportProject, exportSB3, exportSCSF } from "../../ts/package";
    import { deleteProject, importAsNewProject, isCurrent, listProjects, newProject, openProject, type SavedProject } from "../../ts/projects.svelte";
    import { settings, setSetting } from "../../ts/settings.svelte";

    let importInput: HTMLInputElement;
    let openMenu = $state<"file" | "settings" | null>(null);
    let current = $derived(settings());
    let projects = $state.raw<SavedProject[]>([]);

    async function refreshProjects() {
        projects = await listProjects().catch(() => []);
    }

    function toggle(menu: "file" | "settings", e: MouseEvent) {
        e.stopPropagation();
        openMenu = openMenu === menu ? null : menu;
        if (openMenu === "file") refreshProjects();
    }

    async function onImport() {
        const f = importInput.files?.[0];
        if (f) await importAsNewProject(f.name, new Uint8Array(await f.arrayBuffer()));
        importInput.value = "";
    }

    async function onDelete(project: SavedProject, e: MouseEvent) {
        e.stopPropagation();
        if (!confirm(`Delete "${project.name}"? This can't be undone.`)) return;
        await deleteProject(project.id);
        await refreshProjects();
    }
</script>

<div class="topbar">
    <div class="l">
        <img src={logo} alt="Katnip Logo" width="30" height="30" />
        <p>Katnip</p>
        <hr class="vertical" />
        <div class="menuWrap">
            <button onclick={(e) => toggle("file", e)} title="File">
                <File_Pen size=16 />
                File
            </button>
            {#if openMenu === "file"}
                <nav class="contextMenu">
                    <button onclick={newProject}><Plus size={14} /> New</button>
                    <button onclick={() => importInput.click()}><Upload size={14} /> Import</button>
                    <button onclick={exportProject}><Download size={14} /> Export</button>
                    <hr />
                    <button onclick={exportSB3}><Cat size={14} /> SB3 Export</button>
                    <button onclick={exportSCSF}><Binary size={14} /> SCSF Binary Export</button>
                    {#if projects.length > 0}
                        <hr />
                        <div class="projects">
                            {#each projects as project (project.id)}
                                <div class="project" class:current={isCurrent(project.id)}>
                                    <button class="name" title={project.name} onclick={() => { if (!isCurrent(project.id)) openProject(project); }}>
                                        {isCurrent(project.id) ? Project.name : project.name}
                                    </button>
                                    <button class="danger" title="Delete project" onclick={(e) => onDelete(project, e)}><Trash size={12} /></button>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </nav>
            {/if}
        </div>
        <div class="menuWrap">
            <button onclick={(e) => toggle("settings", e)} title="Settings">
                <Settings size=16 />
                Settings
            </button>
            {#if openMenu === "settings"}
                <nav class="contextMenu" data-keep-open>
                    <label>
                        <input type="checkbox" checked={current.turboMode}
                            onchange={(e) => setSetting("turboMode", e.currentTarget.checked)}>
                        Turbo mode
                    </label>
                    <label>
                        <input type="checkbox" checked={current.compilation === "main"}
                            onchange={(e) => setSetting("compilation", e.currentTarget.checked ? "main" : "open-editor")}>
                        Compile /main.knip
                    </label>
                    <hr />
                    <label>
                        Compression
                        <input type="number" min="1" max="9" value={current.compression}
                            onchange={(e) => setSetting("compression", +e.currentTarget.value)}>
                    </label>
                    <hr />
                    <label>
                        <input type="checkbox" checked={current.highQualityPen}
                            onchange={(e) => setSetting("highQualityPen", e.currentTarget.checked)}>
                        High quality pen
                    </label>
                    <label>
                        <input type="checkbox" checked={current.interpolation}
                            onchange={(e) => setSetting("interpolation", e.currentTarget.checked)}>
                        Interpolation
                    </label>
                    <label>
                        <input type="checkbox" checked={current.fencing}
                            onchange={(e) => setSetting("fencing", e.currentTarget.checked)}>
                        Sprite fencing
                    </label>
                    <label>
                        <input type="checkbox" checked={current.miscLimits}
                            onchange={(e) => setSetting("miscLimits", e.currentTarget.checked)}>
                        Misc limits
                    </label>
                    <label>
                        Framerate
                        <input type="number" min="1" max="250" value={current.framerate}
                            onchange={(e) => setSetting("framerate", +e.currentTarget.value)}>
                    </label>
                    <label>
                        Max clones
                        <input type="number" min="1" value={current.maxClones}
                            onchange={(e) => setSetting("maxClones", +e.currentTarget.value)}>
                    </label>
                </nav>
            {/if}
        </div>
        <hr class="vertical" />
        <input class="projectName" bind:value={Project.name}>
    </div>
    <div class="r">
        <input type="file" accept=".kpkg" hidden bind:this={importInput} onchange={onImport}>
        <a href="https://docs.katnip.org" target="_blank" rel="noopener noreferrer" title="Docs">
            <Book size=16 />
            Docs
        </a>
    </div>
</div>

<svelte:window
    onclick={(e) => {
        if (!(e.target as HTMLElement).closest("[data-keep-open]")) openMenu = null;
    }}
    onkeydowncapture={(e) => {
        if (!e.ctrlKey || e.altKey || e.shiftKey) return;
        const action = { s: exportProject, i: () => importInput.click() }[e.key.toLowerCase()];
        if (!action) return;
        e.preventDefault();
        action();
    }}
/>
