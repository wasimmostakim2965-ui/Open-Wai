export type NativeIdRule = {
    example: string;
    name: string;
    pattern: RegExp;
    validate?: ((value: string) => boolean) | undefined;
};
export declare function matchesNativeId(value: string, rule: NativeIdRule): boolean;
export declare function numericNativeId(value: number | bigint): string | undefined;
