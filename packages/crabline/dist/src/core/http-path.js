const PATH_BASE_URL = "http://localhost";
export function isCanonicalHttpPath(value) {
    try {
        const url = new URL(value, PATH_BASE_URL);
        return (url.origin === PATH_BASE_URL &&
            url.pathname === value &&
            url.search.length === 0 &&
            url.hash.length === 0);
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=http-path.js.map