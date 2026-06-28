import type { SiteQuestionItem } from "../../runtime/site-questions-mock";
import { SiteQuestionToggleIcon } from "./site-question-toggle-icon";

export function SiteQuestionAccordionItem({
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
