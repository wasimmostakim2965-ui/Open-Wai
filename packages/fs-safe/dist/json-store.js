import path from "node:path";
import { fileStore } from "./file-store.js";
import {} from "./json-document-store.js";
import { admitStandalonePublicationPath, assertNoWindowsPathAlias } from "./windows-path-alias.js";
export function jsonStore(options) {
    const filePathInput = admitStandalonePublicationPath(options.filePath);
    const filePath = path.resolve(filePathInput);
    assertNoWindowsPathAlias(filePath);
    return fileStore({
        rootDir: path.dirname(filePath),
        private: true,
        mode: options.mode,
        dirMode: options.dirMode,
    }).json(path.basename(filePath), options);
}
