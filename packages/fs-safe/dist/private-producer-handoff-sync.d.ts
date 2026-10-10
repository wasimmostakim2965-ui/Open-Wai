import { type OwnedFileDescriptorSync } from "./create-owned-file.js";
import { type CreatedHandoffParams } from "./private-producer-handoff.js";
export declare function handoffCreatedFileSync(params: CreatedHandoffParams<OwnedFileDescriptorSync, void>): OwnedFileDescriptorSync;
