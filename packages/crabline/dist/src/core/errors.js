import { EXIT_CODES } from "./exit-codes.js";
const KIND_TO_EXIT = {
    config: EXIT_CODES.CONFIG,
    auth: EXIT_CODES.AUTH,
    connectivity: EXIT_CODES.CONNECTIVITY,
    outbound: EXIT_CODES.OUTBOUND,
    inbound: EXIT_CODES.INBOUND,
    timeout: EXIT_CODES.TIMEOUT,
    assertion: EXIT_CODES.ASSERTION,
};
export class CrablineError extends Error {
    exitCode;
    hasExplicitExitCode;
    kind;
    constructor(message, options) {
        super(message, options);
        this.name = "CrablineError";
        this.hasExplicitExitCode = options?.exitCode !== undefined;
        this.kind = options?.kind;
        this.exitCode =
            options?.exitCode === EXIT_CODES.SUCCESS
                ? EXIT_CODES.FAILURE
                : (options?.exitCode ?? (options?.kind ? KIND_TO_EXIT[options.kind] : EXIT_CODES.FAILURE));
    }
}
export function ensureErrorMessage(error) {
    try {
        if (error instanceof Error) {
            const message = error.message;
            return typeof message === "string" ? message : String(message);
        }
        return String(error);
    }
    catch {
        return "Unknown error";
    }
}
//# sourceMappingURL=errors.js.map