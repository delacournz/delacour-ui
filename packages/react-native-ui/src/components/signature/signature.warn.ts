import { SIGNATURE_MISSING_ALTERNATIVE_WARNING } from "./signature.variants";

let warned = false;

/** One development warning per process for a Signature that offers no way to sign without drawing. */
export function warnSignatureMissingAlternativeOnce(): void {
	if (typeof __DEV__ === "undefined" || !__DEV__ || warned) return;
	warned = true;
	console.warn(`[Signature] ${SIGNATURE_MISSING_ALTERNATIVE_WARNING}`);
}

/** Forgets that the warning fired, so a suite can see it fire again. */
export function resetSignatureWarnings(): void {
	warned = false;
}
