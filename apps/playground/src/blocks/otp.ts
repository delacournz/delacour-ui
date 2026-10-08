/** How many digits a one-time code has. */
export const OTP_LENGTH = 6;

export type OtpInputResult = {
	readonly digits: readonly string[];
	/** The box that should hold focus after the change. */
	readonly focus: number;
};

/**
 * Apply one box's change event to the code.
 *
 * One digit types into the box and advances; an empty value clears it and steps
 * back; more than one digit is a paste or an autofill and spreads from the first
 * box. Anything that is not a digit is dropped.
 */
export function applyOtpInput(digits: readonly string[], index: number, raw: string): OtpInputResult {
	const typed = raw.replace(/\D/g, "");
	const last = OTP_LENGTH - 1;

	if (raw === "") {
		const next = digits.map((digit, at) => (at === index ? "" : digit));
		return { digits: next, focus: Math.max(0, index - 1) };
	}
	if (typed === "") return { digits, focus: index };

	if (typed.length > 1) {
		const next = Array.from({ length: OTP_LENGTH }, (_, at) => typed[at] ?? "");
		return { digits: next, focus: Math.min(last, typed.length - 1) };
	}

	const next = digits.map((digit, at) => (at === index ? typed : digit));
	return { digits: next, focus: Math.min(last, index + 1) };
}

export function otpCode(digits: readonly string[]): string {
	return digits.join("");
}

export function isOtpComplete(digits: readonly string[]): boolean {
	return digits.length === OTP_LENGTH && digits.every((digit) => digit !== "");
}
