<script lang="ts">
    import { openAt, TerminalContent } from "../../ts/state.svelte";
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
            <span>{line.text}</span>
            {#if line.location}
                {@const { path, line: ln, column } = line.location}
                <a href="#{path}:{ln}:{column}" onclick={(e) => { e.preventDefault(); openAt(path, ln, column); }}>
                    {path.slice(1)}:{ln}:{column}
                </a>
            {/if}
        </div>
    {/each}
</div>