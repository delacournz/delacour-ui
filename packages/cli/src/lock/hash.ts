import { createHash } from "node:crypto";

/**
 * The hash a lock entry carries, and the one a file on disk is tested against.
 *
 * Line endings are folded to `\n` first. A Windows checkout with
 * `core.autocrlf` rewrites every one of them, and a file nobody touched must
 * not read as edited because of it.
 */
export function contentHash(content: string): string {
	return `sha256-${createHash("sha256").update(content.replaceAll("\r\n", "\n")).digest("hex")}`;
}
