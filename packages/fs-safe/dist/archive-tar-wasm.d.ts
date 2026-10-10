import { Transform, type TransformCallback } from "node:stream";
import type { TarMeterLimits } from "./archive-limits.js";
import type { TarEntryInfo } from "./archive-plan.js";
export type AdmittedTarMember = TarEntryInfo & {
    offset: number;
};
/** One bounded memory domain owns both admission and decompression. Its owner
 * must join the decoder and parser before disposing this shared instance. */
export declare class TarWasmSession {
    private abi;
    constructor(limits: TarMeterLimits);
    private bytes;
    private text;
    parse(chunk: Buffer, onMember?: (entry: AdmittedTarMember) => void): void;
    finish(): void;
    private codecError;
    decode(source: AsyncIterable<Buffer>, kind: "tar-zstd" | "tar-bzip2", signal?: AbortSignal): AsyncGenerator<Buffer>;
    dispose(): void;
}
/** Backpressure-aware transport only; all TAR semantics live in the Rust core. */
export declare class TarParserStream extends Transform {
    private readonly onMember?;
    private readonly session;
    private readonly ownsSession;
    constructor(limits: TarMeterLimits, onMember?: ((entry: AdmittedTarMember) => void) | undefined, session?: TarWasmSession);
    _transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback): void;
    _flush(callback: TransformCallback): void;
    _destroy(error: Error | null, callback: (error: Error | null) => void): void;
}
