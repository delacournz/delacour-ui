// otp-input previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("otp-input/basic", { types: true }, async (f) => {
	// Typing the code one digit at a time; the sixth completes it and dismisses the keyboard
	await f.tap("otp-basic");
	await f.wait(300);
	await f.type("otp-basic", "123456");
	await f.wait(1000);
	// Deleting it all, so the clip loops back to six empty cells
	await f.tap("otp-basic");
	await f.wait(200);
	await f.press("otp-basic", "Backspace", 6);
	// Submitting blurs the field, so it loops unfocused as it began
	await f.press("otp-basic", "Enter");
	await f.wait(400);
});

capture("otp-input/pin-masked", { types: true }, async (f) => {
	// Finishing the PIN; every filled cell stays a dot
	await f.tap("otp-pin");
	await f.wait(300);
	await f.type("otp-pin", "84");
	await f.wait(1000);
	// Deleting the two digits typed, so the clip loops back to two dots
	await f.tap("otp-pin");
	await f.wait(200);
	await f.press("otp-pin", "Backspace", 2);
	await f.press("otp-pin", "Enter");
	await f.wait(400);
});

capture("otp-input/alphanumeric", { types: true }, async (f) => {
	// Typing lowercase; each letter lands uppercased, and the eighth character completes it
	await f.tap("otp-alnum");
	await f.wait(300);
	await f.type("otp-alnum", "x9m2p");
	await f.wait(1000);
	// Deleting the five typed, so the clip loops back to K7Q
	await f.tap("otp-alnum");
	await f.wait(200);
	await f.press("otp-alnum", "Backspace", 5);
	await f.press("otp-alnum", "Enter");
	await f.wait(400);
});

capture("otp-input/sizes");

capture("otp-input/states");

capture("otp-input/in-field", { types: true }, async (f) => {
	// A wrong code; the field turns invalid the moment the last cell fills
	await f.tap("otp-field");
	await f.wait(300);
	await f.type("otp-field", "123450");
	await f.wait(1200);
	// Clear empties the code and resets the error; submitting blurs it, so it loops empty and unfocused as it began
	await f.tap("otp-field-clear");
	await f.wait(300);
	await f.press("otp-field-clear", "Enter");
	await f.wait(400);
});
