export declare function isWindowsSeparator(value: string, offset: number): boolean;
export declare function hasWindowsDrivePrefix(value: string, offset?: number): boolean;
/** Classify a raw prefix without normalizing any path components. */
export declare function windowsNamespaceMarker(value: string): "." | "?" | undefined;
export declare function rootedWindowsDriveColonIndex(value: string): number;
/**
 * True when dot-like components climb above the start of `segments`. Win32
 * trims trailing dots and spaces, so any all-dot or all-space component other
 * than `.` is counted as a parent step.
 */
export declare function windowsSegmentsClimbAbove(segments: readonly string[]): boolean;
/**
 * Comparable share or device root of a path spelled with two leading
 * separators, excluding namespaced drive roots such as `\\?\C:\`.
 * Returns undefined for drive, rooted, and relative spellings, and null when
 * the spelling alone cannot establish which share or device it reaches.
 */
export declare function windowsShareOrDeviceRoot(value: string): string | null | undefined;
