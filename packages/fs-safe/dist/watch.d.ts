import type { Root } from "./root.js";
import type { WatchOptions, WatchSubscription } from "./watch-types.js";
export type * from "./watch-types.js";
/** Advisory observation only. Hints never grant filesystem authority. */
export declare function watch(root: Root, input: WatchOptions): WatchSubscription;
