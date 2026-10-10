import type { BigIntStats } from "node:fs";
import { type RootContext } from "./root-context.js";
import type { RootRemoveOptions } from "./root-options.js";
import type { RemovalPathReceipts } from "./root-remove-receipt.js";
export declare const nonrecursiveRemovalKind: unique symbol;
export type InternalRemoveOptions = RootRemoveOptions & {
    [nonrecursiveRemovalKind]?: "directory";
};
export declare function validateRemoveOptions(options: RootRemoveOptions): void;
type NonrecursiveRemovalAdmission = Readonly<{
    parentIdentity: Readonly<Pick<BigIntStats, "dev" | "ino">>;
    assertAfterMutation(): void;
    assertCurrent(): void;
}>;
export declare function captureNonrecursiveRemovalAdmission(root: RootContext, targetPath: string, options: RootRemoveOptions, receipts?: RemovalPathReceipts): Promise<NonrecursiveRemovalAdmission | undefined>;
export declare function removePathInRootFallback(root: RootContext, targetPath: string, options: RootRemoveOptions, receipts?: RemovalPathReceipts): Promise<void>;
export {};
