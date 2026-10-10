import type { WatchSnapshot } from "./watch-scan.js";
import type { WatchScope } from "./watch-types.js";
export type WatchStreamPaths = {
    anchors: string[];
    exclusions: string[];
};
/** Canonical names come only from guarded directory observations, never backend hints. */
export declare function watchStreamPaths(snapshot: WatchSnapshot, scopes: readonly WatchScope[]): WatchStreamPaths;
