import type { CrablineServerManifest } from "../servers/index.js";
import { publishPrivateFileAtomically, syncParentDirectory } from "./private-file.js";
import { type OpenClawCrablineChannelDriverSelection } from "./shared.js";
import type { OpenClawCrablineProviderReadinessLock } from "./provider-readiness-lock.js";
type OpenClawCrablineArtifactPointerBase = {
    capabilityMatrixPath: string;
    generation: string;
    manifestPath: string;
    previousGeneration?: string;
    providerReadinessArtifactPath: string;
};
export type OpenClawCrablineArtifactPointer = OpenClawCrablineArtifactPointerBase & {
    recorderSnapshotPath: string | null;
    version: 3;
};
export type PublishedOpenClawCrablineArtifactGeneration = OpenClawCrablineArtifactPointer & {
    pointerPath: string;
    providerReadiness: Record<string, unknown>;
    warnings?: string[];
};
type PublishGenerationDependencies = {
    beforePointerSwitch?: (pointer: OpenClawCrablineArtifactPointer) => Promise<void>;
    createGenerationId?: () => string;
    platform?: NodeJS.Platform;
    publishPrivateFile?: typeof publishPrivateFileAtomically;
    secureWindowsDirectory?: (directoryPath: string) => Promise<void>;
    secureWindowsFile?: (filePath: string) => Promise<void>;
    syncParent?: typeof syncParentDirectory;
};
type RecorderSnapshot = {
    contents: string;
    fileName: string;
};
export declare function readOpenClawCrablineArtifactPointer(outputDir: string): Promise<OpenClawCrablineArtifactPointer | null>;
export declare function publishOpenClawCrablineArtifactGeneration(params: {
    capabilityReport: unknown;
    lock: OpenClawCrablineProviderReadinessLock;
    manifest: CrablineServerManifest;
    outputDir: string;
    recorderSnapshot?: RecorderSnapshot;
    selection: OpenClawCrablineChannelDriverSelection;
    providerReadiness: Record<string, unknown>;
}, dependencies?: PublishGenerationDependencies): Promise<PublishedOpenClawCrablineArtifactGeneration>;
export {};
