export type SiteQuestionItem = {
  id: string;
  question: string;
  answerParagraphs: readonly string[];
  isInitiallyExpanded: boolean;
};
