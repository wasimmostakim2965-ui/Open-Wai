import type { BigIntStats } from "node:fs";
export type ReplaceFileAtomicDestinationState = Readonly<{
    state: "removed";
    path: string;
}> | Readonly<{
    state: "writing" | "published";
    path: string;
    dev: bigint;
    ino: bigint;
}>;
export type AtomicMutationOptions = {
    /** Recheck live authority before new effects; retained descriptor completion may settle. */
    assertBeforeMutation?: () => void;
    /** Retain observed destination facts even when later completion fails. */
    onDestinationState?: (state: ReplaceFileAtomicDestinationState) => void;
};
export declare class AtomicMutation {
    #private;
    readonly active: boolean;
    constructor(options: AtomicMutationOptions);
    rethrowRefusal(): void;
    refuse(error: unknown): never;
    assert(): void;
    destination(state: "writing" | "published", path: string, identity: BigIntStats): void;
    removed(path: string): void;
}
