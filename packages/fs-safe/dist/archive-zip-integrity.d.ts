import { Transform } from "node:stream";
import type { AdmittedZipEntry } from "./archive-zip-entry.js";
export declare function normalizeZipIntegrityError(error: unknown): Error;
export declare function createZipIntegrityTransform(record: AdmittedZipEntry): Transform;
