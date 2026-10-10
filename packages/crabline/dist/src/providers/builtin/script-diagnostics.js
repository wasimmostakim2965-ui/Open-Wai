const sensitiveEnvironmentNameFragmentPattern = /(?:AUTH|BEARER|CREDENTIAL|JWT|KEY|PASS|PRIVATE|SECRET|TOKEN)/iu;
const nonSensitiveWorkingDirectoryNames = new Set(["PWD", "OLDPWD"]);
function isSensitiveEnvironmentName(name) {
    const upperName = name.toUpperCase();
    return (sensitiveEnvironmentNameFragmentPattern.test(upperName) ||
        (!nonSensitiveWorkingDirectoryNames.has(upperName) && upperName.includes("PWD")) ||
        /PAT(?!H)/u.test(upperName));
}
function redactCredentialSyntax(detail) {
    let redacted = detail.replace(/\b([a-z][a-z0-9+.-]*:\/\/)([^/\s@]+)@/giu, "$1[redacted credentials]@");
    redacted = redacted.replace(/(\bauthorization\b["']?\s*[:=]\s*["']?\s*)(?:(basic|bearer)\s+)?([^\s"',;}]+)/giu, (_match, prefix, scheme) => `${prefix}${scheme ? `${scheme} ` : ""}[redacted credential]`);
    redacted = redacted.replace(/\b([A-Za-z_][A-Za-z0-9_-]*)\s*(\+?=|:)\s*("[^"]*"|'[^']*'|[^,;}\]\r\n]+)/gu, (match, name, operator) => name.toLowerCase() !== "authorization" && isSensitiveEnvironmentName(name)
        ? `${name}${operator}[redacted credential]`
        : match);
    return redacted.replace(/--([A-Za-z0-9][A-Za-z0-9_-]*)(=|\s+)("[^"]*"|'[^']*'|[^\s,;]+)/gu, (match, name, separator) => isSensitiveEnvironmentName(name.replaceAll("-", "_"))
        ? `--${name}${separator}[redacted credential]`
        : match);
}
function commandContainsSensitiveValue(command) {
    if (redactCredentialSyntax(command) !== command) {
        return true;
    }
    const assignments = [
        ...command.matchAll(/(?:^|[\s;&|])["']?([A-Za-z_][A-Za-z0-9_]*)\s*\+?=/gu),
        ...command.matchAll(/\$env:([A-Za-z_][A-Za-z0-9_]*)\s*\+?=/giu),
        ...command.matchAll(/\$\{env:([A-Za-z_][A-Za-z0-9_]*)\}\s*\+?=/giu),
    ];
    if (assignments.some((match) => isSensitiveEnvironmentName(match[1] ?? ""))) {
        return true;
    }
    return [...command.matchAll(/(?:^|[\s;&|])["']?--([A-Za-z0-9][A-Za-z0-9_-]*)(?:=|\s)/gu)].some((match) => isSensitiveEnvironmentName((match[1] ?? "").replaceAll("-", "_")));
}
function addRedactionRepresentations(values, value) {
    if (!value) {
        return;
    }
    values.add(value);
    const serialized = JSON.stringify(value);
    values.add(serialized);
    values.add(serialized.slice(1, -1));
}
function addCommandValueRedactions(substringValues, value) {
    addRedactionRepresentations(substringValues, value);
}
function tokenizeLiteralCommand(command) {
    const tokens = [];
    let current = "";
    let quote;
    for (let index = 0; index < command.length; index += 1) {
        const character = command[index];
        if (character === "\n" || character === "\r") {
            return undefined;
        }
        if (process.platform === "win32" && character === "\\" && command[index + 1] === '"') {
            return undefined;
        }
        if (process.platform === "win32" && character === '"' && command[index + 1] === '"') {
            return undefined;
        }
        if (quote) {
            if (character === quote) {
                quote = undefined;
                continue;
            }
            if (quote === '"' && /[$`%!]/u.test(character)) {
                return undefined;
            }
            if (character === "\\" && quote === '"' && process.platform !== "win32") {
                return undefined;
            }
            current += character;
            continue;
        }
        if (character === '"' || (character === "'" && process.platform !== "win32")) {
            quote = character;
            continue;
        }
        if (/\s/u.test(character)) {
            if (current) {
                tokens.push(current);
                current = "";
            }
            continue;
        }
        if (/[;&|<>(){}$`%!*?[\]~]/u.test(character) ||
            (process.platform === "win32" && character === "^")) {
            return undefined;
        }
        if (character === "\\") {
            if (process.platform !== "win32") {
                return undefined;
            }
        }
        current += character;
    }
    if (quote) {
        return undefined;
    }
    if (current) {
        tokens.push(current);
    }
    return tokens;
}
function snapshotCommandValues(command) {
    const tokens = tokenizeLiteralCommand(command);
    if (!tokens) {
        return undefined;
    }
    const exactValues = new Set();
    const substringValues = new Set();
    let executableSeen = false;
    for (const token of tokens) {
        if (!executableSeen) {
            const assignment = /^([A-Za-z_][A-Za-z0-9_]*)\+?=(.*)$/u.exec(token);
            if (assignment) {
                addCommandValueRedactions(substringValues, assignment[2] ?? "");
                continue;
            }
            executableSeen = true;
            continue;
        }
        if (/^--[A-Za-z0-9][A-Za-z0-9_-]*$/u.test(token)) {
            const value = token.slice(2);
            if (value.length < 3) {
                return undefined;
            }
            addRedactionRepresentations(exactValues, token);
            addCommandValueRedactions(substringValues, value);
            continue;
        }
        if (/^-[A-Za-z0-9][A-Za-z0-9_-]+$/u.test(token)) {
            const value = token.slice(2);
            if (value.length < 3) {
                return undefined;
            }
            addRedactionRepresentations(exactValues, token);
            addCommandValueRedactions(substringValues, token.slice(1));
            addCommandValueRedactions(substringValues, value);
            continue;
        }
        const option = /^--?[A-Za-z0-9][A-Za-z0-9_-]*=(.*)$/u.exec(token);
        if (option) {
            const value = option[1] ?? "";
            if (value.length < 3) {
                return undefined;
            }
            addCommandValueRedactions(substringValues, value);
            continue;
        }
        if (process.platform === "win32" && token.startsWith("/")) {
            const slashOption = /^\/[A-Za-z0-9][A-Za-z0-9_-]*[:=](.*)$/u.exec(token);
            const value = slashOption?.[1] ?? "";
            if (value.length < 3) {
                return undefined;
            }
            addCommandValueRedactions(substringValues, value);
            continue;
        }
        if (token.length < 3) {
            return undefined;
        }
        if (token.startsWith("-")) {
            return undefined;
        }
        else {
            addRedactionRepresentations(substringValues, token);
        }
    }
    return {
        exactValues: [...exactValues].sort((left, right) => right.length - left.length),
        substringValues: [...substringValues].sort((left, right) => right.length - left.length),
    };
}
function snapshotSensitiveEnvironmentValues() {
    const representations = new Set();
    const values = Object.entries(process.env)
        .filter(([name, value]) => isSensitiveEnvironmentName(name) && value !== undefined && value.length > 0)
        .map(([, value]) => value)
        .sort((left, right) => right.length - left.length);
    for (const value of values) {
        addRedactionRepresentations(representations, value);
    }
    return [...representations].sort((left, right) => right.length - left.length);
}
function collectSensitivePayloadValues(value, values, seen, sensitive = false) {
    if (typeof value === "string") {
        if (sensitive && value.length > 0) {
            values.add(value);
            const serialized = JSON.stringify(value);
            values.add(serialized);
            values.add(serialized.slice(1, -1));
        }
        return;
    }
    if (sensitive && typeof value === "number" && Number.isFinite(value)) {
        values.add(String(value));
        return;
    }
    if (!value || typeof value !== "object") {
        return;
    }
    const visited = sensitive ? seen.sensitive : seen.nonSensitive;
    if (visited.has(value)) {
        return;
    }
    visited.add(value);
    if (Array.isArray(value)) {
        for (const entry of value) {
            collectSensitivePayloadValues(entry, values, seen, sensitive);
        }
        return;
    }
    for (const [name, entry] of Object.entries(value)) {
        collectSensitivePayloadValues(entry, values, seen, sensitive || isSensitiveEnvironmentName(name));
    }
}
function snapshotSensitivePayloadValues(payload) {
    const values = new Set();
    collectSensitivePayloadValues(payload, values, {
        nonSensitive: new WeakSet(),
        sensitive: new WeakSet(),
    });
    return [...values].sort((left, right) => right.length - left.length);
}
function isExactCommandValueBoundary(character) {
    return character === undefined || /[\s"'`=,:;.()[\]{}<>!?]/u.test(character);
}
function collectDiagnosticRedactionSpans(detail, values, label, priority, exact = false) {
    const spans = [];
    for (const value of values) {
        let cursor = 0;
        while (cursor < detail.length) {
            const start = detail.indexOf(value, cursor);
            if (start < 0) {
                break;
            }
            const end = start + value.length;
            if (!exact ||
                (isExactCommandValueBoundary(detail[start - 1]) && isExactCommandValueBoundary(detail[end]))) {
                spans.push({ end, label, priority, sourceLength: value.length, start });
            }
            cursor = end;
        }
    }
    return spans;
}
function redactDiagnosticValues(detail, diagnostics) {
    const spans = [
        ...collectDiagnosticRedactionSpans(detail, diagnostics.sensitiveEnvironmentValues, "[redacted environment value]", 4),
        ...collectDiagnosticRedactionSpans(detail, diagnostics.configuredCommands, "[configured script command]", 3),
        ...collectDiagnosticRedactionSpans(detail, diagnostics.commandValues, "[redacted command value]", 3),
        ...collectDiagnosticRedactionSpans(detail, diagnostics.exactCommandValues, "[redacted command value]", 3, true),
        ...collectDiagnosticRedactionSpans(detail, diagnostics.sensitivePayloadValues, "[redacted configured value]", 2),
    ].sort((left, right) => left.start - right.start || right.end - left.end || right.priority - left.priority);
    const merged = [];
    for (const span of spans) {
        const previous = merged.at(-1);
        if (!previous || span.start >= previous.end) {
            merged.push({ ...span });
            continue;
        }
        previous.end = Math.max(previous.end, span.end);
        if (span.sourceLength > previous.sourceLength ||
            (span.sourceLength === previous.sourceLength && span.priority > previous.priority)) {
            previous.label = span.label;
            previous.priority = span.priority;
            previous.sourceLength = span.sourceLength;
        }
    }
    let redacted = detail;
    for (const span of merged.toReversed()) {
        redacted = redacted.slice(0, span.start) + span.label + redacted.slice(span.end);
    }
    return redacted;
}
export function formatScriptError(summary, detail, command, diagnostics) {
    if (!detail.trim()) {
        return summary;
    }
    if (!diagnostics.diagnosticsSafe || commandContainsSensitiveValue(command)) {
        return `${summary}\n[script diagnostics redacted]`;
    }
    let redacted = redactDiagnosticValues(detail, diagnostics);
    redacted = redactCredentialSyntax(redacted);
    redacted = redacted.trim();
    return redacted ? `${summary}\n${redacted}` : summary;
}
function usesSupportedDiagnosticShell(shell) {
    if (shell !== undefined) {
        return false;
    }
    if (process.platform !== "win32") {
        return true;
    }
    const comspec = process.env.ComSpec ?? process.env.COMSPEC;
    return comspec === undefined || /(?:^|[\\/])cmd(?:\.exe)?$/iu.test(comspec);
}
export function createScriptDiagnosticsSnapshot(command, serializedPayload, shell) {
    const payload = JSON.parse(serializedPayload);
    const configuredCommands = new Set([command]);
    const commands = payload.provider?.config?.script?.commands;
    for (const configuredCommand of Object.values(commands ?? {})) {
        if (typeof configuredCommand === "string" && configuredCommand.length > 0) {
            configuredCommands.add(configuredCommand);
        }
    }
    const commandValues = new Set();
    const exactCommandValues = new Set();
    let diagnosticsSafe = usesSupportedDiagnosticShell(shell);
    for (const configuredCommand of configuredCommands) {
        if (commandContainsSensitiveValue(configuredCommand)) {
            diagnosticsSafe = false;
        }
        const values = snapshotCommandValues(configuredCommand);
        if (!values) {
            diagnosticsSafe = false;
            continue;
        }
        for (const value of values.substringValues) {
            commandValues.add(value);
        }
        for (const value of values.exactValues) {
            exactCommandValues.add(value);
        }
    }
    return {
        commandValues: [...commandValues].sort((left, right) => right.length - left.length),
        configuredCommands: [...configuredCommands].sort((left, right) => right.length - left.length),
        diagnosticsSafe,
        exactCommandValues: [...exactCommandValues].sort((left, right) => right.length - left.length),
        sensitiveEnvironmentValues: snapshotSensitiveEnvironmentValues(),
        sensitivePayloadValues: snapshotSensitivePayloadValues(payload),
    };
}
//# sourceMappingURL=script-diagnostics.js.map