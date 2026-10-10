type CleanupRegistration = {
    event: "exit" | "beforeExit";
    registered: symbol;
    registering: symbol;
    handler: symbol;
    retainAware?: symbol;
    reentryError(): Error;
};
/** Preserve the legacy, first-registration-wins protocol across package copies. */
export declare function ensureSidecarLockCleanupRegistered<T extends true | {
    armed: boolean;
}>(keys: CleanupRegistration, cleanup: () => void, marker: T): T;
export {};
