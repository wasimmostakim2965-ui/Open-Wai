import type { RetainedEntryPublication, RetainEntryForPublicationOptions } from "./entry-publication-types.js";
/**
 * Retain an existing directory, single-link regular file or symlink for ONE-WAY export.
 * Requires caller-exclusive source namespace and stable admitted topology.
 * Native destination absence is atomic; POSIX source identity is NOT CAS.
 * All operation results settle descriptors, never delete or reverse names.
 */
export declare function retainEntryForPublication(options: RetainEntryForPublicationOptions): RetainedEntryPublication;
