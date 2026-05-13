import type { AdminFilterFacetOption } from "./admin-types";

type Props = {
  productSearch: string;
  setProductSearch: (value: string) => void;
  productSourceFilter: string;
  setProductSourceFilter: (value: string) => void;
  productVendorFilter: string;
  setProductVendorFilter: (value: string) => void;
  productTypeFilter: string;
  setProductTypeFilter: (value: string) => void;
  productStatusFilter: string;
  setProductStatusFilter: (value: string) => void;
  sourceSelectOptions: Array<{ key: string; source_id: number | null; name: string }>;
  productVendors: AdminFilterFacetOption[];
  productTypes: AdminFilterFacetOption[];
};

export function AdminProductsFilters(props: Props) {
  const {
    productSearch,
    setProductSearch,
    productSourceFilter,
    setProductSourceFilter,
    productVendorFilter,
    setProductVendorFilter,
    productTypeFilter,
    setProductTypeFilter,
    productStatusFilter,
    setProductStatusFilter,
    sourceSelectOptions,
    productVendors,
    productTypes,
  } = props;

  return (
    <aside className="products-filters card">
      <h3>Фильтры</h3>
      <input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Поиск" />
      <select value={productSourceFilter} onChange={(event) => setProductSourceFilter(event.target.value)}>
        <option value="">Все сайты</option>
        {sourceSelectOptions
          .filter((source) => source.source_id !== null)
          .map((source) => (
            <option key={source.key} value={String(source.source_id)}>
              {source.name}
            </option>
          ))}
      </select>
      <select value={productVendorFilter} onChange={(event) => setProductVendorFilter(event.target.value)}>
        <option value="">Все бренды</option>
        {productVendors.map((vendor) => (
          <option key={vendor.value} value={vendor.value}>
            {vendor.label} ({vendor.count})
          </option>
        ))}
      </select>
      <select value={productTypeFilter} onChange={(event) => setProductTypeFilter(event.target.value)}>
        <option value="">Все локальные категории</option>
        {productTypes.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label} ({type.count})
          </option>
        ))}
      </select>
      <select value={productStatusFilter} onChange={(event) => setProductStatusFilter(event.target.value)}>
        <option value="">Все статусы</option>
        <option value="available">В наличии</option>
        <option value="out_of_stock">Нет в наличии</option>
        <option value="hidden">Скрыт</option>
        <option value="unavailable">Недоступен</option>
      </select>
      <button
        type="button"
        onClick={() => {
          setProductSearch("");
          setProductSourceFilter("");
          setProductVendorFilter("");
          setProductTypeFilter("");
          setProductStatusFilter("");
        }}
      >
        Сбросить
      </button>
    </aside>
  );
}
