<script lang="ts">
    import Flag from "@lucide/svelte/icons/flag";
    import Octagon from "@lucide/svelte/icons/octagon";
    import Pause from "@lucide/svelte/icons/pause";
    import Play from "@lucide/svelte/icons/play";
    import { StageState } from "../../ts/state.svelte";
    import "../../css/stagecontrolbar.css";

    let paused = $state(false);

    function start() {
        StageState.scaffolding?.greenFlag();
        paused = false;
    }

    function pause() {
        const vm = StageState.scaffolding?.vm;
        if (!vm) return;

        if (vm.runtime.frameLoop.running) vm.stop();
        else vm.start();
        paused = !vm.runtime.frameLoop.running;
    }

    function stop() {
        const scaffolding = StageState.scaffolding;
        if (!scaffolding) return;

        scaffolding.stopAll();
        scaffolding.vm.start(); // stopping while paused would otherwise leave monitors frozen
        paused = false;
    }
</script>

<div class="stagecontrolbar">
    <button onclick={start} title="Play">
        <Flag size=16/>
    </button>
    <button onclick={pause} title={paused ? "Resume" : "Pause"}>
        {#if paused}
            <Play size=16/>
        {:else}
            <Pause size=16/>
        {/if}
    </button>
    <button onclick={stop} title="Stop">
        <Octagon size=16/>
    </button>
</div>
