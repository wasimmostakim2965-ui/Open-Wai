import type { NativeArchiveEntry } from "./native-binding.js";
import type { ZipDirectoryEntry } from "./archive-zip-directory.js";
/** Associate all native entries with physical admission before exposing any. */
export declare function validateNativeZipManifest(manifest: NativeArchiveEntry[], admitted: ZipDirectoryEntry[]): void;
