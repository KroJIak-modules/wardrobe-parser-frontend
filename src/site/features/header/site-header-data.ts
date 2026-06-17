export type SiteHeaderDropdownColumn = {
  title: string;
  items: string[];
};

export const siteHeaderDropdownColumns: SiteHeaderDropdownColumn[] = [
  {
    title: "Коллекции",
    items: ["В наличии", "Под заказ", "Мой выбор", "Все товары"],
  },
  {
    title: "Разделы",
    items: [
      "Футболки и лонгсливы",
      "Свитшоты и худи",
      "Джинсы и штаны",
      "Кроссовки и кеды",
      "Ремни",
      "Украшения",
      "Сумки",
      "Шорты и юбки",
      "Головные уборы",
    ],
  },
];
