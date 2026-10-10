export type FsSafeNativeMode = "auto" | "off" | "require";
export type FsSafeNativeConfig = {
    mode: FsSafeNativeMode;
};
export declare function configureFsSafeNative(config: Partial<FsSafeNativeConfig>): void;
export declare function getFsSafeNativeConfig(): FsSafeNativeConfig;
export declare function isFsSafeNativeRequired(): boolean;
export declare function __resetFsSafeNativeConfigForTest(): void;
