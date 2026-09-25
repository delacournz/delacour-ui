import { defineConfig } from "fumadocs-mdx/config";
import { remarkComponentCount } from "./src/lib/remark-component-count";

/**
 * Global MDX options for every collection `src/lib/source.ts` declares.
 *
 * Kept global rather than on the collection on purpose: a collection-level
 * `mdxOptions` replaces Fumadocs' default plugins (GFM, heading ids, code
 * blocks, image sizes, the search structure), while a global one is merged
 * into them. The plugin here runs before Fumadocs' own postprocessing, which is
 * what lets `<ComponentCount />` reach the `.md` twins and `llms-full.txt` as
 * a word.
 */
export default defineConfig({
	mdxOptions: {
		remarkPlugins: [remarkComponentCount],
	},
});
