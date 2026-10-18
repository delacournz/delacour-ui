import { expect, test } from "bun:test";
import { extractContext, withServerSpan } from "@/lib/tracing";

test("passes the result through with no provider registered", async () => {
	const response = new Response("ok", { status: 200 });
	const out = await withServerSpan(new Request("http://x.test/docs"), async () => ({ response }));
	expect(out.response).toBe(response);
});

test("rethrows a thrown Response (redirect) untouched", async () => {
	const thrown = new Response(null, { status: 302 });
	await expect(
		withServerSpan(new Request("http://x.test/"), async () => {
			throw thrown;
		})
	).rejects.toBe(thrown);
});

test("extractContext tolerates a request with no traceparent", () => {
	expect(extractContext(new Headers())).toBeDefined();
});
