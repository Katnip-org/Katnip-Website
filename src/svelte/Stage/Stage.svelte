<script lang="ts">
    import { StageState } from "../../ts/state.svelte";
    import "../../css/stage.css";

    let stage: HTMLDivElement;

    $effect(() => {
        let cancelled = false;

        (async () => {
            const mod = await import("@turbowarp/scaffolding");
            if (cancelled) return;

            const scaffolding = new (mod.Scaffolding ?? mod.default.Scaffolding)();
            scaffolding.resizeMode = "preserve-ratio";
            scaffolding.setup();
            scaffolding.appendTo(stage);
            StageState.scaffolding = scaffolding;
        })();

        // Scaffolding follows window resizes on its own, but not the panel being dragged
        const observer = new ResizeObserver(() => StageState.scaffolding?.relayout());
        observer.observe(stage);

        return () => {
            cancelled = true;
            observer.disconnect();
            StageState.scaffolding = null;
        };
    });

    $effect(() => {
        const sb3 = StageState.sb3;
        const scaffolding = StageState.scaffolding;
        if (!sb3 || !scaffolding) return;

        scaffolding.loadProject(sb3).then(() => scaffolding.greenFlag());
    });
</script>

<div class="stage" bind:this={stage}></div>