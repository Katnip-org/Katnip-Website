<script lang="ts">
    import ResizeHandle from "../ResizeHandle.svelte";
    import "../../css/stage.css";

    let stage: HTMLDivElement;
    let scaffolding: any;

    $effect(() => {
        (async () => {
            // @ts-ignore: no types for @turbowarp/scaffolding
            const mod: any = await import("@turbowarp/scaffolding");
            scaffolding = new (mod.Scaffolding ?? mod.default.Scaffolding)();
            scaffolding.resizeMode = "preserve-ratio";
            scaffolding.setup();
            scaffolding.appendTo(stage);
        })();

        // Scaffolding follows window resizes on its own, but not the panel being dragged.
        const observer = new ResizeObserver(() => scaffolding?.relayout());
        observer.observe(stage);
        return () => observer.disconnect();
    });

    export async function run(sb3: Uint8Array) {
        await scaffolding.loadProject(sb3);
        scaffolding.greenFlag();
    }
</script>

<div class="stage" bind:this={stage}>
    <ResizeHandle edge="left" />
</div>