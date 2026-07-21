<script lang="ts">
    import { onMount } from "svelte";
    import { CodeEditorState, Project, ProjectContent } from "../../ts/state.svelte";
    import type { FilesystemEntry } from "../../ts/types";
    import FSEntry from "./FSEntry.svelte";
    import ChevronDown from "@lucide/svelte/icons/chevron-down";
    import ChevronRight from "@lucide/svelte/icons/chevron-right";
    import FileIcon from "@lucide/svelte/icons/file"

    let { entry, open = false, nested }: { entry: FilesystemEntry, open?: boolean, nested: number } = $props();

    let self: HTMLDivElement;
    let lastClick: number = 0;

    onMount(() => {
        self.addEventListener("click", () => {
            CodeEditorState.focusedEntry = entry.path;
            CodeEditorState.focusedEntryType = entry.type;

            if (entry.type == "directory") {
                open = !open;
            } else {
                if (Date.now() - lastClick < 300) {
                    CodeEditorState.currentFile = entry.path;
                    CodeEditorState.currentFileContent = entry.content;
                }
                lastClick = Date.now();
            }
        })
    });

    function tempInputKeyEv(ev: KeyboardEvent & { currentTarget: HTMLElement }) {
        if (ev.key === "Enter") {
            if ((CodeEditorState.createEntryName || "").trim().length < 1) return;
            ev.preventDefault();

            if (entry.type !== "directory") {
                throw new Error("todo: implement");
            }

            if (CodeEditorState.createEntryType === "file") {
                ProjectContent.push("")

                const path = entry.path === "/" ? "" : entry.path;

                entry.files[CodeEditorState.createEntryName || ""] = {
                    type: "file",
                    name: CodeEditorState.createEntryName!,
                    path: `${path}/${CodeEditorState.createEntryName}`,
                    content: ProjectContent.length
                }

                CodeEditorState.focusedEntry = `${path}/${CodeEditorState.createEntryName}`; 
                CodeEditorState.focusedEntryType = "file";
                CodeEditorState.currentFile = `${path}/${CodeEditorState.createEntryName}`; 
                CodeEditorState.currentFileContent = ProjectContent.length;
                CodeEditorState.createEntryName = null;
                CodeEditorState.createEntryPath = null;
                CodeEditorState.createEntryType = null;
            }
        }
    }
</script>

<div class={"entry" + (CodeEditorState.focusedEntry === entry.path && entry.path !== "/" ? " focused" : "")}>
    <div class="info" bind:this={self} style={`margin-left: ${nested * 4}px`}>
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
                        {#if CodeEditorState.createEntryType == "file"}
                            <FileIcon size={14} color="var(--text-gray)" />
                        {/if}
                        <input bind:value={CodeEditorState.createEntryName} onkeydown={tempInputKeyEv}>
                    </div>
                </div>
            {/if}
            {#each Object.values(entry.files) as file (file.path)}
                <FSEntry entry={file} nested={nested+1} />
            {/each}
        </div>
    {/if}
</div>