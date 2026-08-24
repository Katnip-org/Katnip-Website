<script lang="ts">
    import { onMount } from "svelte";
    import { cancelCreate, CodeEditorState, openContextMenu, ProjectContent } from "../../ts/state.svelte";
    import type { FilesystemDirectory, FilesystemEntry } from "../../ts/types";
    import FSEntry from "./FSEntry.svelte";
    import ChevronDown from "@lucide/svelte/icons/chevron-down";
    import ChevronRight from "@lucide/svelte/icons/chevron-right";
    import FileIcon from "@lucide/svelte/icons/file"

    let { entry, parent, open = false, nested }: { entry: FilesystemEntry, parent?: FilesystemDirectory, open?: boolean, nested: number } = $props();

    let self: HTMLDivElement;

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

    function contextMenu(ev: MouseEvent) {
        ev.preventDefault();
        // Keep this from reaching the window handler that closes the menu.
        ev.stopPropagation();
        openContextMenu(ev.clientX, ev.clientY, entry, parent ?? null);
    }

</script>

<div class={"entry" + (CodeEditorState.focusedEntry === entry.path && entry.path !== "/" ? " focused" : "")}>
    <div class="info" bind:this={self} oncontextmenu={contextMenu} role="presentation" style={`margin-left: ${nested * 4}px`}>
        {#if entry.type === "file"}
            <FileIcon size={14} color="var(--text-gray)" />
        {/if}
        <p>{entry.name}</p>
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
                        <input bind:value={CodeEditorState.createEntryName} onkeydown={tempInputKeyEv}>
                    </div>
                </div>
            {/if}
            {#each Object.values(entry.files) as file (file.path)}
                <FSEntry entry={file} parent={entry} nested={nested+1} />
            {/each}
        </div>
    {/if}
</div>