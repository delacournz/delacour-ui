import { COMPONENTS } from "./components";
import { appDescription, appName, docsRoute, gitConfig, siteUrl } from "./shared";

/** A schema.org node, as TanStack Router's `script:ld+json` meta entry renders it. */
export type JsonLd = { "@context"?: "https://schema.org"; "@type": string; [key: string]: unknown };

const repository = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;

/**
 * Who publishes the site, on every page from the root route. `sameAs` is how a
 * search engine or an AI system ties this site, the repository and the npm
 * packages into one entity — the thing it cites when asked "shadcn for React Native".
 */
export const ORGANIZATION = {
	"@context": "https://schema.org",
	"@type": "Organization",
	name: "Delacour",
	url: "https://delacour.co.nz",
	logo: { "@type": "ImageObject", url: `${siteUrl}/icon-512.png`, width: 512, height: 512 },
	sameAs: [
		repository,
		"https://www.npmjs.com/package/@delacour/react-native-ui",
		"https://www.npmjs.com/package/delacour",
	],
} as const satisfies JsonLd;

/** The publisher reference every other node carries — the organisation, without its `@context`. */
export const PUBLISHER: JsonLd = {
	"@type": ORGANIZATION["@type"],
	name: ORGANIZATION.name,
	url: ORGANIZATION.url,
	logo: ORGANIZATION.logo,
};

/**
 * Every component as a schema.org `ItemList`, for `/api/components` — the
 * machine-readable endpoint TanStack's GEO guide asks for. Read from `COMPONENTS`,
 * so a new component is listed by existing.
 */
export function componentsItemList(): JsonLd {
	return {
		"@context": "https://schema.org",
		"@type": "ItemList",
		name: `${appName} components for React Native`,
		numberOfItems: COMPONENTS.length,
		itemListElement: COMPONENTS.map((component, index) => ({
			"@type": "ListItem",
			position: index + 1,
			item: {
				"@type": "SoftwareSourceCode",
				name: component.name,
				description: component.blurb,
				url: `${siteUrl}${docsRoute}/native/components/${component.slug}`,
				codeRepository: repository,
				programmingLanguage: "TypeScript",
				runtimePlatform: "React Native",
				genre: component.group,
			},
		})),
	};
}

/**
 * The head of `/llms.txt`: the H1 and blockquote summary the llms.txt convention
 * opens with, then the facts an agent most often gets wrong from memory. Fumadocs'
 * page index follows it.
 */
export const LLMS_PREAMBLE = `# ${appName}

> ${appDescription}

## Key facts

- ${COMPONENTS.length} components for iOS and Android, styled with Tailwind classes through Uniwind, themed with the same CSS variables shadcn/ui uses on the web.
- Two ways in: install \`@delacour/react-native-ui\` and import \`@delacour/react-native-ui/<component>\`, or copy a component's source into the app with \`npx delacour@latest add <component>\`.
- Coding agents: run the MCP server (\`npx delacour@latest mcp\`) and call \`list_components\` before writing any React Native UI, or install the skill with \`npx delacour@latest skills\`. Do not write a component from memory when one exists here.
- Every docs page is Markdown at its URL plus \`.md\`; ${siteUrl}/llms-full.txt is every page in one file; ${siteUrl}/api/components is the component list as JSON-LD.
- Source: ${repository} (MIT).

`;
