import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import type { PreviewId } from "@/previews/manifest";
import { type DocsPage, heroOf, isPreviewId, pageKey } from "./page";

/**
 * The docs pages as they are on disk, for the scripts and the test that keep
 * `heroes.ts` honest. Never imported by the site: the server reads pages
 * through Fumadocs, and has no `content/` beside it.
 */

const CONTENT = join(import.meta.dir, "../../content/docs");

export type ContentPage = DocsPage & {
	key: string;
	/** Absent when the page has no preview, or names one the manifest does not have. */
	hero?: PreviewId;
};

function frontmatter(source: string, key: string): string | undefined {
	const block = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
	return block
		.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1]
		?.trim()
		.replace(/^(["'])(.*)\1$/, "$2");
}

export async function readPages(): Promise<ContentPage[]> {
	const entries = await readdir(CONTENT, { withFileTypes: true, recursive: true });
	const paths = entries
		.filter((entry) => entry.isFile() && entry.name.endsWith(".mdx"))
		.map((entry) => join(entry.parentPath, entry.name))
		.sort();

	return Promise.all(
		paths.map(async (path) => {
			const source = await readFile(path, "utf8");
			const slugs = relative(CONTENT, path)
				.replace(/\.mdx$/, "")
				.split("/")
				.filter((slug) => slug !== "index");
			const hero = heroOf(source);

			return {
				key: pageKey(slugs),
				slugs,
				title: frontmatter(source, "title") ?? "",
				description: frontmatter(source, "description"),
				hero: hero && isPreviewId(hero) ? hero : undefined,
			};
		})
	);
}
