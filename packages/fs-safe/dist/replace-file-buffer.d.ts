import type { AtomicFile, Procedure } from "./atomic-io.js";
import type { AtomicDestination } from "./replace-file-destination.js";
export declare function writeAtomicDestination(file: AtomicFile, data: Buffer, destination?: AtomicDestination, restore?: boolean): Procedure<void>;
