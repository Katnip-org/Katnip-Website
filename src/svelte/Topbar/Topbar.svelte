<script lang="ts">
    import Leaf from "@lucide/svelte/icons/leaf"
    import "../../css/topbar.css";
    import { Project } from "../../ts/state.svelte";
</script>

<div class="topbar">
    <div class="l">
        <Leaf color="var(--text-highlight)" />
        <p>Katnip</p>
        <input class="projectName" bind:value={Project.name}>
    </div>
    <div class="r">

    </div>
</div>