import { type DenyMutationPolicy } from "./deny-mutations.js";
import { type RootContext } from "./root-context.js";
export declare function assertMoveMutationAllowed(root: RootContext, params: {
    fromRelative: string;
    toRelative: string;
    denyMutations?: DenyMutationPolicy;
}): Promise<void>;
