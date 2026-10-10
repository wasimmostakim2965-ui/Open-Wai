import type { RootContext } from "./root-context.js";
import type { RootPathObservationReceipt } from "./root-path.js";
import type { PathStat } from "./types.js";
export declare function statResolvedPathInRoot(root: RootContext, resolvedPath: string, receipt?: RootPathObservationReceipt): Promise<PathStat>;
