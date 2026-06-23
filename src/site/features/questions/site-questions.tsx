import { useEffect, useMemo, useState } from "react";
import type { SiteQuestionItem } from "../../runtime/site-questions-mock";
import "./site-questions.css";

function SiteQuestionAccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: SiteQuestionItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <article className={isOpen ? "site-question site-question--open" : "site-question"}>
      <button type="button" className="site-question__trigger" aria-expanded={isOpen} onClick={onToggle}>
        <span className="site-question__title">{item.question}</span>
        <span className="site-question__toggle-art" aria-hidden="true">
          <img
            className={
              isOpen
                ? "site-question__toggle-asset site-question__toggle-asset--closed"
                : "site-question__toggle-asset site-question__toggle-asset--closed site-question__toggle-asset--visible"
            }
            src="/site-mock/questions/question-toggle-closed.svg"
            alt=""
          />
          <img
            className={
              isOpen
                ? "site-question__toggle-asset site-question__toggle-asset--open site-question__toggle-asset--visible"
                : "site-question__toggle-asset site-question__toggle-asset--open"
            }
            src="/site-mock/questions/question-toggle-open.svg"
            alt=""
          />
        </span>
      </button>

      <div className={isOpen ? "site-question__answer-wrap site-question__answer-wrap--open" : "site-question__answer-wrap"}>
        <div className="site-question__answer">
          {item.answerParagraphs.map((paragraph, index) => (
            <p key={`${item.id}-paragraph-${index + 1}`} className="site-question__answer-paragraph">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </article>
  );
}

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
          <p className="site-questions__empty-copy">Когда в API появятся записи, они автоматически займут это место.</p>
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
