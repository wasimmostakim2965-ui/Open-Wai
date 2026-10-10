import type { FileHandle } from "node:fs/promises";
import type { PinnedWriteInput } from "./pinned-write-types.js";
export declare function writePinnedInput(target: FileHandle | number, input: PinnedWriteInput, maxBytes?: number, assertBeforeMutation?: () => void): Promise<void>;
