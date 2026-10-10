import { type RootContext } from "./root-context.js";
import { type InternalRemoveOptions } from "./root-remove.js";
import type { RemovalPathReceipts } from "./root-remove-receipt.js";
export declare function removePathInRootNative(root: RootContext, target: string, options: InternalRemoveOptions, receipts?: RemovalPathReceipts): Promise<void>;
