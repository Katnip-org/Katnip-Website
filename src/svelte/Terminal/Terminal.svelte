<script lang="ts">
    import { TerminalContent } from "../../ts/state.svelte";
    import "../../css/terminal.css";

    let terminal: HTMLDivElement;
    $effect(() => {
        TerminalContent.length;
        terminal.scrollTop = terminal.scrollHeight;
    })
</script>

<div class="terminal" bind:this={terminal}>
    {#each TerminalContent as line}
        <div class={line.kind}>
            {line.text}
        </div>
    {/each}
</div>