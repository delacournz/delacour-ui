import { expect, test } from "bun:test";
import { traceRequest } from "@/server/trace";

const ok = () => 200;

test("passes the response through with no provider registered", async () => {
	const response = new Response("ok", { status: 200 });
	expect(await traceRequest(new Request("http://x.test/docs"), () => response, ok)).toBe(response);
});

test("passes a non-Response body through", async () => {
	expect(await traceRequest(new Request("http://x.test/"), () => undefined, ok)).toBeUndefined();
	expect(await traceRequest(new Request("http://x.test/"), () => "<html></html>", ok)).toBe("<html></html>");
});

test("rethrows what the handler throws", async () => {
	const thrown = new Error("boom");
	await expect(
		traceRequest(
			new Request("http://x.test/", { headers: { traceparent: "bogus" } }),
			() => {
				throw thrown;
			},
			ok
		)
	).rejects.toBe(thrown);
});
