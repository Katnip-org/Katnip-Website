<script lang="ts">
    import { Project } from "../ts/state.svelte";
    import Code from "./Code/Code.svelte";
    import FileManager from "./FileManager/FileManager.svelte";
    import Stage from "./Stage/Stage.svelte";
    import Topbar from "./Topbar/Topbar.svelte";
    import Terminal from "./Terminal/Terminal.svelte";
    import ResizeHandle from "./ResizeHandle.svelte";

    import "../css/main.css";
    import StageControlBar from "./StageControlBar/StageControlBar.svelte";

    $effect(() => {
        document.title = Project.name ? `${Project.name} - Katnip Editor` : "Katnip Editor";
    });
</script>

<Topbar />
<div class="main">
    <FileManager />
    <Code />
    <div class="output">
        <ResizeHandle edge="left" />
        <StageControlBar />
        <Stage />
        <Terminal />
    </div>
</div>