import type { DescriptorFacts } from "./windows-security-facts.js";
export type WindowsAceFlags = {
    raw: number;
    objectInherit: boolean;
    containerInherit: boolean;
    noPropagateInherit: boolean;
    inheritOnly: boolean;
    inherited: boolean;
    successfulAccess: boolean;
    failedAccess: boolean;
};
export type WindowsAccessControlEntry = {
    sid: string;
    mask: number;
    aceType: "allow" | "deny";
    flags: WindowsAceFlags;
};
export type OwnerAndDaclResult = {
    status: "supported";
    ownerSid: string;
    currentUserSid: string;
    daclPresent: boolean;
    isLocal: boolean;
    complete: boolean;
    unsupportedAceTypes: number[];
    aces: WindowsAccessControlEntry[];
} | {
    status: "unsupported-platform";
    platform: NodeJS.Platform;
};
export declare function readOwnerAndDacl(targetPath: string): OwnerAndDaclResult;
export declare function projectOwnerAndDacl(facts: DescriptorFacts): OwnerAndDaclResult;
