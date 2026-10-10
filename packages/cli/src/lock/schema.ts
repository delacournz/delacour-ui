import { z } from "zod";

/**
 * `native-components.lock.json` — what was copied in, and from where.
 *
 * One entry per file: the registry ref it came from and a hash of the text as
 * the registry served it. That pair is the whole record. An item names the
 * library's own source at a commit, so the pristine file can be fetched again
 * from `ref` whenever it is needed, and `hash` says whether what came back is
 * really what was written — a branch name moves, a commit does not.
 *
 * Kept out of `native-components.json` because that file is written by a
 * person and this one never is.
 */

const lockFileSchema = z.object({
	/** The registry ref the file was copied from. */
	ref: z.string().min(1),
	/** `sha256-<hex>` of the text written, before anyone edited or formatted it. */
	hash: z.string().regex(/^sha256-[0-9a-f]{64}$/),
});

const lockItemSchema = z.object({
	/** Keyed by `<namespace>/<target>`, the string the registry index lists a file as. */
	files: z.record(z.string(), lockFileSchema),
});

export const lockSchema = z.object({
	$schema: z.string().optional(),
	version: z.literal(1),
	items: z.record(z.string(), lockItemSchema),
});

export type Lock = z.infer<typeof lockSchema>;
export type LockFile = z.infer<typeof lockFileSchema>;

export const LOCK_FILENAME = "native-components.lock.json";

export const LOCK_SCHEMA_URL =
	"https://raw.githubusercontent.com/delacournz/delacour-ui/main/registry/lock.schema.json";
