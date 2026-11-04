import { createFileRoute } from "@tanstack/react-router";
import { componentsItemList } from "@/lib/structured-data";

/**
 * Every component as a schema.org `ItemList` — a machine-readable answer to
 * "what is in Delacour UI", for an AI system that reads JSON rather than pages.
 * `/llms.txt` names it.
 */
export const Route = createFileRoute("/api/components")({
	server: {
		handlers: {
			GET() {
				return Response.json(componentsItemList(), {
					headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" },
				});
			},
		},
	},
});
