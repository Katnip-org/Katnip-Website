<script lang="ts">
    import { onMount } from "svelte";

    let resize: HTMLDivElement;
    let mouseDown: boolean = false

    onMount(() => {
        resize.addEventListener("mousedown", (e) => {
            mouseDown = true;
            resize.parentElement!.style.width = e.clientX + "px";

            document.body.classList.add("fm-drag");
        });
        window.addEventListener("mouseup", () => {
            mouseDown = false;
            document.body.classList.remove("fm-drag");
        });

        window.addEventListener("mousemove", (e) => {
            if (!mouseDown) return;

            resize.parentElement!.style.width = e.clientX + "px";
            if (e.clientX < 100) {
                resize.parentElement!.style.width = "100px";
            } else if (e.clientX > window.innerWidth - 1) {
                resize.parentElement!.style.width = window.innerWidth + "px";
            }
        })
    })
</script>

<div class="resize" bind:this={resize}></div>