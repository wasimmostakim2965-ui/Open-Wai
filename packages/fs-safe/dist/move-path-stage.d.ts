import { type BigIntStats } from "node:fs";
export declare function createMoveStageOwner(staged: string): Promise<{
    record(created: BigIntStats): void;
    assertCurrent: () => void;
    published(): void;
    cleanup(): Promise<void>;
}>;
