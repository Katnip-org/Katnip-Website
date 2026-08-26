import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import JsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import CssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import HtmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import TsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

import { checkSource, type KatnipError } from "@katnip-org/compiler";
import * as monaco from "monaco-editor";

import { THEME_RULES, themeScope } from "./theme";

import { loadWASM, OnigScanner, OnigString } from 'vscode-oniguruma';
import { Registry, INITIAL, parseRawGrammar, type StateStack } from 'vscode-textmate';
import onigWasmUrl from 'vscode-oniguruma/release/onig.wasm?url';
import katnipGrammarUrl from '../language/katnip.tmLanguage.json?url';
import tomlGrammarUrl from '../language/toml.tmLanguage.json?url';

const GRAMMARS: Record<string, string> = {
	"source.katnip": katnipGrammarUrl,
	"source.toml": tomlGrammarUrl
};

const LANGUAGES: {
    id: string;
    scopeName: string;
    extensions: string[];
    configuration?: monaco.languages.LanguageConfiguration;
}[] = [
    {
        id: "katnip",
        scopeName: "source.katnip",
        extensions: [".knip"],
        configuration: {
            comments: { lineComment: "#" },
            brackets: [
                ["{", "}"],
                ["[", "]"],
                ["(", ")"],
            ],
            autoClosingPairs: [
                { open: "{", close: "}" },
                { open: "[", close: "]" },
                { open: "(", close: ")" },
                { open: '"', close: '"' },
                { open: "'", close: "'" },
                { open: "#>", close: "<#" },
                { open: "#<", close: ">#" },
                { open: "#[", close: "]#" },
            ],
        },
    },
    {
        id: "toml",
        scopeName: "source.toml",
        extensions: [".toml"],
        configuration: {
            comments: { lineComment: "#" },
            brackets: [
                ["{", "}"],
                ["[", "]"],
            ],
            autoClosingPairs: [
                { open: "{", close: "}" },
                { open: "[", close: "]" },
                { open: '"', close: '"' },
                { open: "'", close: "'" },
            ],
        },
    },
];

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
			startColumn: e.location?.column ?? -1, 
			startLineNumber: e.location?.line ?? -1, 
			endColumn: e.location?.endColumn ?? e.location?.column ?? -1, 
			endLineNumber: e.location?.endLine ?? e.location?.line ?? -1
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
          const url = GRAMMARS[scopeName];
          if (!url) return null;
          const content = await (await fetch(url)).text();
          return parseRawGrammar(content, `${scopeName}.json`);
        }
      });
    })();
  }
  return registryPromise;
}

monaco.editor.defineTheme("katnip-dark", {
	base: "vs-dark",
	inherit: true,
	colors: {},
	rules: THEME_RULES
});

let languagePromise: Promise<void> | null = null;

export function registerLanguages(): Promise<void> {
	if (!languagePromise) languagePromise = doRegisterLanguages();
	return languagePromise;
}

async function doRegisterLanguages() {
	const registry = await getRegistry();

	await Promise.all(LANGUAGES.map(async ({ id, scopeName, extensions, configuration }) => {
		monaco.languages.register({ id, extensions });
		if (configuration) monaco.languages.setLanguageConfiguration(id, configuration);

		const grammar = await registry.loadGrammar(scopeName);
		if (!grammar) throw new Error(`Failed to load grammar ${scopeName}`);

		monaco.languages.setTokensProvider(id, {
			getInitialState: () => INITIAL,
			tokenize: (line, state) => {
				const result = grammar.tokenizeLine(line, state as StateStack);
				return {
					tokens: result.tokens.map((t) => ({
						startIndex: t.startIndex,
						scopes: themeScope(t.scopes)
					})),
					endState: result.ruleStack
				};
			}
		});
	}));
}
