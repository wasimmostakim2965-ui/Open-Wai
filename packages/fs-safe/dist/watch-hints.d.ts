import { type RootContext } from "./root-context.js";
import type { NativeWatchBatch } from "./watch-native.js";
import type { WatchSnapshot } from "./watch-scan.js";
import type { WatchChange, WatchScope } from "./watch-types.js";
export declare function excludedWatchPath(snapshot: WatchSnapshot | undefined, name: string): boolean;
export declare function scopedChanges(scopes: readonly WatchScope[], change: WatchChange): WatchChange[];
/** An undecodable child cannot equal a validated literal scope component. */
export declare function selectedWatchChildren(scopes: readonly WatchScope[], directory: string): boolean;
/** A folded directory can contain a missing scope component, unlike a nameless child. */
export declare function selectedWatchSubtree(scopes: readonly WatchScope[], directory: string): boolean;
export declare function nativeChanges(scopes: readonly WatchScope[], snapshot: WatchSnapshot | undefined, batch: NativeWatchBatch, limit?: number, after?: WatchSnapshot): WatchChange[] | undefined;
export declare function changedEntries(before: WatchSnapshot | undefined, after: WatchSnapshot, limit: number): WatchChange[] | undefined;
/** Backend names never establish authority to publish a pathname. */
export declare function guardedHintChanges(scopes: readonly WatchScope[], before: WatchSnapshot | undefined, after: WatchSnapshot, hints: readonly WatchChange[] | undefined, observed: readonly WatchChange[] | undefined, limit: number): WatchChange[] | undefined;
/** Resolve native spelling aliases without treating case folding as identity. */
export declare function admittedNativeChanges(root: RootContext, scopes: readonly WatchScope[], before: WatchSnapshot | undefined, after: WatchSnapshot, batch: NativeWatchBatch, signal: AbortSignal, limit: number, scheduling?: boolean): Promise<WatchChange[] | undefined>;
