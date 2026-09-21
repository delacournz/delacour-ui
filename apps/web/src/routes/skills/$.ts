import { findSkill } from "@delacour/skills";
import { createFileRoute } from "@tanstack/react-router";

/**
 * The agent skill, served as files: `/skills/delacour-ui/SKILL.md` and the two
 * references beside it.
 *
 * `delacour skills` writes the same bytes into a project, and this is the copy
 * for everything else — an agent with a fetch tool and no CLI, a `curl` in a
 * Dockerfile, a reader who wants to see what the thing says before running it.
 * Both read `@delacour/skills`, so neither can be the stale one.
 *
 * A route handler rather than files under `public/`, for the reason the
 * `.well-known` pair next door are: Nitro types a static response from its
 * extension, and `text/markdown` is what an agent should get rather than the
 * `text/plain` a `.md` file would be served as.
 *
 * Link to it with a plain `<a>`. `isFileHref` in `src/lib/shared.ts` already
 * makes MDX do that for any internal href whose last segment carries an
 * extension — see the `Anchor` override in `src/components/mdx.tsx`.
 */
export const Route = createFileRoute("/skills/$")({
	server: {
		handlers: {
			GET({ params }) {
				const segments = params._splat?.split("/").filter(Boolean) ?? [];
				const [name, ...rest] = segments;

				const skill = name ? findSkill(name) : undefined;

				// A bare `/skills/delacour-ui` is the skill itself, not an index.
				const path = rest.length > 0 ? rest.join("/") : "SKILL.md";
				const file = skill?.files.find((candidate) => candidate.path === path);

				// A plain 404 rather than `notFound()`: thrown from a server handler
				// that is what the router renders a page for, and this route has no
				// component — the reply came back `200` with a JSON error body in it.
				if (!file) return new Response(`No such skill file: ${segments.join("/")}\n`, { status: 404 });

				return new Response(file.content, {
					headers: {
						"Content-Type": "text/markdown; charset=utf-8",
						"Cache-Control": "public, max-age=0, must-revalidate",
					},
				});
			},
		},
	},
});
