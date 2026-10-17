import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { questionnaireDemos } from "@/demos/questionnaire";

export default function QuestionnaireGallery(): ReactElement {
	return <DemoGallery demos={questionnaireDemos} title="Questionnaire" />;
}
