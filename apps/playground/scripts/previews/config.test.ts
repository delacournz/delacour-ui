import { describe, expect, test } from "bun:test";
import { MEDIA_DIR, mediaPaths, mediaUrls, mediaVersion } from "./config";

const bytes = (text: string): Uint8Array => new TextEncoder().encode(text);

describe("mediaPaths", () => {
	test("puts a demo's files under its full id, one pair per theme", () => {
		expect(mediaPaths("screen/navbar/default", "dark")).toEqual({
			dir: `${MEDIA_DIR}/screen/navbar/default`,
			poster: `${MEDIA_DIR}/screen/navbar/default/dark.png`,
			video: `${MEDIA_DIR}/screen/navbar/default/dark.mp4`,
		});
	});
});

describe("mediaUrls", () => {
	test("carries the media version as the cache-buster", () => {
		expect(mediaUrls("switch/colours", "light", "0123456789ab")).toEqual({
			poster: "/previews/switch/colours/light.png?v=0123456789ab",
			video: "/previews/switch/colours/light.mp4?v=0123456789ab",
		});
	});
});

describe("mediaVersion", () => {
	test("is twelve hex characters", () => {
		expect(mediaVersion([bytes("poster")])).toMatch(/^[0-9a-f]{12}$/);
	});

	test("is the same for the same bytes, so an identical recapture keeps its URL", () => {
		expect(mediaVersion([bytes("a"), bytes("b")])).toBe(mediaVersion([bytes("a"), bytes("b")]));
	});

	test("moves when any file's bytes move, so a recapture of an unchanged demo is never served from cache", () => {
		expect(mediaVersion([bytes("a"), bytes("b")])).not.toBe(mediaVersion([bytes("a"), bytes("c")]));
	});

	test("tells two files apart from one file holding both", () => {
		// Each file is length-prefixed, so moving a byte across the boundary moves the version.
		expect(mediaVersion([bytes("ab"), bytes("c")])).not.toBe(mediaVersion([bytes("a"), bytes("bc")]));
	});
});
