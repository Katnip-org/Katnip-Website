<!--
Right-click menu for the file tree.

Adapted from a Svelte 3 REPL context menu by Github @dukenmarga (July 2022):
https://svelte.dev/repl/3a33725c3adb4f57b46b597f9dade0c1?version=3.25.0
and from
https://svelte.dev/playground/6fb90919e24942b2b47d9ad154386b0c?version=3.49.0

Only one of these is mounted (in FileManager). 
FSEntry opens it through the shared ContextMenu state rather than each row owning a menu of its own.
-->
<script lang="ts">
    import FilePlusCorner from "@lucide/svelte/icons/file-plus-corner";
    import FolderPlus from "@lucide/svelte/icons/folder-plus";
    import Trash2 from "@lucide/svelte/icons/trash-2";

    import { beginCreate, closeContextMenu, CodeEditorState, ContextMenu } from "../../ts/state.svelte";
    import "../../css/contextmenu.css";

    let menu: HTMLElement | undefined = $state();

    $effect(() => {
        const { x, y, entry } = ContextMenu;
        if (!menu || !entry) return;

        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) ContextMenu.x = Math.max(0, x - rect.width);
        if (rect.bottom > window.innerHeight) ContextMenu.y = Math.max(0, y - rect.height);
    });

    function create(type: "file" | "directory") {
        const entry = ContextMenu.entry!;
        
        const dir = entry.type === "directory" ? entry : ContextMenu.parent;
        if (dir) beginCreate(type, dir.path);
    }

    function remove() {
        const entry = ContextMenu.entry!;
        const parent = ContextMenu.parent;
        if (!parent) return; // root

        delete parent.files[entry.name];

        const open = CodeEditorState.currentFile;
        if (open === entry.path || open?.startsWith(`${entry.path}/`)) {
            CodeEditorState.currentFile = null;
            CodeEditorState.currentFileContent = null;
        }
        if (CodeEditorState.focusedEntry === entry.path) {
            CodeEditorState.focusedEntry = undefined;
            CodeEditorState.focusedEntryType = undefined;
        }
    }
</script>

{#if ContextMenu.entry}
    <nav class="contextMenu" bind:this={menu} style="top: {ContextMenu.y}px; left: {ContextMenu.x}px">
        <button onclick={() => create("file")}>
            <FilePlusCorner size={14} /> New File
        </button>
        <button onclick={() => create("directory")}>
            <FolderPlus size={14} /> New Folder
        </button>
        {#if ContextMenu.parent}
            <hr>
            <button class="danger" onclick={remove}>
                <Trash2 size={14} /> Delete
            </button>
        {/if}
    </nav>
{/if}

<svelte:window
    onclick={closeContextMenu}
    oncontextmenu={closeContextMenu}
    onkeydown={(e) => { if (e.key === "Escape") closeContextMenu(); }}
/>
