import type { RootContext } from "./root-context.js";
/** Internal registration; never reconstruct authority from public pathname fields. */
export declare function registerRootHandleContext(handle: object, context: RootContext): void;
export declare function rootHandleContext(handle: object): RootContext;
