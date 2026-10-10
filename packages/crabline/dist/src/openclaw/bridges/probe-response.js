export async function throwProbeHttpError(response, message) {
    void response.body?.cancel().catch(() => undefined);
    throw new Error(message);
}
//# sourceMappingURL=probe-response.js.map