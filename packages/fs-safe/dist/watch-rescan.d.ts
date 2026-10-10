import type { WatchChange, WatchScope } from "./watch-types.js";
import type { WatchSnapshot } from "./watch-scan.js";
/** Only previously enumerated directories can be reconciled without discovering topology. */
export declare function watchRescanScopes(scopes: readonly WatchScope[], snapshot: WatchSnapshot, changes: readonly WatchChange[]): readonly WatchScope[] | undefined;
/** Merge only freshly observed slices. Any topology/anchor ambiguity requires a full pass. */
export declare function mergeWatchRescan(scopes: readonly WatchScope[], before: WatchSnapshot, slice: WatchSnapshot, requested: readonly WatchScope[]): WatchSnapshot | undefined;
