export type ScriptDiagnosticsSnapshot = {
    commandValues: string[];
    configuredCommands: string[];
    diagnosticsSafe: boolean;
    exactCommandValues: string[];
    sensitiveEnvironmentValues: string[];
    sensitivePayloadValues: string[];
};
export declare function formatScriptError(summary: string, detail: string, command: string, diagnostics: ScriptDiagnosticsSnapshot): string;
export declare function createScriptDiagnosticsSnapshot(command: string, serializedPayload: string, shell?: string | undefined): ScriptDiagnosticsSnapshot;
