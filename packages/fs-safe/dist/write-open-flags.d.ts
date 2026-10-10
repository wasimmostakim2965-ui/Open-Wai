import fsSync from "node:fs";
export declare function resolveNonblockingWriteFlag(constants?: Partial<Pick<typeof fsSync.constants, "O_NONBLOCK">>): number;
export declare function isNonRegularWriteOpenError(error: unknown, filePath: string, flags: number): Promise<boolean>;
export declare function isNonRegularWriteOpenErrorSync(error: unknown, filePath: string, flags: number): boolean;
