/** True if stat succeeds; follows symlinks, so broken links return false. */
export declare function pathExists(filePath: string): Promise<boolean>;
/** Synchronous {@link pathExists}. */
export declare function pathExistsSync(filePath: string): boolean;
