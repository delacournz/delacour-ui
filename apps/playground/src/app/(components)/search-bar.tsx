import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { searchBarDemos } from "@/demos/search-bar";

export default function SearchBarGallery(): ReactElement {
	return <DemoGallery demos={searchBarDemos} title="SearchBar" />;
}
