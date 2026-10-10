import { type BigIntStats } from "node:fs";
import { type AsyncDirectoryGuard } from "./directory-guard.js";
import { type SecretFileReadOptions } from "./secret-read-policy.js";
export declare const PRIVATE_SECRET_DIR_MODE = 448;
export declare const PRIVATE_SECRET_FILE_MODE = 384;
export declare function readSecretFileSync(filePath: string, label: string, options?: SecretFileReadOptions): string;
export declare function tryReadSecretFileSync(filePath: string | undefined, label: string, options?: SecretFileReadOptions): string | undefined;
type SecretFileWriteParams = {
    rootDir: string;
    filePath: string;
    content: string | Uint8Array;
    mode?: number;
    dirMode?: number;
    durable?: boolean;
};
type SecretFileCreateParams = Omit<SecretFileWriteParams, "durable"> & {
    /** "file" requires file synchronization; directory synchronization remains best effort. */
    durable?: boolean | "file";
};
export declare function prepareSecretFileWrite(params: Pick<SecretFileWriteParams, "rootDir" | "filePath" | "mode" | "dirMode">): Promise<{
    mode: number;
    rootGuard: AsyncDirectoryGuard<BigIntStats>;
    parentGuard: AsyncDirectoryGuard<BigIntStats>;
    fileName: string;
    finalFilePath: string;
}>;
export declare function writeSecretFileAtomic(params: SecretFileWriteParams): Promise<void>;
export declare function createSecretFileAtomic(params: SecretFileCreateParams): Promise<void>;
export {};
