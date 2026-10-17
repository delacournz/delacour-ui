import { Support } from "@delacour/react-native-ui/support";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Help-centre articles",
	caption: "Pages from the help centre, with the collection each sits in as a caption.",
};

const ARTICLES = [
	{ title: "How long does a refund take?", collection: "Payments" },
	{ title: "Changing the address on an order", collection: "Orders" },
	{ title: "Resetting your password", collection: "Account" },
] as const;

export function Demo(): ReactElement {
	return (
		<Support.Articles description="Answers to what people ask most." title="Popular articles">
			{ARTICLES.map((article) => (
				<Support.Article collection={article.collection} key={article.title} onPress={() => {}} title={article.title} />
			))}
		</Support.Articles>
	);
}
