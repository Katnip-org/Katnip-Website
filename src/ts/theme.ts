/**
 * Monaco's built-in themes only name Monarch tokens (keyword, string, type...)
 * This theme bridges the TextMate terms the Katnip grammar uses.
 * These are the VS Code Dark+ colors.
 */
export const THEME_RULES = [
    { token: "comment", foreground: "6A9955" },
    { token: "string", foreground: "CE9178" },
    { token: "constant.character.escape", foreground: "D7BA7D" },
    { token: "constant.numeric", foreground: "B5CEA8" },
    { token: "constant.language", foreground: "569CD6" },
    { token: "constant.other.enum", foreground: "4FC1FF" },
    { token: "constant.other.date", foreground: "B5CEA8" },
    { token: "constant.other.time", foreground: "B5CEA8" },
    { token: "keyword.control", foreground: "C586C0" },
    { token: "keyword.operator", foreground: "D4D4D4" },
    { token: "storage.type", foreground: "569CD6" },
    { token: "storage.modifier", foreground: "569CD6" },
    { token: "entity.name.function", foreground: "DCDCAA" },
    { token: "entity.name.type", foreground: "4EC9B0" },
    { token: "entity.name.section", foreground: "4EC9B0" },
    { token: "support.type", foreground: "4EC9B0" },
    { token: "variable.other", foreground: "9CDCFE" },
    { token: "variable.language", foreground: "569CD6" },
    { token: "punctuation.section.interpolation", foreground: "569CD6" },
];

export function themeScope(scopes: string[]): string {
    for (let i = scopes.length - 1; i >= 0; i--) {
        const scope = scopes[i];
        if (THEME_RULES.some(r => scope === r.token || scope.startsWith(`${r.token}.`))) return scope;
    }
    return scopes[scopes.length - 1];
}
