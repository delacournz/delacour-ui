import { describe, expect, test } from "bun:test";
import { createElement, Fragment } from "react";
import { findInteractiveChild, warnInteractiveChildInAccessible } from "./interactive-child";

function Box(props: Record<string, unknown>) {
	return createElement("box", props);
}
Box.displayName = "Box";

function Tap(props: Record<string, unknown>) {
	return createElement("tap", props);
}

describe("findInteractiveChild", () => {
	test("finds nothing in text and plain boxes", () => {
		const tree = createElement(Box, null, "Hello", createElement(Box, null, 42));
		expect(findInteractiveChild(tree)).toBeUndefined();
	});

	test("finds nothing in null, booleans and empty arrays", () => {
		expect(findInteractiveChild(null)).toBeUndefined();
		expect(findInteractiveChild(false)).toBeUndefined();
		expect(findInteractiveChild([])).toBeUndefined();
	});

	test("finds a child with onPress and names it by displayName", () => {
		const tree = createElement(Box, null, createElement(Box, { onPress: () => undefined }));
		expect(findInteractiveChild(tree)).toEqual({ name: "Box", reason: "onPress" });
	});

	test("falls back to the function name, then the host type", () => {
		expect(findInteractiveChild(createElement(Tap, { onLongPress: () => undefined }))).toEqual({
			name: "Tap",
			reason: "onLongPress",
		});
		expect(findInteractiveChild(createElement("view", { onPress: () => undefined }))).toEqual({
			name: "view",
			reason: "onPress",
		});
	});

	test("finds a child whose role is a control", () => {
		for (const role of ["button", "link", "switch", "checkbox", "radio", "adjustable", "slider", "tab"]) {
			const tree = createElement(Box, null, createElement(Box, { accessibilityRole: role }));
			expect(findInteractiveChild(tree)).toEqual({ name: "Box", reason: `role ${role}` });
		}
		expect(findInteractiveChild(createElement(Box, { role: "button" }))).toEqual({
			name: "Box",
			reason: "role button",
		});
	});

	test("ignores roles that are not controls", () => {
		for (const role of ["header", "image", "text", "summary", "none"]) {
			expect(findInteractiveChild(createElement(Box, { accessibilityRole: role }))).toBeUndefined();
		}
	});

	test("looks through fragments and arrays", () => {
		const tree = createElement(Fragment, null, [
			createElement(Box, { key: "a" }),
			createElement(Box, { key: "b", onPress: () => undefined }),
		]);
		expect(findInteractiveChild(tree)?.reason).toBe("onPress");
	});

	test("skips a subtree hidden from assistive technology — the mirrored duplicate", () => {
		const hiddenIos = createElement(
			Box,
			{ accessibilityElementsHidden: true },
			createElement(Box, { onPress: () => undefined })
		);
		const hiddenAndroid = createElement(Box, {
			importantForAccessibility: "no-hide-descendants",
			onPress: () => undefined,
		});
		const hiddenAria = createElement(Box, { "aria-hidden": true, onPress: () => undefined });
		expect(findInteractiveChild([hiddenIos, hiddenAndroid, hiddenAria])).toBeUndefined();
	});

	test("does not count a disabled-looking handler of undefined", () => {
		expect(findInteractiveChild(createElement(Box, { onPress: undefined }))).toBeUndefined();
	});

	test("stops at the depth limit", () => {
		let tree = createElement(Box, { onPress: () => undefined });
		for (let level = 0; level < 20; level++) tree = createElement(Box, null, tree);
		expect(findInteractiveChild(tree)).toBeUndefined();
		expect(findInteractiveChild(tree, { maxDepth: 25 })?.reason).toBe("onPress");
	});
});

describe("warnInteractiveChildInAccessible", () => {
	const interactive = createElement(Box, { onPress: () => undefined });

	test("warns once per component and child when the container is accessible", () => {
		const messages: string[] = [];
		const warn = (message: string) => messages.push(message);
		const options = { component: "Post", accessible: true, children: interactive, isDev: true, warn };
		warnInteractiveChildInAccessible(options);
		warnInteractiveChildInAccessible(options);
		expect(messages).toHaveLength(1);
		expect(messages[0]).toContain("[Post]");
		expect(messages[0]).toContain("Box");
		expect(messages[0]).toContain("accessibilityActions");
	});

	test("is silent when the container is not accessible", () => {
		const messages: string[] = [];
		warnInteractiveChildInAccessible({
			component: "Quiet",
			accessible: false,
			children: interactive,
			isDev: true,
			warn: (message) => messages.push(message),
		});
		expect(messages).toHaveLength(0);
	});

	test("is silent outside development", () => {
		const messages: string[] = [];
		warnInteractiveChildInAccessible({
			component: "Prod",
			accessible: true,
			children: interactive,
			isDev: false,
			warn: (message) => messages.push(message),
		});
		expect(messages).toHaveLength(0);
	});

	test("is silent when nothing inside is interactive", () => {
		const messages: string[] = [];
		warnInteractiveChildInAccessible({
			component: "Plain",
			accessible: true,
			children: createElement(Box, null, "text"),
			isDev: true,
			warn: (message) => messages.push(message),
		});
		expect(messages).toHaveLength(0);
	});
});
