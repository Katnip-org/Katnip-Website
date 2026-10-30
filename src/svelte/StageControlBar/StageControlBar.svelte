<script lang="ts">
    import Flag from "@lucide/svelte/icons/flag";
    import Maximize from "@lucide/svelte/icons/maximize";
    import Octagon from "@lucide/svelte/icons/octagon";
    import Pause from "@lucide/svelte/icons/pause";
    import Play from "@lucide/svelte/icons/play";
    import Zap from "@lucide/svelte/icons/zap";
    import Zap_Off from "@lucide/svelte/icons/zap-off";
    import { StageState } from "../../ts/state.svelte";
    import { settings, setSetting } from "../../ts/settings.svelte";
    import { compile } from "../../ts/actions.svelte"
    import "../../css/stagecontrolbar.css";

    let paused = $state(false);
    let turbo = $derived(settings().turboMode);

    $effect(() => StageState.scaffolding?.vm.setTurboMode(turbo));

    function start() {
        if (!StageState.sb3) {
            alert("No compiled code found... \nCompiling for you... \nPlease hit the hammer to compile next time.")
            compile();
        }

        StageState.scaffolding?.greenFlag();
        paused = false;
    }

    // NOTE: I was told that this is okay, but has some issues since it resets interval + emmits two events
    function pause() {
        const vm = StageState.scaffolding?.vm;
        if (!vm) return;

        if (vm.runtime.frameLoop.running) vm.quit();
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
    <button onclick={(e) => e.shiftKey ? start() : compile()} title="Compile (shift-click to play)">
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
    <button onclick={() => setSetting("turboMode", !turbo)} title="TurboMode" class="right">
        {#if turbo}
            <Zap fill="#ffcc00" strokeWidth={0} size=14/>
        {:else}
            <Zap_Off size=14/>
        {/if}
    </button>
    <button onclick={() => document.querySelector("div.stage")?.requestFullscreen()} title="Fullscreen (Esc to exit)">
        <Maximize size=14/>
    </button>
</div>
