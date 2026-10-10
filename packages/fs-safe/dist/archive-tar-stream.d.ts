import type { ArchiveKind } from "./archive-kind.js";
import type { TarMeterLimits } from "./archive-limits.js";
import { type AdmittedTarMember } from "./archive-tar-wasm.js";
/** Buffers are private immutable snapshots, just like the staged file route. */
type TarInput = {
    archivePath: string;
    archiveBuffer?: never;
} | {
    archiveBuffer: Buffer;
    archivePath?: never;
};
export declare function inspectTar(params: TarInput & {
    limits: TarMeterLimits;
    signal?: AbortSignal;
    kind?: Exclude<ArchiveKind, "zip">;
    onMember?: (entry: AdmittedTarMember) => void;
}): Promise<void>;
/** Replay in physical order, retaining at most one decoded chunk. Every range
 * comes from complete admission of the immutable input. */
export declare function replayTar<T extends AdmittedTarMember>(params: TarInput & {
    limits: TarMeterLimits;
    signal?: AbortSignal;
    kind?: Exclude<ArchiveKind, "zip">;
    members: readonly T[];
    consume(member: T, payload: AsyncIterable<Buffer>): Promise<void>;
}): Promise<void>;
export {};
