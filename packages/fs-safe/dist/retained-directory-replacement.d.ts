import type { BigIntStats } from "node:fs";
import type { NativeBinding, NativeOwnedTreeRemovalResult } from "./native-binding.js";
type RenameBinding = NativeBinding & Required<Pick<NativeBinding, "renameNoReplaceWithIdentity">>;
export type RetainedReplacementParent = Readonly<{
    path: string;
    realPath: string;
    identity: Pick<BigIntStats, "dev" | "ino">;
}>;
export declare function copyOperationalCode(target: Error, source: unknown): void;
export declare class RetainedDirectoryReplacement {
    #private;
    private constructor();
    static requireBinding(): RenameBinding;
    static retain(params: {
        targetParent: RetainedReplacementParent;
        stagedParent: RetainedReplacementParent;
        originalTarget?: Readonly<{
            path: string;
            identity: Pick<BigIntStats, "dev" | "ino">;
        }>;
    }, binding?: RenameBinding): RetainedDirectoryReplacement;
    renameNoReplace(sourceParent: "staged" | "target", sourceBasename: string, targetBasename: string, expectedSource: Pick<BigIntStats, "dev" | "ino">): void;
    removeOriginal(backupBasename: string): Promise<NativeOwnedTreeRemovalResult["outcome"]>;
    close(): void;
}
export {};
