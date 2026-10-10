import path from "node:path";
export function isManagedRecorderDirectory(directory, platform = process.platform) {
    const resolved = path.resolve(directory);
    const managedDirectories = [
        path.resolve(".crabline", "servers"),
        path.resolve("artifacts", "crabline"),
    ];
    if (platform !== "win32") {
        return managedDirectories.includes(resolved);
    }
    const key = path.win32.normalize(resolved).toLowerCase();
    return managedDirectories.some((candidate) => path.win32.normalize(candidate).toLowerCase() === key);
}
//# sourceMappingURL=recorder-directory.js.map