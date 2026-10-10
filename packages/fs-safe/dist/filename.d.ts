export declare function suffixWindowsReservedDeviceName(fileName: string): string;
/** Keeps short names exact and trims only the filename tail of a composite temp name. */
export declare function fitFileNameToPortableComponent(params: {
    prefix: string;
    fileName: string;
    suffix: string;
}): string;
export declare function sanitizeUntrustedFileName(fileName: string, fallbackName: string): string;
