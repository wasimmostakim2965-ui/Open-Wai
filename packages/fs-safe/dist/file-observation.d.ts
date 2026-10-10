type FailureKind = "identity" | "resolution" | `open:${string}` | `exclusive-create:${string}` | `unlinked:${string}` | `changed:${string}` | `stat-leaf-missing:${string}` | `stat-leaf-changed:${string}`;
export declare function recordFileObservationFailure(error: unknown, kind: FailureKind): void;
export declare function isFileObservationFailure(error: unknown, kind: FailureKind): boolean;
export declare function fileObservation(): {
    run<T>(operation: () => T): T;
    has(error: unknown, kind: FailureKind): boolean;
};
export {};
