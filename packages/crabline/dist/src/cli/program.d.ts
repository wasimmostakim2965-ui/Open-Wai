import { type ReadyFileIdentity } from "./ready-file.js";
import { Command } from "commander";
import { createRegistry } from "../providers/registry.js";
import { type StartCrablineServerParams, type StartedCrablineServer } from "../servers/index.js";
type SetExitCode = (code: number) => void;
type ProgramDependencies = {
    acquireReadyFileLease?: (filePath: string) => Promise<() => Promise<void>>;
    createRegistry?: typeof createRegistry;
    publishReadyFile?: (filePath: string, contents: string) => Promise<ReadyFileIdentity>;
    removeReadyFile?: (filePath: string, expectedContents: string, expectedIdentity: ReadyFileIdentity) => Promise<void>;
    startServer?: (params: StartCrablineServerParams) => Promise<StartedCrablineServer>;
};
type RunCliOptions = {
    dependencies?: ProgramDependencies;
    forceExit?: (code: number) => never;
};
export declare function createProgram(setExitCode?: SetExitCode, dependencies?: ProgramDependencies): Command;
type ShutdownSignal = "SIGINT" | "SIGTERM";
type SignalTarget = {
    on(event: ShutdownSignal, listener: () => void): unknown;
    removeListener(event: ShutdownSignal, listener: () => void): unknown;
};
export declare function waitForShutdown(close: () => Promise<void>, signalTarget?: SignalTarget): Promise<void>;
export declare function runCli(argv: string[], options?: RunCliOptions): Promise<number>;
export {};
