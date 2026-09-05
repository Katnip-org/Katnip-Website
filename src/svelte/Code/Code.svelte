<script lang="ts">
    import Monaco from "./Monaco.svelte";
    import "../../css/code.css";
    import { CodeEditorState, ProjectContent } from "../../ts/state.svelte";

    const content = $derived(ProjectContent[CodeEditorState.currentFileContent ?? -1] ?? "");
</script>
<div class="codeArea">
    {#if CodeEditorState.currentFile !== null && content instanceof Uint8Array}
        <p class="binary">Binary file ({content.length} bytes)</p>
    {:else if CodeEditorState.currentFile !== null && typeof content === "string"}
        <Monaco value={content} filename={CodeEditorState.currentFile} onChange={(v) => {
            if (CodeEditorState.currentFileContent != null) {
                ProjectContent[CodeEditorState.currentFileContent] = v;
            }
        }} />
    {/if}
</div>