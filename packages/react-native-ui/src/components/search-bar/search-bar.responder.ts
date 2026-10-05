/**
 * Claims the touch for React Native's responder system, so the keyboard stays.
 *
 * `Pressable` is a Gesture Handler tap, which the JS responder system never
 * sees. A `ScrollView` with `keyboardShouldPersistTaps="handled"` — every
 * `Screen.ScrollArea`, and the token row — therefore finds the tap unclaimed,
 * becomes the responder itself and blurs the focused field on release. Clear
 * and a token's remove control are the start of the next query, not the end of
 * this one, so the view around each claims the touch first. The tap still
 * reaches the gesture handler, which runs natively and independently.
 */
export function claimSearchBarTouch(): boolean {
	return true;
}
