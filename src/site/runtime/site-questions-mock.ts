export type SiteQuestionItem = {
  id: string;
  question: string;
  answerParagraphs: string[];
  isInitiallyExpanded?: boolean;
};

export type SiteQuestionsPayload = {
  items: readonly SiteQuestionItem[];
};

export const siteQuestionsMockPayload: SiteQuestionsPayload = {
  items: [
    {
      id: "how-to-order",
      question: "КАК СДЕЛАТЬ ЗАКАЗ",
      isInitiallyExpanded: true,
      answerParagraphs: [
        "Anton Shell — молодой байер из Москвы, превращающий продажи в искусство.",
        "Начиная свой путь с китайских платформ в 15 лет, он быстро понял разницу между массовым рынком и настоящим стилем. Теперь доставляет вещи из Европы, США и Великобритании, собирая гардеробы, которые говорят громче слов.",
        "Визуал — его оружие. Продуманная стилизация, сильные промо-съемки, точный вкус.",
        "За два года работы Антон успел посотрудничать с многими брендами: Jaded London, Racer Worldwide, Alice Hollywood, Nofaithstudios, Project gr, Yori Sport и другие.",
        "Антон не просто продает одежду — он продает образ жизни.",
      ],
    },
    {
      id: "delivery-cost",
      question: "СКОЛЬКО СТОИТ ДОСТАВКА",
      answerParagraphs: [
        "Стоимость доставки зависит от страны отправления, габаритов вещи и выбранного способа логистики. Финальная сумма подтверждается перед оплатой.",
      ],
    },
    {
      id: "delivery-process",
      question: "КАК УСТРОЕН ПРОЦЕСС ДОСТАВКИ БЛА БЛА БЛА БЛЕ БЛЕ",
      isInitiallyExpanded: true,
      answerParagraphs: ["Антон не просто продает одежду — он продает образ жизни."],
    },
    {
      id: "returns",
      question: "ВОЗМОЖЕН ЛИ ВОЗВРАТ",
      answerParagraphs: [
        "Возврат возможен только в тех случаях, которые заранее согласованы перед оформлением заказа и зависят от статуса конкретного товара.",
      ],
    },
    {
      id: "pricing",
      question: "ЦЕНООБРАЗОВАНИЕ НА ТОВАРЫ",
      answerParagraphs: [
        "Цена складывается из стоимости вещи у поставщика, комиссии, доставки, пошлин и операционных расходов на выкуп и сопровождение заказа.",
      ],
    },
    {
      id: "delivery-process-short",
      question: "КАК УСТРОЕН ПРОЦЕСС ДОСТАВКИ",
      answerParagraphs: [
        "После выкупа товар проходит проверку, консолидацию и отправляется выбранным способом доставки с дальнейшим сопровождением до получения.",
      ],
    },
    {
      id: "delivery-cost-repeat",
      question: "СКОЛЬКО СТОИТ ДОСТАВКА",
      answerParagraphs: [
        "Для тяжелых и крупных позиций стоимость может отличаться. Итог всегда подтверждается отдельно перед запуском доставки.",
      ],
    },
  ],
};
