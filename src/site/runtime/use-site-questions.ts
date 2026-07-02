import { useEffect, useMemo, useState } from "react";
import type { SiteQuestionItem } from "./site-questions-model";
import { siteApiJson, type SiteApiQuestionsResponse } from "./site-public-api";

function splitAnswer(answer: string) {
  return answer
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function useSiteQuestions() {
  const [payload, setPayload] = useState<SiteApiQuestionsResponse>({ items: [] });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isDisposed = false;
    setIsLoading(true);
    setErrorMessage(null);

    siteApiJson<SiteApiQuestionsResponse>("/site/questions")
      .then((nextPayload) => {
        if (isDisposed) {
          return;
        }
        setPayload(nextPayload);
        setIsLoading(false);
      })
      .catch((error: unknown) => {
        if (isDisposed) {
          return;
        }
        setPayload({ items: [] });
        setErrorMessage(error instanceof Error ? error.message : "Не удалось загрузить вопросы");
        setIsLoading(false);
      });

    return () => {
      isDisposed = true;
    };
  }, []);

  const questions = useMemo<readonly SiteQuestionItem[]>(
    () =>
      payload.items.map((item) => ({
        id: String(item.id),
        question: item.question,
        answerParagraphs: splitAnswer(item.answer),
        isInitiallyExpanded: item.is_expanded_by_default,
      })),
    [payload],
  );

  const initialOpenIds = useMemo<string[]>(
    () => questions.filter((item) => item.isInitiallyExpanded).map((item) => item.id),
    [questions],
  );

  return {
    questions,
    initialOpenIds,
    isLoading,
    errorMessage,
    isEmpty: questions.length === 0,
  };
}
