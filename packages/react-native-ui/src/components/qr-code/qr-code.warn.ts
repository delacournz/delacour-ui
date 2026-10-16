const WARNED = new Set<string>();

/** One development warning per distinct message, so a re-render does not flood the console. */
export function warnQrOnce(message: string): void {
	if (typeof __DEV__ === "undefined" || !__DEV__ || WARNED.has(message)) return;
	WARNED.add(message);
	console.warn(`[QRCode] ${message}`);
}
