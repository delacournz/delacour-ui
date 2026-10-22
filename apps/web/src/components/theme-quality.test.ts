import { expect, test } from "bun:test";
import { DEFAULT_CONFIG } from "@delacour/design-system/config";
import { auditTheme, QUALITY_STATUS } from "@delacour/design-system/quality";
import { resolveTokens } from "@delacour/design-system/resolve";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ThemeQuality } from "./theme-quality";

test("the server HTML contains the shared results and tokens for both modes", () => {
	const tokens = resolveTokens(DEFAULT_CONFIG);
	tokens.light["primary-foreground"] = tokens.light.primary;
	const results = auditTheme(tokens);
	const html = renderToStaticMarkup(createElement(ThemeQuality, { results }));
	expect(html).toContain("Light");
	expect(html).toContain("Dark");
	for (const result of results) {
		expect(html).toContain(result.label);
		expect(html).toContain(`--${result.foreground}`);
		expect(html).toContain(`--${result.background}`);
		expect(html).toContain(QUALITY_STATUS[result.status]);
	}
	expect(html).toContain("does not certify accessibility");
});
