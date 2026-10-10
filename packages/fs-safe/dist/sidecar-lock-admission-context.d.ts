type AdmissionIdentity = {
    active: boolean;
    admissions: Map<string, object>;
    normalizedTargetPath: string;
    token: object;
};
type SidecarAdmissionAncestry = readonly AdmissionIdentity[];
/** Capture active ancestry now; later lifecycle changes cannot reclassify this call. */
export declare function captureSidecarAdmissionAncestry(): SidecarAdmissionAncestry;
export declare function ancestryHasSidecarAdmission(ancestry: SidecarAdmissionAncestry, admissions: Map<string, object>, normalizedTargetPath: string): boolean;
export declare function createSidecarAdmissionController(ancestry: SidecarAdmissionAncestry, admissions: Map<string, object>, normalizedTargetPath: string): {
    readonly owns: boolean;
    hasToken: () => boolean;
    release(): void;
    reserve(): void;
    run<T>(callback: () => T): T;
};
export {};
