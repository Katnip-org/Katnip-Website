import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import JsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import CssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import HtmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import TsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

import { checkSource, type KatnipError } from "@katnip-org/compiler";
import * as monaco from "monaco-editor";

import { loadWASM, OnigScanner, OnigString } from 'vscode-oniguruma';
import { Registry, INITIAL, parseRawGrammar, type StateStack } from 'vscode-textmate';
import onigWasmUrl from 'vscode-oniguruma/release/onig.wasm?url';
import grammarUrl from '../language/katnip.tmLanguage.json?url';

declare global {
	interface Window {
		MonacoEnvironment?: monaco.Environment;
	}
}

self.MonacoEnvironment = {
	getWorker(_: string, label: string) {
		if (label === "json") return new JsonWorker();
		if (["css", "scss", "less"].includes(label)) return new CssWorker();
		if (["html", "handlebars", "razor"].includes(label)) return new HtmlWorker();
		if (["typescript", "javascript"].includes(label)) return new TsWorker();
		return new EditorWorker();
	}
};

export function UpdateDiagnostics(m: monaco.editor.ITextModel) {
    const version = m.getVersionId();
    const errs = checkCode(m.getValue());

    if (m.getVersionId() !== version) return;

    monaco.editor.setModelMarkers(m, "katnip", errs.map(e => {
        return {
            severity: 8,
            message: e.message,
            startColumn: e.location.column, 
            startLineNumber: e.location.line, 
            endColumn: e.location.endColumn ?? e.location.column, 
            endLineNumber: e.location.endLine ?? e.location.line
        };
    }));
}

function checkCode(code: string) {
    const errors: readonly KatnipError[] = checkSource(code);
    return errors;
}

let registryPromise: Promise<Registry> | null = null;

export function getRegistry(): Promise<Registry> {
  if (!registryPromise) {
    registryPromise = (async () => {
      const wasmBin = await (await fetch(onigWasmUrl)).arrayBuffer();
      await loadWASM(wasmBin);

      return new Registry({
        onigLib: Promise.resolve({
          createOnigScanner: (patterns) => new OnigScanner(patterns),
          createOnigString: (s) => new OnigString(s)
        }),
        loadGrammar: async (scopeName) => {
          if (scopeName !== 'source.katnip') return null;
          const content = await (await fetch(grammarUrl)).text();
          return parseRawGrammar(content, 'katnip.tmLanguage.json');
        }
      });
    })();
  }
  return registryPromise;
}

/**
 * Monaco's built-in themes only name Monarch tokens (keyword, string, type...)
 * This theme bridges the TextMate terms the Katnip grammar uses.
 * These are the VS Code Dark+ colors.
 */
monaco.editor.defineTheme("katnip-dark", {
	base: "vs-dark",
	inherit: true,
	colors: {},
	rules: [
		{ token: "comment", foreground: "6A9955" },
		{ token: "string", foreground: "CE9178" },
		{ token: "constant.character.escape", foreground: "D7BA7D" },
		{ token: "constant.numeric", foreground: "B5CEA8" },
		{ token: "constant.language", foreground: "569CD6" },
		{ token: "constant.other.enum", foreground: "4FC1FF" },
		{ token: "keyword.control", foreground: "C586C0" },
		{ token: "keyword.operator", foreground: "D4D4D4" },
		{ token: "storage.type", foreground: "569CD6" },
		{ token: "storage.modifier", foreground: "569CD6" },
		{ token: "entity.name.function", foreground: "DCDCAA" },
		{ token: "entity.name.type", foreground: "4EC9B0" },
		{ token: "support.type", foreground: "4EC9B0" },
		{ token: "variable.other", foreground: "9CDCFE" },
		{ token: "variable.language", foreground: "569CD6" },
		{ token: "punctuation.section.interpolation", foreground: "569CD6" }
	]
});

let languagePromise: Promise<void> | null = null;

export function registerKatnipLanguage(): Promise<void> {
	if (!languagePromise) languagePromise = doRegisterKatnipLanguage();
	return languagePromise;
}

async function doRegisterKatnipLanguage() {
	monaco.languages.register({ id: "katnip", extensions: [".knip"] });

	const registry = await getRegistry();
	const grammar = await registry.loadGrammar("source.katnip");
	if (!grammar) throw new Error("Failed to load Katnip grammar");

	monaco.languages.setTokensProvider("katnip", {
		getInitialState: () => INITIAL,
		tokenize: (line, state) => {
			const result = grammar.tokenizeLine(line, state as StateStack);
			return {
				tokens: result.tokens.map((t) => ({
					startIndex: t.startIndex,
					scopes: t.scopes[t.scopes.length - 1]
				})),
				endState: result.ruleStack
			};
		}
	});
}
