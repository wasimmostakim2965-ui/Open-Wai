import type { NativeWindowsSecurityFacts } from "./native-binding.js";
export type DescriptorFacts = Pick<NativeWindowsSecurityFacts, "ownerSid" | "currentUserSid" | "daclPresent" | "isLocal" | "aceListComplete" | "unsupportedAceTypes" | "aces">;
export declare function unverified(message: string, cause?: unknown): never;
/** Validate policy-free observations crossing the isolated batch transport. */
export declare function parseWindowsOwnerAndDaclFacts(value: unknown): DescriptorFacts;
/** Raw reporting retains unknown flag bits; secure admission validates them below. */
export declare function parseWindowsSecurityCommandFacts(value: unknown): NativeWindowsSecurityFacts;
/** Native and command observations share the same fail-closed admission policy. */
export declare function validateSecureWindowsSecurityFacts(value: unknown): NativeWindowsSecurityFacts;
