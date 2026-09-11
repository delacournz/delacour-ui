import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useFumadocsLoader } from "fumadocs-core/source/client";
import { DocsLayout } from "fumadocs-ui/layouts/notebook";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/notebook/page";
import { Suspense, use } from "react";
import { DocsToolbar } from "@/components/docs-toolbar";
import { useMDXComponents } from "@/components/mdx";
import { playgroundSlugForDocsPath } from "@/lib/components";
import { baseOptions } from "@/lib/layout.shared";
import { docsImageRoute, encodeMarkdownUrl, siteUrl } from "@/lib/shared";
import { docs, source } from "@/lib/source";

export const Route = createFileRoute("/docs/$")({
	component: Page,
	loader: async ({ params }) => {
		const slugs = params._splat?.split("/") ?? [];
		const data = await serverLoader({ data: slugs });
		await docs.getPage(data.path)?.preload();
		return data;
	},
	head: ({ loaderData }) => ({
		meta: loaderData
			? [
					{ property: "og:image", content: docsImageUrl(loaderData.title) },
					{ name: "twitter:image", content: docsImageUrl(loaderData.title) },
				]
			: [],
	}),
});

const serverLoader = createServerFn({
	method: "GET",
})
	.validator((slugs: string[]) => slugs)
	.handler(async ({ data: slugs }) => {
		const page = source.getPage(slugs);
		if (!page) throw notFound();

		return {
			path: page.path,
			title: page.data.title,
			markdownUrl: encodeMarkdownUrl(page.slugs, page.locale),
			pageTree: await source.serializePageTree(source.getPageTree()),
		};
	});

/** The social card for a docs page: the shared route, with this page's title in the query. */
function docsImageUrl(title: string): string {
	return `${siteUrl}${docsImageRoute}?${new URLSearchParams({ title })}`;
}

function Content({ path, markdownUrl }: { path: string; markdownUrl: string }) {
	const page = docs.getPage(path);
	if (!page) throw new Error(`unknown page: ${path}`);

	const { toc } = use(page.load());
	const MDX = page.body;
	const playgroundSlug = playgroundSlugForDocsPath(path);

	return (
		<DocsPage toc={toc}>
			<DocsTitle>{page.title}</DocsTitle>
			<DocsDescription>{page.description}</DocsDescription>
			<DocsToolbar markdownUrl={markdownUrl} path={path} slug={playgroundSlug} />
			<DocsBody>
				<MDX components={useMDXComponents()} />
			</DocsBody>
		</DocsPage>
	);
}

/**
 * The notebook layout, not `fumadocs-ui/layouts/docs`: only this one takes
 * `tabMode="navbar"`, which lifts the root-folder tabs (Getting Started,
 * Components, Releases) out of the sidebar and into the top bar.
 */
function Page() {
	const { path, pageTree, markdownUrl } = useFumadocsLoader(Route.useLoaderData());

	return (
		<DocsLayout {...baseOptions()} tree={pageTree} tabMode="navbar">
			<Suspense>
				<Content path={path} markdownUrl={markdownUrl} />
			</Suspense>
		</DocsLayout>
	);
}
