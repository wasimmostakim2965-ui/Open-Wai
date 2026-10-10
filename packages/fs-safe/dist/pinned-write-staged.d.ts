import { type BigIntStats } from "node:fs";
import type { AsyncDirectoryGuard } from "./directory-guard.js";
import { type FileIdentityStat } from "./file-identity.js";
import type { PinnedWriteParams } from "./pinned-write-types.js";
export declare function runPinnedStagedWrite(params: PinnedWriteParams, parentPath: string, parentGuard: AsyncDirectoryGuard<BigIntStats>): Promise<FileIdentityStat>;
