export type ExtractionDeadline = {
    signal: AbortSignal;
    check: () => void;
    ownDestinationMutation: <T>(run: () => Promise<T>) => Promise<T>;
    waitForDestinationMutations: () => Promise<void>;
    dispose: () => void;
};
export declare function ownExtractionDestinationMutation<T>(deadline: ExtractionDeadline | undefined, run: () => Promise<T>): Promise<T>;
export declare function createPipelineTimeoutError(err: unknown, deadline: ExtractionDeadline): unknown;
export declare function waitForDeadline<T>(promise: Promise<T>, deadline: ExtractionDeadline): Promise<T>;
export declare function withExtractionDeadline<T>(timeoutMs: number, label: string, run: (deadline: ExtractionDeadline) => Promise<T>): Promise<T>;
