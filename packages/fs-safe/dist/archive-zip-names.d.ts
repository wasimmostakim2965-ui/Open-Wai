export declare function zipFormat(message: string): never;
export declare function zipUInt64(bytes: Buffer, offset: number): number;
export declare function zipExtraFields(bytes: Buffer): Map<number, Buffer>;
export declare function zipPathKey(name: string): string;
export declare function admitZipNames(params: {
    central: Buffer;
    local: Buffer;
    flags: number;
    centralExtra: Map<number, Buffer>;
    localExtra: Map<number, Buffer>;
    seen: Set<string>;
}): {
    path?: string;
    portableKey: string;
    portableDirectory: boolean;
    directory: boolean;
};
