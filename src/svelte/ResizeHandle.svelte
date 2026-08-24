<script lang="ts">
    // `edge` is the side of the parent the handle sits on: a left-anchored panel
    // (file manager) is dragged from its right edge, a right-anchored one (stage)
    // from its left.
    let { edge = "right" }: { edge?: "left" | "right" } = $props();

    let handle: HTMLDivElement;

    function resize(e: PointerEvent) {
        const width = edge === "right" ? e.clientX : window.innerWidth - e.clientX;
        handle.parentElement!.style.width = Math.min(Math.max(width, 100), window.innerWidth) + "px";
    }

    function start(e: PointerEvent) {
        // Pointer capture keeps move events coming to the handle once the cursor
        // leaves it, so no window-level listeners or drag flag are needed.
        handle.setPointerCapture(e.pointerId);
        document.body.classList.add("resizing");
        resize(e);
    }

    function end(e: PointerEvent) {
        handle.releasePointerCapture(e.pointerId);
        document.body.classList.remove("resizing");
    }
</script>

<div
    class="resize {edge}"
    role="separator"
    aria-orientation="vertical"
    bind:this={handle}
    onpointerdown={start}
    onpointermove={(e) => { if (handle.hasPointerCapture(e.pointerId)) resize(e); }}
    onpointerup={end}
></div>
