<script>
    import Monaco from "./Monaco.svelte";
    import "../../css/code.css";
    import { CodeEditorState, ProjectContent } from "../../ts/state.svelte";
</script>
<div class="codeArea">
    {#if CodeEditorState.currentFile !== null}
        <Monaco value={ProjectContent[CodeEditorState.currentFileContent ?? -1] ?? ""} filename={CodeEditorState.currentFile} onChange={(v) => {
            if (CodeEditorState.currentFileContent != null) {
                ProjectContent[CodeEditorState.currentFileContent] = v;
            }
        }} />
    {/if}
</div>