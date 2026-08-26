<script lang="ts">
    import ResizeHandle from "../ResizeHandle.svelte";
    import FilePlusCorner from "@lucide/svelte/icons/file-plus-corner";
    import FolderPlus from "@lucide/svelte/icons/folder-plus";
    import "../../css/filemanager.css";
    import { onMount } from "svelte";
    import { beginCreate, CodeEditorState, Project } from "../../ts/state.svelte";
    import FSEntry from "./FSEntry.svelte";
    import ContextManager from "./ContextManager.svelte";

    let fileManager: HTMLDivElement;
    let focused: boolean = $state(false);

    onMount(() => {
        fileManager.addEventListener("mouseenter", () => {
            focused = true;
        });
        fileManager.addEventListener("mouseleave", () => {
            focused = false;
        })
    });

    function newEntry(type: "file" | "directory") {
        if (!CodeEditorState.focusedEntry) {
            CodeEditorState.focusedEntry = "/";
            CodeEditorState.focusedEntryType = "directory";
        }

        const target = CodeEditorState.focusedEntry;
        const path = CodeEditorState.focusedEntryType === "file"
            ? target.split("/").slice(0, -1).join("/") || "/"
            : target;

        beginCreate(type, path);
    }
</script>

<div class="fileManager" bind:this={fileManager}>
    <ResizeHandle />
    <div class="options">
        <div class="l">
            <b>Files</b>
        </div>
        <div class="r">
            {#if focused}
                <FilePlusCorner class="newFile" size=16 onclick={() => newEntry("file")} />
                <FolderPlus class="newFolder" size=16 onclick={() => newEntry("directory")} />
            {/if}
        </div>
    </div>
    <ContextManager />
    <div class="files">
        <FSEntry entry={Project.files} nested={0} open />
    </div>
</div>