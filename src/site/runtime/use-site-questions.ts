import { useMemo } from "react";
import { siteQuestionsMockPayload, type SiteQuestionItem } from "./site-questions-mock";

export function useSiteQuestions() {
  const questions = useMemo<readonly SiteQuestionItem[]>(() => siteQuestionsMockPayload.items, []);
  const initialOpenIds = useMemo<string[]>(
    () => questions.filter((item) => item.isInitiallyExpanded).map((item) => item.id),
    [questions],
  );

  return {
    questions,
    initialOpenIds,
    isLoading: false,
    errorMessage: null as string | null,
    isEmpty: questions.length === 0,
  };
}
