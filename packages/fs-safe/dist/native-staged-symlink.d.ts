import { type BigIntStats, type Stats } from "node:fs";
import type { DirectoryReceipt } from "./directory-durability.js";
import type { StagedSymlink, StagedSymlinkExpected } from "./staged-symlink-types.js";
/**
 * Admit an existing staged symlink against caller-captured identity and retain
 * its no-follow descriptor. Admission never creates, adopts by target, or unlinks.
 */
export declare function retainSymlinkInDirectory(options: {
    directory: string | DirectoryReceipt<Stats | BigIntStats>;
    basename: string;
    expected: StagedSymlinkExpected;
    assertBeforeMutation: () => void;
}): Promise<StagedSymlink>;
