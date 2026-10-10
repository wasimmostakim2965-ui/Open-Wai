import { Transform } from "node:stream";
export declare function createByteLimitTransform(maxBytes: number, overflowError: (bytes: number) => Error): Transform;
