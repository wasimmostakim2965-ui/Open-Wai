import { type NativeBinding } from "./native.js";
import type { RootContext } from "./root-context.js";
import type { DirectoryIdentity, WatchSnapshot } from "./watch-scan.js";
import type { WatchStreamPaths } from "./watch-stream.js";
export type NativeWatchHint = {
    directory: string;
    name: string;
    event: "rename" | "change" | "children" | "subtree";
};
export type NativeWatchBatch = {
    hints: NativeWatchHint[];
    overflow: boolean;
    error?: string;
};
export type NativeWatchWireBatch = {
    hints: {
        directory: string;
        name: string;
        structural: boolean;
        flags?: number;
        namelessChild?: boolean;
        subtree?: boolean;
    }[];
    overflow: boolean;
    error?: string;
};
export type NativeWatchEntry = {
    scope: string;
    directory: {
        root: string;
        relative: string;
        rootDev: bigint;
        rootIno: bigint;
        dev: bigint;
        ino: bigint;
    };
    name: string;
    target?: DirectoryIdentity & {
        kind: string;
    };
};
export declare function watchBinding(mode: "auto" | "events" | "poll"): NativeBinding | undefined;
export declare class NativeWatchBackend {
    private binding;
    private root;
    private id;
    private streamPaths;
    directories: number | undefined;
    constructor(binding: NativeBinding, root: RootContext, callback: (batch: NativeWatchBatch) => void, limit: number, persistent: boolean);
    add(name: string, identity: DirectoryIdentity): void;
    testEvent(path: string, flags: number): void;
    entries(snapshot: WatchSnapshot): boolean;
    configure(paths: WatchStreamPaths): boolean;
    close(): void;
}
