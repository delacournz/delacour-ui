import { createFileRoute } from "@tanstack/react-router";
import { llms } from "fumadocs-core/source";
import { source } from "@/lib/source";
import { LLMS_PREAMBLE } from "@/lib/structured-data";

export const Route = createFileRoute("/llms.txt")({
	server: {
		handlers: {
			GET() {
				return new Response(`${LLMS_PREAMBLE}${llms(source).index()}`, {
					headers: { "Content-Type": "text/plain; charset=utf-8" },
				});
			},
		},
	},
});
