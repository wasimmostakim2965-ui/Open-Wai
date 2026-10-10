import { type RootContext } from "./root-context.js";
import { type RootDirectoryObservationGuard } from "./root-directory-list.js";
import { type ExactStatIdentity } from "./stat-observation.js";
import type { DirEntry } from "./types.js";
/** One literal entry lookup under an operation-local admitted parent; never follow the leaf. */
export declare function lookupRootDirectoryEntry(root: RootContext, guard: RootDirectoryObservationGuard, name: string): Promise<{
    entry: DirEntry;
    identity: ExactStatIdentity;
} | undefined>;
