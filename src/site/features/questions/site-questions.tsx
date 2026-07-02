import { useEffect, useMemo, useState } from "react";
import type { SiteQuestionItem } from "../../runtime/site-questions-model";
import { SiteQuestionAccordionItem } from "./site-question-accordion-item";
import "./site-questions.css";

export function SiteQuestionsView({
  questions,
  initialOpenIds,
  isEmpty,
}: {
  questions: readonly SiteQuestionItem[];
  initialOpenIds: readonly string[];
  isEmpty: boolean;
}) {
  const [openIds, setOpenIds] = useState<string[]>(() => [...initialOpenIds]);

  const normalizedOpenIds = useMemo(() => openIds.filter((id) => questions.some((item) => item.id === id)), [openIds, questions]);

  useEffect(() => {
    setOpenIds([...initialOpenIds]);
  }, [initialOpenIds]);

  return (
    <section className="site-questions" aria-labelledby="site-questions-title">
      <h1 id="site-questions-title" className="site-questions__page-title">
        ВОПРОСЫ
      </h1>

      {isEmpty ? (
        <div className="site-questions__empty">
          <p className="site-questions__empty-title">ВОПРОСЫ ПОКА НЕ ДОБАВЛЕНЫ</p>
        </div>
      ) : (
        <div className="site-questions__list" aria-label="Список вопросов и ответов">
          {questions.map((item) => {
            const isOpen = normalizedOpenIds.includes(item.id);

            return (
              <SiteQuestionAccordionItem
                key={item.id}
                item={item}
                isOpen={isOpen}
                onToggle={() => {
                  setOpenIds((current) =>
                    current.includes(item.id) ? current.filter((value) => value !== item.id) : [...current, item.id],
                  );
                }}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
