const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 8;

/** The message under the email field, or nothing while it is empty or fine. */
export function emailError(email: string): string | undefined {
	if (email.length === 0 || EMAIL.test(email)) return undefined;
	return "Enter a valid email address.";
}

export function passwordError(password: string): string | undefined {
	if (password.length === 0 || password.length >= PASSWORD_MIN) return undefined;
	return `Use at least ${PASSWORD_MIN} characters.`;
}

export function canSubmitSignIn(email: string, password: string): boolean {
	return email.length > 0 && password.length > 0 && !emailError(email) && !passwordError(password);
}
