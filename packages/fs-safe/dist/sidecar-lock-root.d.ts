import type { OpenResult, Root } from "./root-impl.js";
export declare function openSidecarRoot(lockRoot: Root, relative: string, discardObservation?: "unlinked" | "changed", onOpenFailure?: (error: unknown) => void): Promise<OpenResult | null>;
