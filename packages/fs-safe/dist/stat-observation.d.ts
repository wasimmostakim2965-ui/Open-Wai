import type { BigIntStats, Stats } from "node:fs";
export type ExactStatIdentity = Pick<BigIntStats, "dev" | "ino">;
export type StatObservationReceipt = {
    stat: Stats | BigIntStats;
    identity: ExactStatIdentity;
};
/** Operation-local metadata plus exact identity; never use projected PathStat IDs. */
export declare function inspectStatObservationSync(inspect: (bigint: boolean) => Stats | BigIntStats, expected?: ExactStatIdentity, initial?: Stats | BigIntStats, platform?: NodeJS.Platform): StatObservationReceipt;
/** Revalidate an exact identity without allocating a receipt that the caller will discard. */
export declare function assertStatObservationSync(inspect: (bigint: boolean) => Stats | BigIntStats, expected: ExactStatIdentity, initial?: Stats | BigIntStats, platform?: NodeJS.Platform): Stats | BigIntStats;
