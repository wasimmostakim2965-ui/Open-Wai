import { type RootPathObservationKind, type RootPathObservationReceipt } from "./root-path.js";
import { type RootContext } from "./root-context.js";
export type PinnedObservedPath = {
    resolved: string;
    receipt?: RootPathObservationReceipt;
};
export declare function resolvePinnedObservedPathInRoot(root: RootContext, relativePath: string, kind: RootPathObservationKind): Promise<PinnedObservedPath>;
