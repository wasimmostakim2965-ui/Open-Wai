import { type BigIntStats } from "node:fs";
import { type FileHandle } from "node:fs/promises";
import { FsSafeError } from "./errors.js";
import { type TempPathRegistration } from "./temp-cleanup.js";
export type PrivateProducerHandoff = {
    handle: FileHandle;
    identity: BigIntStats;
    unregister: TempPathRegistration;
};
type HandoffParents = {
    assertSourceParent: () => void;
    assertTargetParent: () => void;
};
type HandoffPaths = HandoffParents & {
    sourcePath: string;
    targetPath: string;
};
type ProducerHandoffParams = HandoffPaths & {
    readWrite: boolean;
};
export type CreatedHandoffParams<TSource = FileHandle, TVerification = Promise<void>> = HandoffPaths & {
    source: TSource;
    identity: BigIntStats;
    assertBeforeMutation?: () => void;
    verifyDescriptor?: (fd: number, path: string, links: number) => TVerification;
    onPublished?: () => void;
};
export declare function assertInitialSource(stat: BigIntStats): void;
export declare function inspectLinkedFile(inspect: () => BigIntStats, expected: BigIntStats, links: bigint, label: string): BigIntStats;
export declare function assertParents(params: HandoffParents): void;
export declare function normalizeLinkError(error: unknown): unknown;
export declare class FileHandoff {
    private readonly paths;
    private readonly identity;
    private readonly createdLabels;
    siblingOwned: boolean;
    publication: "not-published" | "published" | "indeterminate";
    cleanup: "preserved" | "removed" | "failed";
    closeFailed: boolean;
    constructor(paths: HandoffPaths, identity: BigIntStats, createdLabels?: boolean);
    inspect(owner: {
        readonly fd: number;
    }, links: bigint): {
        opened: BigIntStats;
        named?: BigIntStats;
    };
    publish(): void;
    retireSource(): void;
    failure(failures: readonly unknown[], aggregateMessage: string): FsSafeError;
}
export declare function handoffPrivateProducerFile(params: ProducerHandoffParams): Promise<PrivateProducerHandoff>;
export declare function handoffCreatedFile(params: CreatedHandoffParams): Promise<FileHandle>;
export {};
