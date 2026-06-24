import { useEffect, useMemo, useState } from "react";
import type { SiteQuestionItem } from "../../runtime/site-questions-mock";
import "./site-questions.css";

function SiteQuestionToggleIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className="site-question__toggle-svg"
      viewBox="0 0 47 37"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g filter="url(#site-question-toggle-filter)">
        <rect width="46.5631" height="36.1797" rx="10" fill="white" fillOpacity="0.15" />
      </g>
      <g className={isOpen ? "site-question__toggle-chevron site-question__toggle-chevron--open" : "site-question__toggle-chevron"}>
        <path
          d="M23.2812 12C23.561 11.9923 23.8397 12.1213 24.0146 12.3682L31.4004 22.7881C31.6801 23.1829 31.5893 23.733 31.1982 24.0156C30.8073 24.2978 30.2632 24.2068 29.9834 23.8125L23.2812 14.3555L16.5791 23.8115C16.2994 24.2062 15.7553 24.2978 15.3643 24.0156C14.9733 23.733 14.8834 23.1829 15.1631 22.7881L22.5479 12.3672C22.7228 12.1204 23.0015 11.9923 23.2812 12Z"
          fill="black"
          fillOpacity="0.8"
        />
      </g>
      <defs>
        <filter
          id="site-question-toggle-filter"
          x="0"
          y="-2"
          width="46.5631"
          height="40.1797"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="2" />
          <feGaussianBlur stdDeviation="2.5" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
          <feBlend mode="normal" in2="shape" result="effect1_innerShadow_0_4" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="-2" />
          <feGaussianBlur stdDeviation="2.5" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
          <feBlend mode="normal" in2="effect1_innerShadow_0_4" result="effect2_innerShadow_0_4" />
        </filter>
      </defs>
    </svg>
  );
}

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
          <SiteQuestionToggleIcon isOpen={isOpen} />
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
