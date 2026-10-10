export declare const TELEGRAM_NATIVE_CHAT_ID_MAX: bigint;
export declare const TELEGRAM_BOT_USERNAME_PATTERN: RegExp;
export declare const TELEGRAM_CHAT_USERNAME_PATTERN: RegExp;
export declare function canonicalizeTelegramUsername(value: string): string | undefined;
export declare function telegramUsernameChatId(value: string): number | undefined;
export declare function isTelegramUsernameChatId(value: number): boolean;
