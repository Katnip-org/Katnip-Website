<script lang="ts">
    import { onMount } from "svelte";
    import { cancelCreate, cancelRename, CodeEditorState, moveEntry, openContextMenu, ProjectContent, renameEntry } from "../../ts/state.svelte";
    import { COSTUME_FORMATS, SOUND_FORMATS, type FilesystemDirectory, type FilesystemEntry } from "../../ts/types";
    import FSEntry from "./FSEntry.svelte";
    import ChevronDown from "@lucide/svelte/icons/chevron-down";
    import ChevronRight from "@lucide/svelte/icons/chevron-right";
    import FileIcon from "@lucide/svelte/icons/file";
    import ImageIcon from "@lucide/svelte/icons/image";
    import MusicIcon from "@lucide/svelte/icons/music";

    let { entry, parent, open = false, nested }: { entry: FilesystemEntry, parent?: FilesystemDirectory, open?: boolean, nested: number } = $props();

    let self: HTMLDivElement;
    let dropTarget = $state(false);
    const dropDir = $derived(entry.type === "directory" ? entry : parent);

    const ext = $derived(entry.name.split(".").pop()?.toLowerCase() ?? "");
    const Icon = $derived(
        (COSTUME_FORMATS as readonly string[]).includes(ext) ? ImageIcon
        : (SOUND_FORMATS as readonly string[]).includes(ext) ? MusicIcon
        : FileIcon
    );

    $effect(() => {
        if (CodeEditorState.createEntryPath === entry.path) open = true;
    });

    onMount(() => {
        self.addEventListener("click", () => {
            CodeEditorState.focusedEntry = entry.path;
            CodeEditorState.focusedEntryType = entry.type;

            if (entry.type == "directory") {
                open = !open;
            } else {
                CodeEditorState.currentFile = entry.path;
                CodeEditorState.currentFileContent = entry.contentIdx;
            }
        })
    });

    function tempInputKeyEv(ev: KeyboardEvent) {
        if (ev.key === "Escape") return cancelCreate();
        if (ev.key !== "Enter") return;

        const name = (CodeEditorState.createEntryName || "").trim();
        if (name.length < 1) return;
        ev.preventDefault();

        if (entry.type !== "directory") {
            throw new Error("todo: implement");
        }

        if (entry.files[name]) return;

        const base = entry.path === "/" ? "" : entry.path;
        const path = `${base}/${name}`;
        const type = CodeEditorState.createEntryType;

        if (type === "file") {
            const contentIdx = ProjectContent.push("") - 1;
            entry.files[name] = { type: "file", name, path, contentIdx };

            CodeEditorState.currentFile = path;
            CodeEditorState.currentFileContent = contentIdx;
        } else {
            entry.files[name] = { type: "directory", name, path, files: {} };
        }

        CodeEditorState.focusedEntry = path;
        CodeEditorState.focusedEntryType = type!;
        cancelCreate();
    }

    function renameKeyEv(ev: KeyboardEvent) {
        if (ev.key === "Escape") return cancelRename();
        if (ev.key !== "Enter") return;
        ev.preventDefault();
        if (parent) renameEntry(entry, parent, CodeEditorState.renameEntryName ?? "");
        cancelRename();
    }

    function dragStart(ev: DragEvent) {
        ev.stopPropagation();
        ev.dataTransfer?.setData("text/plain", entry.path);
    }

    function dragOver(ev: DragEvent) {
        if (!dropDir || !ev.dataTransfer?.types.includes("text/plain")) return;
        ev.preventDefault();
        ev.stopPropagation();
        dropTarget = true;
    }

    function drop(ev: DragEvent) {
        dropTarget = false;
        const src = ev.dataTransfer?.getData("text/plain");
        if (!dropDir || !src) return;
        ev.preventDefault();
        ev.stopPropagation();
        moveEntry(src, dropDir);
        if (entry.type === "directory") open = true;
    }

    function contextMenu(ev: MouseEvent) {
        ev.preventDefault();
        // Keep this from reaching the window handler that closes the menu.
        ev.stopPropagation();
        openContextMenu(ev.clientX, ev.clientY, entry, parent ?? null);
    }

</script>

<div class={"entry" + (CodeEditorState.focusedEntry === entry.path && entry.path !== "/" ? " focused" : "") + (dropTarget ? " dropTarget" : "")}>
    <div class="info" bind:this={self} oncontextmenu={contextMenu} role="presentation" style={`margin-left: ${nested * 4}px`}
        draggable={entry.path !== "/"} ondragstart={dragStart}
        ondragover={dragOver} ondragleave={() => dropTarget = false} ondrop={drop}>
        {#if entry.type === "file"}
            <Icon size={14} color="var(--text-gray)" />
        {/if}
        {#if CodeEditorState.renameEntryPath === entry.path}
            <input
                bind:value={CodeEditorState.renameEntryName}
                onkeydown={renameKeyEv}
                onblur={cancelRename}
                onclick={(e) => e.stopPropagation()}
                {@attach (el) => { el.focus(); el.select(); }}
            >
        {:else}
            <p title={entry.name}>{entry.name}</p>
        {/if}
        {#if entry.type === "directory"}
            {#if open}
                <ChevronDown size={12} class="collapse" />
            {:else}
                <ChevronRight size={12} class="collapse" />
            {/if}
        {/if}
    </div>

    {#if entry.type === "directory" && open}
        <div class="children" style={`margin-left: ${nested * 4}px`}>
            {#if CodeEditorState.createEntryPath === entry.path}
                <div class="entry temp" style={`margin-left: ${(nested + 1) * 4}px`}>
                    <div class="info">
                        {#if CodeEditorState.createEntryType === "file"}
                            <FileIcon size={14} color="var(--text-gray)" />
                        {:else}
                            <ChevronRight size={12} class="collapse" />
                        {/if}
                        <input
                            bind:value={CodeEditorState.createEntryName}
                            onkeydown={tempInputKeyEv}
                            onblur={cancelCreate}
                            {@attach (el) => el.focus()}
                        >
                    </div>
                </div>
            {/if}
            {#each Object.values(entry.files) as file (file.path)}
                <FSEntry entry={file} parent={entry} nested={nested+1} />
            {/each}
        </div>
    {/if}
</div>