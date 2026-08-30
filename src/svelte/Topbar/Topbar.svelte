<script lang="ts">
    import Play from "@lucide/svelte/icons/play";
    import Book from "@lucide/svelte/icons/book";
    import logo from "../../assets/logo.svg";
    import "../../css/topbar.css";
    import { Project } from "../../ts/state.svelte";
    import { compile } from "../../ts/actions.svelte";
</script>

<div class="topbar">
    <div class="l">
        <img src={logo} alt="Katnip Logo" width="30" height="30" />
        <p>Katnip</p>
        <input class="projectName" bind:value={Project.name}>
    </div>
    <div class="compile">
        <a href="https://docs.katnip.org" target="_blank" rel="noopener noreferrer" title="docs">
            <Book size=16 />
            Docs
        </a>
        <button onclick={compile} title="Compile">
            <Play size=16/>
            Compile
        </button>
    </div>
</div>