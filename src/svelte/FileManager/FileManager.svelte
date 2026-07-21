<script lang="ts">
    import ResizeHandle from "./ResizeHandle.svelte";
    import FilePlusCorner from "@lucide/svelte/icons/file-plus-corner";
    import FolderPlus from "@lucide/svelte/icons/folder-plus";
    import "../../css/filemanager.css";
    import { onMount } from "svelte";
    import { CodeEditorState, Project, ProjectContent } from "../../ts/state.svelte";
    import FSEntry from "./FSEntry.svelte";

    let fm: HTMLDivElement;
    let focused: boolean = $state(false);

    onMount(() => {
        fm.addEventListener("mouseenter", () => {
            focused = true;
        });
        fm.addEventListener("mouseleave", () => {
            focused = false;
        })
    });

    function newFile() {
        let path: string;
        if (!CodeEditorState.focusedEntry) {
            CodeEditorState.focusedEntry = "/";
            CodeEditorState.focusedEntryType = "directory";
        }

        if (CodeEditorState.focusedEntryType == "file") {
            const parts = CodeEditorState.focusedEntry.split("/");
            path = parts.slice(0, -1).join("/");
        } else {
            path = CodeEditorState.focusedEntry
        }
        CodeEditorState.createEntryPath = path;
        CodeEditorState.createEntryName = "";
        CodeEditorState.createEntryType = "file";
    }
</script>

<div class="fileManager" bind:this={fm}>
    <ResizeHandle />
    <div class="options">
        <div class="l">
            <b>Files</b>
        </div>
        <div class="r">
            {#if focused}
                <FilePlusCorner class="newFile" size=16 onclick={newFile} />
                <FolderPlus class="newFolder" size=16 onclick={() => {}} />
            {/if}
        </div>
    </div>
    <div class="files">
        <FSEntry entry={Project.files} nested={0} open />
    </div>
</div>