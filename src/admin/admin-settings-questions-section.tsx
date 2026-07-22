import { useEffect, useState } from "react";
import type { AdminQuestionDraft } from "./hooks/use-admin-site-content";

type Props = {
  questions: AdminQuestionDraft[];
  loading?: boolean;
  onAddQuestion: () => string;
  onUpdateQuestion: (questionId: string, patch: Partial<AdminQuestionDraft>) => void;
  onMoveQuestion: (questionId: string, direction: -1 | 1) => void;
  onDeleteQuestion: (questionId: string) => void;
};

export function AdminSettingsQuestionsSection({
  questions,
  loading = false,
  onAddQuestion,
  onUpdateQuestion,
  onMoveQuestion,
  onDeleteQuestion,
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

  return (
    <div className="admin-settings-pane">
      <section className="card admin-settings-panel">
        <div className="admin-settings-panel__head">
          <div>
            <h2>Вопросы</h2>
          </div>
          <div className="admin-settings-panel__actions">
            <button
              type="button"
              disabled={loading}
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
                          disabled={loading}
                        />
                        <span className="ui-switch-track"><span className="ui-switch-thumb" /></span>
                        <span className="ui-switch-text">Показывать вопрос</span>
                      </label>

                      <label className="ui-switch ui-switch--compact">
                        <input
                          type="checkbox"
                          checked={item.isExpandedByDefault}
                          onChange={(event) => onUpdateQuestion(item.id, { isExpandedByDefault: Boolean(event.target.checked) })}
                          disabled={loading}
                        />
                        <span className="ui-switch-track"><span className="ui-switch-thumb" /></span>
                        <span className="ui-switch-text">Развернуть по умолчанию</span>
                      </label>
                    </div>

                    <div className="admin-settings-question__actions">
                      <button type="button" className="admin-settings-ghost-btn" onClick={() => onMoveQuestion(item.id, -1)} disabled={loading || index === 0}>
                        Выше
                      </button>
                      <button
                        type="button"
                        className="admin-settings-ghost-btn"
                        onClick={() => onMoveQuestion(item.id, 1)}
                        disabled={loading || index === questions.length - 1}
                      >
                        Ниже
                      </button>
                      <button type="button" className="topbar-cta--danger" onClick={() => onDeleteQuestion(item.id)} disabled={loading}>
                        Удалить
                      </button>
                    </div>

                    <label className="admin-settings-field">
                      <span>Вопрос</span>
                      <input
                        className="input"
                        value={item.question}
                        onChange={(event) => onUpdateQuestion(item.id, { question: event.target.value })}
                        disabled={loading}
                      />
                    </label>

                    <label className="admin-settings-field">
                      <div className="admin-settings-field__head">
                        <span>Ответ</span>
                      </div>
                      <textarea
                        value={item.answer}
                        onChange={(event) => onUpdateQuestion(item.id, { answer: event.target.value })}
                        disabled={loading}
                      />
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
