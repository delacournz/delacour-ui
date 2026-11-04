/**
 * Shared by the native mocks under `mocks/`: each module whose results feed native code a test
 * never reaches answers with this.
 */
/**
 * A value every property read and call of which returns another such value:
 * enough for a module whose results feed native code a test never reaches
 * (`Presets.System.selection()`, `Skia.Path.Make().addCircle(...)`).
 */
export function mockDeepStub(): unknown {
	const target = () => undefined;
	const handler: ProxyHandler<() => undefined> = {
		get: (_target, key) => (key === "then" ? undefined : mockDeepStub()),
		apply: () => mockDeepStub(),
	};
	return new Proxy(target, handler);
}
