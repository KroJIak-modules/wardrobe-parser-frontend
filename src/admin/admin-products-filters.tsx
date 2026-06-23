import type { AdminFilterFacetOption } from "./admin-types";

type Props = {
  productSearch: string;
  setProductSearch: (value: string) => void;
  productSourceFilter: string;
  setProductSourceFilter: (value: string) => void;
  productSourceModeFilter: string;
  setProductSourceModeFilter: (value: string) => void;
  productDesignerFilter: string;
  setProductDesignerFilter: (value: string) => void;
  productCatalogFilter: string;
  setProductCatalogFilter: (value: string) => void;
  productSectionFilter: string;
  setProductSectionFilter: (value: string) => void;
  productGenderFilter: string;
  setProductGenderFilter: (value: string) => void;
  productVisibilityFilter: string;
  setProductVisibilityFilter: (value: string) => void;
  productAvailabilityModeFilter: string;
  setProductAvailabilityModeFilter: (value: string) => void;
  productOrderabilityFilter: string;
  setProductOrderabilityFilter: (value: string) => void;
  sourceFacetOptions: AdminFilterFacetOption[];
  productDesigners: AdminFilterFacetOption[];
  productCatalogs: AdminFilterFacetOption[];
  productSections: AdminFilterFacetOption[];
  productGenders: AdminFilterFacetOption[];
};

export function AdminProductsFilters(props: Props) {
  const {
    productSearch,
    setProductSearch,
    productSourceFilter,
    setProductSourceFilter,
    productSourceModeFilter,
    setProductSourceModeFilter,
    productDesignerFilter,
    setProductDesignerFilter,
    productCatalogFilter,
    setProductCatalogFilter,
    productSectionFilter,
    setProductSectionFilter,
    productGenderFilter,
    setProductGenderFilter,
    productVisibilityFilter,
    setProductVisibilityFilter,
    productAvailabilityModeFilter,
    setProductAvailabilityModeFilter,
    productOrderabilityFilter,
    setProductOrderabilityFilter,
    sourceFacetOptions,
    productDesigners,
    productCatalogs,
    productSections,
    productGenders,
  } = props;

  return (
    <aside className="products-filters card">
      <h3>Фильтры</h3>
      <input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Поиск" />
      <select value={productSourceFilter} onChange={(event) => setProductSourceFilter(event.target.value)}>
        <option value="">Все источники</option>
        {sourceFacetOptions.map((source) => (
          <option key={source.value} value={source.value} disabled={Boolean(source.disabled)}>
            {source.label} ({source.count})
          </option>
        ))}
      </select>
      <select value={productCatalogFilter} onChange={(event) => setProductCatalogFilter(event.target.value)}>
        <option value="">Все каталоги</option>
        {productCatalogs.map((catalog) => (
          <option key={catalog.value} value={catalog.value} disabled={Boolean(catalog.disabled)}>
            {catalog.label} ({catalog.count})
          </option>
        ))}
      </select>
      <select value={productSectionFilter} onChange={(event) => setProductSectionFilter(event.target.value)}>
        <option value="">Все фильтры</option>
        {productSections.map((section) => (
          <option key={section.value} value={section.value} disabled={Boolean(section.disabled)}>
            {section.label} ({section.count})
          </option>
        ))}
      </select>
      <select value={productSourceModeFilter} onChange={(event) => setProductSourceModeFilter(event.target.value)}>
        <option value="">Любой режим источника</option>
        <option value="auto">Авто</option>
        <option value="manual">Ручные</option>
        <option value="personal">Личные</option>
      </select>
      <select value={productDesignerFilter} onChange={(event) => setProductDesignerFilter(event.target.value)}>
        <option value="">Все дизайнеры</option>
        {productDesigners.map((designer) => (
          <option key={designer.value} value={designer.value} disabled={Boolean(designer.disabled)}>
            {designer.label} ({designer.count})
          </option>
        ))}
      </select>
      <select value={productGenderFilter} onChange={(event) => setProductGenderFilter(event.target.value)}>
        <option value="">Любой гендер</option>
        {productGenders.map((gender) => (
          <option key={gender.value} value={gender.value} disabled={Boolean(gender.disabled)}>
            {gender.label} ({gender.count})
          </option>
        ))}
      </select>
      <select value={productVisibilityFilter} onChange={(event) => setProductVisibilityFilter(event.target.value)}>
        <option value="">Любая видимость</option>
        <option value="visible">Показан</option>
        <option value="hidden">Скрыт</option>
      </select>
      <select value={productOrderabilityFilter} onChange={(event) => setProductOrderabilityFilter(event.target.value)}>
        <option value="">Любая доступность</option>
        <option value="orderable">Доступен</option>
        <option value="sold_out">Распродан</option>
        <option value="unavailable">Недоступен</option>
      </select>
      <select value={productAvailabilityModeFilter} onChange={(event) => setProductAvailabilityModeFilter(event.target.value)}>
        <option value="">Любой режим</option>
        <option value="in_stock">В наличии</option>
        <option value="by_order">Под заказ</option>
      </select>
      <button
        type="button"
        onClick={() => {
          setProductSearch("");
          setProductSourceFilter("");
          setProductSourceModeFilter("");
          setProductDesignerFilter("");
          setProductCatalogFilter("");
          setProductSectionFilter("");
          setProductGenderFilter("");
          setProductVisibilityFilter("");
          setProductAvailabilityModeFilter("");
          setProductOrderabilityFilter("");
        }}
      >
        Сбросить
      </button>
    </aside>
  );
}
