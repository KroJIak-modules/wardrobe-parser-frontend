import { useEffect, useMemo, useState } from "react";
import type { AdminQuestionDraft } from "./hooks/use-admin-settings-content-drafts";

type Props = {
  questions: AdminQuestionDraft[];
  onAddQuestion: () => string;
  onUpdateQuestion: (questionId: string, patch: Partial<AdminQuestionDraft>) => void;
  onMoveQuestion: (questionId: string, direction: -1 | 1) => void;
  onDeleteQuestion: (questionId: string) => void;
  onReset: () => void;
};

export function AdminSettingsQuestionsSection({
  questions,
  onAddQuestion,
  onUpdateQuestion,
  onMoveQuestion,
  onDeleteQuestion,
  onReset,
}: Props) {
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(() => questions[0]?.id ?? null);

  useEffect(() => {
    setOpenQuestionId((prev) => {
      if (prev && questions.some((item) => item.id === prev)) {
        return prev;
      }
      return questions[0]?.id ?? null;
    });
  }, [questions]);

  const toggleOpen = (questionId: string) => {
    setOpenQuestionId((prev) => (prev === questionId ? null : questionId));
  };

  const summary = useMemo(() => {
    const enabledCount = questions.filter((item) => item.isEnabled).length;
    const defaultOpenCount = questions.filter((item) => item.isExpandedByDefault).length;
    return `${questions.length} вопросов, ${enabledCount} активных, ${defaultOpenCount} открыты по умолчанию`;
  }, [questions]);

  return (
    <div className="admin-settings-pane">
      <section className="card admin-settings-panel">
        <div className="admin-settings-panel__head">
          <div>
            <h2>Вопросы</h2>
            <p className="muted">{summary}</p>
          </div>
          <div className="admin-settings-panel__actions">
            <button type="button" className="admin-settings-ghost-btn" onClick={onReset}>
              Сбросить черновик
            </button>
            <button
              type="button"
              onClick={() => {
                const nextId = onAddQuestion();
                setOpenQuestionId(nextId);
              }}
            >
              Добавить вопрос
            </button>
          </div>
        </div>

        <div className="admin-settings-question-list">
          {questions.map((item, index) => {
            const isOpen = openQuestionId === item.id;
            return (
              <article key={item.id} className={isOpen ? "admin-settings-question admin-settings-question--open" : "admin-settings-question"}>
                <button
                  type="button"
                  className="admin-settings-question__head"
                  onClick={() => toggleOpen(item.id)}
                  aria-expanded={isOpen}
                >
                  <div className="admin-settings-question__title-wrap">
                    <strong>{item.question.trim() || `Новый вопрос ${index + 1}`}</strong>
                    <span className="muted">{item.answer.trim() ? `${item.answer.trim().length} символов в ответе` : "Ответ пока пустой"}</span>
                  </div>
                  <div className="admin-settings-question__badges">
                    <span className="admin-settings-question__toggle-label">{isOpen ? "Свернуть" : "Открыть"}</span>
                    <span className="admin-settings-question__state">
                      {item.isEnabled ? "Показывается" : "Скрыт"}
                      {" · "}
                      {item.isExpandedByDefault ? "развернут по умолчанию" : "свернут по умолчанию"}
                    </span>
                  </div>
                </button>

                {isOpen ? (
                  <div className="admin-settings-question__body">
                    <div className="admin-settings-question__switches">
                      <label className="ui-switch ui-switch--compact">
                        <input
                          type="checkbox"
                          checked={item.isEnabled}
                          onChange={(event) => onUpdateQuestion(item.id, { isEnabled: Boolean(event.target.checked) })}
                        />
                        <span className="ui-switch-track"><span className="ui-switch-thumb" /></span>
                        <span className="ui-switch-text">Показывать вопрос</span>
                      </label>

                      <label className="ui-switch ui-switch--compact">
                        <input
                          type="checkbox"
                          checked={item.isExpandedByDefault}
                          onChange={(event) => onUpdateQuestion(item.id, { isExpandedByDefault: Boolean(event.target.checked) })}
                        />
                        <span className="ui-switch-track"><span className="ui-switch-thumb" /></span>
                        <span className="ui-switch-text">Развернуть по умолчанию</span>
                      </label>
                    </div>

                    <div className="admin-settings-question__actions">
                      <button type="button" className="admin-settings-ghost-btn" onClick={() => onMoveQuestion(item.id, -1)} disabled={index === 0}>
                        Выше
                      </button>
                      <button
                        type="button"
                        className="admin-settings-ghost-btn"
                        onClick={() => onMoveQuestion(item.id, 1)}
                        disabled={index === questions.length - 1}
                      >
                        Ниже
                      </button>
                      <button type="button" className="topbar-cta--danger" onClick={() => onDeleteQuestion(item.id)}>
                        Удалить
                      </button>
                    </div>

                    <label className="admin-settings-field">
                      <span>Вопрос</span>
                      <input
                        className="input"
                        value={item.question}
                        onChange={(event) => onUpdateQuestion(item.id, { question: event.target.value })}
                        placeholder="Например: Как сделать заказ"
                      />
                    </label>

                    <label className="admin-settings-field">
                      <div className="admin-settings-field__head">
                        <span>Ответ</span>
                      </div>
                      <textarea
                        value={item.answer}
                        onChange={(event) => onUpdateQuestion(item.id, { answer: event.target.value })}
                        placeholder="Коротко и по делу: что увидит человек на витрине."
                      />
                      <small className="muted">Поддерживается обычный текст с переносами строк.</small>
                    </label>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
