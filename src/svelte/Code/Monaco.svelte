<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import "../../ts/monaco";
    import * as monaco from "monaco-editor";
    import { registerLanguages, UpdateDiagnostics } from "../../ts/monaco";
    import { CodeEditorState } from "../../ts/state.svelte";

    let { value = $bindable(""), filename, onChange }: { value: string, filename: string, onChange: (v: string) => void } = $props();

    let container: HTMLDivElement;
    let editor: monaco.editor.IStandaloneCodeEditor;
    let mod: monaco.editor.IModel;
    let currentLanguage = $state("plaintext");

    function getLanguage(name: string): string {
        const dot = name.lastIndexOf(".");
        if (dot === -1) return "plaintext";
        const ext = name.slice(dot);

        const match = monaco.languages.getLanguages().find(lang =>
            lang.extensions?.includes(ext)
        );

        return match?.id ?? "plaintext";
    }

    onMount(async() => {
        await registerLanguages();

        currentLanguage = getLanguage(filename);

        editor = monaco.editor.create(container, {
            value,
            language: currentLanguage,
            theme: "katnip-dark",
            readOnly: false,
            automaticLayout: true
        });

        mod = editor.getModel()!;

        editor.onDidChangeModelContent(() => {
            onChange(editor.getValue());
            if (currentLanguage === "katnip") UpdateDiagnostics(mod, filename);
        });
        reveal();
    });

    function reveal() {
        const r = CodeEditorState.reveal;
        if (!editor || !r) return;
        editor.setPosition({ lineNumber: r.line, column: r.column });
        editor.revealLineInCenter(r.line);
        editor.focus();
        CodeEditorState.reveal = null;
    }

    $effect(() => {
        const f = filename;
        if (mod && filename) {
            const lang = getLanguage(filename);
            if (lang !== currentLanguage) {
                monaco.editor.setModelLanguage(mod, lang);
                currentLanguage = lang;
            }
        }
    });

    $effect(() => {
        const v = value;
        if (editor && editor.getValue() !== value) {
            editor.setValue(value);
        }
    });

    // Runs after the value effect above, so the file is loaded before we jump.
    $effect(reveal);

    onDestroy(() => editor.dispose())
</script>

<div bind:this={container}></div>