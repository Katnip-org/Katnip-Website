<script lang="ts">
    import { StageState } from "../../ts/state.svelte";
    import "../../css/stage.css";

    let stage: HTMLDivElement;
    let scaffolding: any = $state(null);

    $effect(() => {
        (async () => {
            // @ts-ignore: no types for @turbowarp/scaffolding
            const mod: any = await import("@turbowarp/scaffolding");
            scaffolding = new (mod.Scaffolding ?? mod.default.Scaffolding)();
            scaffolding.resizeMode = "preserve-ratio";
            scaffolding.setup();
            scaffolding.appendTo(stage);
        })();

        // Scaffolding follows window resizes on its own, but not the panel being dragged
        const observer = new ResizeObserver(() => scaffolding?.relayout());
        observer.observe(stage);
        return () => observer.disconnect();
    });

    $effect(() => {
        const sb3 = StageState.sb3;
        if (!sb3 || !scaffolding) return;

        scaffolding.loadProject(sb3).then(() => scaffolding.greenFlag());
    });
</script>

<div class="stage" bind:this={stage}></div>