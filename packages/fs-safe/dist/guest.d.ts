import { GUEST_FILESYSTEM_RENAME_NO_REPLACE_PYTHON } from "./guest-native-python.js";
/** Exclusive create found an existing destination, including a lost publication race. */
export declare const GUEST_FILESYSTEM_CREATE_EXISTS_EXIT_CODE = 17;
/** Read found a missing parent or file after the admitted root was opened. */
export declare const GUEST_FILESYSTEM_READ_NOT_FOUND_EXIT_CODE = 2;
/** Python 3 source for the descriptor-relative guest filesystem protocol. See docs/guest.md. */
export declare const GUEST_FILESYSTEM_PYTHON: string;
export { GUEST_FILESYSTEM_RENAME_NO_REPLACE_PYTHON };
