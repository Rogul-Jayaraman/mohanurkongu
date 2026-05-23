let _accessToken: string | null = null;

export const getAccessToken = (): string | null => _accessToken;
export const setAccessToken = (token: string | null): void => { _accessToken = token; };
export const clearAccessToken = (): void => { _accessToken = null; };
