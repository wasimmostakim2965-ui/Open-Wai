import type { ServerRecorder } from "./recorder.js";
export declare const DISCORD_VOICE_CA_CERTIFICATE = "-----BEGIN CERTIFICATE-----\nMIICyTCCAbGgAwIBAgIJALY9WPr2jw28MA0GCSqGSIb3DQEBCwUAMBQxEjAQBgNV\nBAMMCWxvY2FsaG9zdDAeFw0yNjA5MTQwMzEwNDFaFw0zNjA5MTEwMzEwNDFaMBQx\nEjAQBgNVBAMMCWxvY2FsaG9zdDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC\nggEBANYlzRW7jLNhSKK1X2Ch2aO7D0rCPyizrI63dRbubC7JNp8dd7eD74+XUhFU\n5eVHNpTffcudL1hhTv52//OdDrE3E+akKtEDHEUkESjdA5h8QYrud/uMwwQ1Akj8\ncU8CtQBxanKl5jL9Yxbni8vLq2pbll082yzywtyoaPuasgXbvVTg3j+rcfKlL0Us\ndCdsdt4gzL0pqdBw+ePhp5/7Gj/hNQgL0QGmcttq6F/lzZ9baaGfAq58758ypB1J\nZL6PjhzWFBR0ntExPpvGBxXrs2x/tCSvYx7C68z6x7a/ro+rt5PuWFbZuKoaZcY2\nLh+LNdvoC9Ujj+ax8+KJIJVmXYkCAwEAAaMeMBwwGgYDVR0RBBMwEYIJbG9jYWxo\nb3N0hwR/AAABMA0GCSqGSIb3DQEBCwUAA4IBAQCD0GgWGZ6dUbUS2xQmwP09mrPb\nN2wC+GJ7+/bOEOHQiyMtnr04O4Bx+6UHBL6sEP5mbnFvfRa+/I86gXUIKXKVGxAQ\nghPjnvNdsPxC4CyD/sCedXL2FVuE8jcgxSVs7LgR5lNgJZhzstIM0Yrtiz9Ue89w\nIONmc/4CMo6bzAag25N/64/Hc2XuaJLJGZHL3WD/qqLmXpAlJXQkOS0+OFpJU8f1\nZ7VtjO3PeN0yoSxR/6U1cjdo+Wcxzjf4ffBv53BxhguZjIcIrIGi2jgbzrjHIhi1\nuaj3H8CknPJu7Z1r3SgVzJ0Nxb22CkRQBw7osdAZCCKs66rxgOUn7kSI/qP3\n-----END CERTIFICATE-----";
type StartedDiscordVoiceServer = {
    caCertificate: string;
    close(): Promise<void>;
    endpoint: string;
    invalidateSession(sessionId: string): void;
};
export type DiscordVoiceSession = {
    guildId: string;
    sessionId: string;
    token: string;
    userId: string;
};
export declare function startDiscordVoiceServer(params: {
    authorize(session: DiscordVoiceSession): boolean;
    host: string;
    recorder: ServerRecorder;
}): Promise<StartedDiscordVoiceServer>;
export {};
