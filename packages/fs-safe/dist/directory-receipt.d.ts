import { type BigIntStats, type Stats } from "node:fs";
import type { DirectoryReceipt } from "./directory-durability.js";
import type { FileIdentityStat } from "./file-identity.js";
type ExactIdentity = Readonly<Pick<BigIntStats, "dev" | "ino">>;
declare const numericFields: readonly ["dev", "mode", "nlink", "uid", "gid", "rdev", "blksize", "ino", "size", "blocks"];
declare const timeFields: readonly ["atime", "mtime", "ctime", "birthtime"];
type DirectoryMetadata = Pick<Stats, typeof numericFields[number] | `${typeof timeFields[number]}Ms`>;
type DirectoryProvenance = Readonly<{
    identity: ExactIdentity;
    metadata: Readonly<DirectoryMetadata>;
}>;
type DirectoryAuthority = DirectoryProvenance & Readonly<{
    path: string;
    realPath: string;
}>;
export declare function directoryReceiptIdentity(identity: FileIdentityStat): ExactIdentity;
export declare function directoryReceiptAuthority(receipt: DirectoryReceipt<Stats | BigIntStats>): DirectoryAuthority;
export declare function ownDirectoryReceipt(receipt: DirectoryReceipt<Stats | BigIntStats>): DirectoryReceipt;
export declare function copyRetainedDirectoryReceipt(receipt: DirectoryReceipt): DirectoryReceipt;
export declare function createDirectoryReceiptFromIdentity(pathname: string, realPath: string, exactStat: BigIntStats): DirectoryReceipt;
export declare function createDirectoryReceiptSync(directoryPath: string, label: string, canonicalize?: (pathname: string) => string): DirectoryReceipt;
export declare function assertDirectoryReceiptCurrentSync(receipt: DirectoryReceipt, label: string, canonicalize?: (pathname: string) => string): void;
export {};
