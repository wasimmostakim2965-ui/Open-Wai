export declare const NONCE_FIXTURE_ID_ERROR = "fixture id must contain only letters, numbers, and hyphens";
export declare function isValidNonceFixtureId(fixtureId: string): boolean;
export declare function createNonce(fixtureId: string): string;
export declare function extractNonces(text: string): string[];
export declare function extractNonce(text: string): string | null;
