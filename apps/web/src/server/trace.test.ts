import { expect, test } from "bun:test";
import { traceRequest } from "@/server/trace";

test("passes the response through with no provider registered", async () => {
	const response = new Response("ok", { status: 200 });
	expect(await traceRequest(new Request("http://x.test/docs"), () => response)).toBe(response);
});

test("passes a non-Response body through", async () => {
	expect(await traceRequest(new Request("http://x.test/"), () => undefined)).toBeUndefined();
});

test("rethrows what the handler throws", async () => {
	const thrown = new Error("boom");
	await expect(
		traceRequest(new Request("http://x.test/", { headers: { traceparent: "bogus" } }), () => {
			throw thrown;
		})
	).rejects.toBe(thrown);
});
