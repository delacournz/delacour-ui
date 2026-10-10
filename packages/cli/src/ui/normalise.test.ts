import { describe, expect, test } from "bun:test";
import { sameModuloFormatting } from "./normalise";

const REGISTRY = `import { View } from "react-native";

export function Card({ className, children }: CardProps) {
	return (
		<View className={cn("rounded-lg p-4", className)}>
			{children}
		</View>
	);
}
`;

describe("sameModuloFormatting", () => {
	test("a file is the same as itself", () => {
		expect(sameModuloFormatting(REGISTRY, REGISTRY)).toBe(true);
	});

	test("sees through indentation, quotes, semicolons and trailing commas", () => {
		const prettier = `import { View } from 'react-native'

export function Card({
  className,
  children,
}: CardProps) {
  return (
    <View className={cn('rounded-lg p-4', className)}>{children}</View>
  )
}
`;

		expect(sameModuloFormatting(REGISTRY, prettier)).toBe(true);
	});

	test("an edited class list is an edit", () => {
		expect(sameModuloFormatting(REGISTRY, REGISTRY.replace("rounded-lg p-4", "rounded-lg p-6"))).toBe(false);
	});

	// Whitespace inside a string is content. `p-4 m-2` and `p-4m-2` are two
	// different class lists.
	test("whitespace inside a string is not layout", () => {
		expect(sameModuloFormatting('cn("p-4 m-2")', 'cn("p-4m-2")')).toBe(false);
		expect(sameModuloFormatting('cn("p-4 m-2")', 'cn("p-4  m-2")')).toBe(false);
	});

	test("whitespace between two words is kept, so they do not run together", () => {
		expect(sameModuloFormatting("return x", "returnx")).toBe(false);
		expect(sameModuloFormatting("const a = 1", "const   a=1;")).toBe(true);
	});

	test("an added line is an edit", () => {
		expect(sameModuloFormatting(REGISTRY, REGISTRY.replace("{children}", "{children}\n\t\t\t<Footer />"))).toBe(false);
	});

	test("an apostrophe in a comment does not swallow the rest of the file", () => {
		const a = "// don't\nconst a = 1;\nconst b = 2;\n";
		const b = "// don't\nconst a = 1\nconst b = 3\n";

		expect(sameModuloFormatting(a, b)).toBe(false);
		expect(sameModuloFormatting(a, a.replaceAll(";", ""))).toBe(true);
	});
});
