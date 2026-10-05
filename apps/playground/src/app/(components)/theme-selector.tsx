import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { themeSelectorDemos } from "@/demos/theme-selector";

export default function ThemeSelectorGallery(): ReactElement {
	return <DemoGallery demos={themeSelectorDemos} title="ThemeSelector" />;
}
