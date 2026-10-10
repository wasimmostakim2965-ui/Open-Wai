import { type SecureTempRootDescriptorAdapter } from "./secure-temp-repair.js";
export type { SecureTempRootDescriptorAdapter } from "./secure-temp-repair.js";
type SecureDirStat = {
    isDirectory(): boolean;
    isSymbolicLink(): boolean;
    mode?: number | bigint;
    uid?: number | bigint;
};
export type ResolveSecureTempRootOptions = {
    accessSync?: (path: string, mode?: number) => void;
    descriptor?: SecureTempRootDescriptorAdapter;
    fallbackPrefix: string;
    getuid?: () => number | undefined;
    lstatSync?: (path: string) => SecureDirStat;
    mkdirSync?: (path: string, opts: {
        recursive: boolean;
        mode?: number;
    }) => void;
    platform?: NodeJS.Platform;
    preferredDir?: string;
    skipPreferredOnWindows?: boolean;
    tmpdir?: () => string;
    unsafeFallbackLabel?: string;
    warn?: (message: string) => void;
    warningPrefix?: string;
};
export declare function resolveSecureTempRoot(options: ResolveSecureTempRootOptions): string;
