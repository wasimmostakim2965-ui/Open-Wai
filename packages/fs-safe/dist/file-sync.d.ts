import fs from "node:fs";
import type { FileHandle } from "node:fs/promises";
export declare function syncFileBestEffort(handle: Pick<FileHandle, "sync">): Promise<void>;
export declare function syncFileBestEffortSync(fd: number, fsModule?: Pick<typeof fs, "fsyncSync">): void;
