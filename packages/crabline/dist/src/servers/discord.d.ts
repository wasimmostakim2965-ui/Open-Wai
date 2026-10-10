import { type ServerEventObserver } from "./recorder.js";
export type DiscordServerManifest = {
    adminToken: string;
    applicationId: string;
    baseUrl: string;
    botToken: string;
    botUserId: string;
    driverBotToken: string;
    driverBotUserId: string;
    driverApplicationId: string;
    fixture: {
        channelId: string;
        guildId: string;
        voiceChannelId: string;
    };
    endpoints: {
        adminInboundUrl: string;
        apiRoot: string;
        gatewayBotUrl: string;
        gatewayUrl: string;
        voiceCaCertificate: string;
        voiceEndpoint: string;
    };
    env: {
        DISCORD_BOT_TOKEN: string;
    };
    provider: "discord";
    recorderPath: string;
    version: 1;
};
export type StartedDiscordServer = {
    close(): Promise<void>;
    manifest: DiscordServerManifest;
};
export type StartDiscordServerParams = {
    adminToken?: string | undefined;
    applicationId?: string | undefined;
    attachmentUrlTtlMs?: number | undefined;
    botToken?: string | undefined;
    botUserId?: string | undefined;
    botUsername?: string | undefined;
    driverBotToken?: string | undefined;
    driverBotUserId?: string | undefined;
    driverBotUsername?: string | undefined;
    fixtureChannelId?: string | undefined;
    fixtureGuildId?: string | undefined;
    fixtureVoiceChannelId?: string | undefined;
    heartbeatIntervalMs?: number | undefined;
    host?: string | undefined;
    identifyTimeoutMs?: number | undefined;
    maxGatewayPayloadBytes?: number | undefined;
    onEvent?: ServerEventObserver | undefined;
    port?: number | undefined;
    recorderPath?: string | undefined;
};
export declare function discordDirectChannelId(botUserId: string, recipientId: string): string;
export declare function startDiscordServer(params?: StartDiscordServerParams): Promise<StartedDiscordServer>;
