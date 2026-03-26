import { useEffect, useMemo, useState, type ChangeEvent, type DragEvent } from "react";
import { Link } from "react-router-dom";
import { useLiveData } from "../shared/live-data-context";
import { toImageGatewayUrl } from "../shared/live-data-context";

type AdminTab = "products" | "dedup" | "categories" | "sync" | "sources" | "settings";

type UploadPreview = {
  file: File;
  url: string;
};

const tabs: { key: AdminTab; label: string }[] = [
  { key: "products", label: "Все товары" },
  { key: "dedup", label: "Дедубликация" },
  { key: "categories", label: "Категории" },
  { key: "sync", label: "Синхронизация" },
  { key: "sources", label: "Источники" },
  { key: "settings", label: "Настройки" },
];

const whitelist = [
  "jadedldn.com",
  "nofaithstudios.com",
  "professor-e.com",
  "essxnyc.com",
  "paradoxeparis.com",
  "driewgarments.com",
  "archived.co",
];

const currencyOptions = ["RUB", "EUR", "USD"];

export function AdminPage() {
  const {
    products,
    productsTotal,
    productsHasMore,
    sources,
    latestJob,
    loading,
    error,
    refresh,
    loadMoreProducts,
    runSync,
    previewProductByUrl,
    addProductByUrl,
    createManualProduct,
    uploadProductImage,
    adminCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    addCategoryKeyword,
    removeCategoryKeyword,
    dedupCandidates,
    mergeDedupPair,
    rejectDedupPair,
    jobsHistory,
    toggleSourceEnabled,
  } = useLiveData();

  const [tab, setTab] = useState<AdminTab>("products");
  const [syncMessage, setSyncMessage] = useState<string>("");
  const [openModal, setOpenModal] = useState<boolean>(false);

  const [productUrl, setProductUrl] = useState<string>("");
  const [productTitle, setProductTitle] = useState<string>("");
  const [productVendor, setProductVendor] = useState<string>("");
  const [productCategory, setProductCategory] = useState<string>("");
  const [productPrice, setProductPrice] = useState<string>("");
  const [productCurrency, setProductCurrency] = useState<string>("USD");
  const [imagePreviews, setImagePreviews] = useState<UploadPreview[]>([]);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [renameCategoryName, setRenameCategoryName] = useState<string>("");
  const [lastSavedCategoryName, setLastSavedCategoryName] = useState<string>("");
  const [keywordInput, setKeywordInput] = useState<string>("");
  const [createFormOpen, setCreateFormOpen] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [newCategoryParentId, setNewCategoryParentId] = useState<number | null>(null);
  const [newCategoryKeywords, setNewCategoryKeywords] = useState<string>("");

  const [productSearch, setProductSearch] = useState<string>("");
  const [productSourceFilter, setProductSourceFilter] = useState<string>("");
  const [productVendorFilter, setProductVendorFilter] = useState<string>("");
  const [productTypeFilter, setProductTypeFilter] = useState<string>("");
  const [productStatusFilter, setProductStatusFilter] = useState<string>("");

  const [usdRate, setUsdRate] = useState<string>("95");
  const [weightRule, setWeightRule] = useState<string>("default");
  const [ssrEnabled, setSsrEnabled] = useState<boolean>(false);

  const canRunSync = latestJob?.status !== "in_progress";

  useEffect(() => {
    return () => {
      for (const item of imagePreviews) {
        URL.revokeObjectURL(item.url);
      }
    };
  }, [imagePreviews]);

  const categoryOptions = useMemo(() => {
    const rows: { id: number; name: string }[] = [];
    const walk = (nodes: typeof adminCategories, prefix: string) => {
      for (const node of nodes) {
        rows.push({ id: node.id, name: `${prefix}${node.name}` });
        walk(node.children, `${prefix}  `);
      }
    };
    walk(adminCategories, "");
    return rows;
  }, [adminCategories]);

  const selectedCategory = useMemo(() => {
    if (selectedCategoryId === null) {
      return null;
    }
    let found: (typeof adminCategories)[number] | null = null;
    const walk = (nodes: typeof adminCategories) => {
      for (const node of nodes) {
        if (node.id === selectedCategoryId) {
          found = node;
          return;
        }
        walk(node.children);
      }
    };
    walk(adminCategories);
    return found;
  }, [adminCategories, selectedCategoryId]);

  const flattenedAdminCategories = useMemo(() => {
    const list: { id: number; name: string; effective_keywords: string[] }[] = [];
    const walk = (nodes: typeof adminCategories) => {
      for (const node of nodes) {
        list.push({ id: node.id, name: node.name, effective_keywords: node.effective_keywords || [] });
        walk(node.children);
      }
    };
    walk(adminCategories);
    return list;
  }, [adminCategories]);

  const inferInternalCategoryName = (product: (typeof products)[number]) => {
    const haystack = `${product.title} ${product.vendor || ""} ${product.product_type || ""}`.toLowerCase();
    let best: { name: string; score: number } | null = null;

    for (const category of flattenedAdminCategories) {
      let score = 0;
      for (const keyword of category.effective_keywords) {
        const normalized = keyword.trim().toLowerCase();
        if (!normalized) {
          continue;
        }
        if (haystack.includes(normalized)) {
          score += normalized.length;
        }
      }
      if (score > 0 && (!best || score > best.score)) {
        best = { name: category.name, score };
      }
    }

    return best?.name || "Прочее";
  };

  useEffect(() => {
    if (!selectedCategory) {
      return;
    }
    setRenameCategoryName(selectedCategory.name);
    setLastSavedCategoryName(selectedCategory.name);
  }, [selectedCategory?.id, selectedCategory?.name]);

  useEffect(() => {
    if (!selectedCategoryId) {
      return;
    }
    const normalized = renameCategoryName.trim();
    if (!normalized || normalized === lastSavedCategoryName) {
      return;
    }

    const timer = window.setTimeout(async () => {
      const result = await updateCategory(selectedCategoryId, { name: normalized });
      setSyncMessage(result.message);
      if (result.ok) {
        setLastSavedCategoryName(normalized);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [renameCategoryName, lastSavedCategoryName, selectedCategoryId, updateCategory]);

  const newCategoryParentName = useMemo(() => {
    if (newCategoryParentId === null) {
      return "root";
    }
    return categoryOptions.find((item) => item.id === newCategoryParentId)?.name || "unknown";
  }, [categoryOptions, newCategoryParentId]);

  const productVendors = useMemo(() => {
    const set = new Set<string>();
    for (const product of products) {
      if (product.vendor) {
        set.add(product.vendor);
      }
    }
    return [...set.values()].sort((a, b) => a.localeCompare(b));
  }, [products]);

  const productTypes = useMemo(() => {
    const set = new Set<string>();
    for (const product of products) {
      if (product.product_type) {
        set.add(product.product_type);
      }
    }
    return [...set.values()].sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const searchValue = productSearch.trim().toLowerCase();
      const searchText = [
        String(product.id),
        product.title,
        product.handle,
        product.vendor || "",
        product.product_type || "",
        product.url,
        product.status,
        product.currency,
        String(product.price ?? ""),
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = !searchValue || searchText.includes(searchValue);

      const matchesSource = !productSourceFilter || String(product.source_id) === productSourceFilter;
      const matchesVendor = !productVendorFilter || product.vendor === productVendorFilter;
      const matchesType = !productTypeFilter || product.product_type === productTypeFilter;
      const matchesStatus = !productStatusFilter || product.status === productStatusFilter;

      return matchesSearch && matchesSource && matchesVendor && matchesType && matchesStatus;
    });
  }, [products, productSearch, productSourceFilter, productVendorFilter, productTypeFilter, productStatusFilter]);

  const sourceById = useMemo(() => {
    const map = new Map<number, (typeof sources)[number]>();
    for (const source of sources) {
      if (source.source_id !== null) {
        map.set(source.source_id, source);
      }
    }
    return map;
  }, [sources]);

  const formatDateTime = (value: string | null | undefined) => {
    if (!value) {
      return "-";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString("ru-RU");
  };

  const parseUsdRate = () => {
    const parsed = Number(usdRate);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 95;
  };

  const convertToRub = (price: number | null, currency: string) => {
    if (price === null) {
      return null;
    }
    if (currency === "RUB") {
      return price;
    }
    const usd = parseUsdRate();
    const eur = usd * 1.1;
    if (currency === "USD") {
      return price * usd;
    }
    if (currency === "EUR") {
      return price * eur;
    }
    return null;
  };

  const statusBadge = (status: string) => {
    if (status === "available") {
      return { label: "Доступен", cls: "status-pill status-pill--ok" };
    }
    if (status === "out_of_stock") {
      return { label: "Нет в наличии", cls: "status-pill status-pill--bad" };
    }
    return { label: "Comming soon", cls: "status-pill status-pill--muted" };
  };

  const resetProductForm = () => {
    for (const item of imagePreviews) {
      URL.revokeObjectURL(item.url);
    }
    setProductUrl("");
    setProductTitle("");
    setProductVendor("");
    setProductCategory("");
    setProductPrice("");
    setProductCurrency("USD");
    setImagePreviews([]);
    setZoomedImageUrl(null);
  };

  const closeProductModal = () => {
    resetProductForm();
    setOpenModal(false);
  };

  const addFiles = (files: File[]) => {
    if (files.length === 0) {
      return;
    }
    const newItems = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setImagePreviews((prev) => [...prev, ...newItems]);
  };

  const onDropImage = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = [...event.dataTransfer.files].filter((file) => file.type.startsWith("image/"));
    addFiles(files);
  };

  const onPickImage = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? [...event.target.files].filter((file) => file.type.startsWith("image/")) : [];
    addFiles(files);
    event.target.value = "";
  };

  const removePreviewImage = (index: number) => {
    setImagePreviews((prev) => {
      const target = prev[index];
      if (target) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const uploadSelectedImages = async () => {
    let uploadedCount = 0;
    for (const item of imagePreviews) {
      const uploadResult = await uploadProductImage(item.file);
      if (!uploadResult.ok) {
        setSyncMessage(uploadResult.message);
        return { ok: false, count: uploadedCount };
      }
      uploadedCount += 1;
    }
    return { ok: true, count: uploadedCount };
  };

  const onFetchPreview = async () => {
    if (!productUrl.trim()) {
      setSyncMessage("Ссылка не указана");
      return;
    }

    const result = await previewProductByUrl(productUrl.trim());
    setSyncMessage(result.message);
    if (result.ok && result.preview) {
      setProductTitle(result.preview.title || "");
      setProductVendor(result.preview.vendor || "");
      setProductCategory(result.preview.product_type || "");
      setProductPrice(result.preview.price !== null ? String(result.preview.price) : "");
      setProductCurrency((result.preview.currency || "USD").toUpperCase());
    }
  };

  const onSaveProduct = async () => {
    if (!productTitle.trim()) {
      setSyncMessage("Введите название товара");
      return;
    }

    const parsedPrice = productPrice.trim() ? Number(productPrice) : null;
    if (parsedPrice !== null && Number.isNaN(parsedPrice)) {
      setSyncMessage("Цена должна быть числом");
      return;
    }

    const uploaded = await uploadSelectedImages();
    if (!uploaded.ok) {
      return;
    }

    const currency = (productCurrency.trim() || "USD").toUpperCase();

    const result = productUrl.trim()
      ? await addProductByUrl(productUrl.trim(), {
          title: productTitle.trim(),
          vendor: productVendor.trim() || null,
          product_type: productCategory.trim() || null,
          price: parsedPrice,
          currency,
          image_count: uploaded.count,
        })
      : await createManualProduct({
          title: productTitle.trim(),
          price: parsedPrice,
          currency,
          product_type: productCategory.trim() || null,
          image_count: uploaded.count,
        });

    setSyncMessage(result.message);
    if (result.ok) {
      closeProductModal();
    }
  };

  const onRunSync = async () => {
    setSyncMessage("Запуск...");
    const result = await runSync();
    setSyncMessage(result.message);
  };

  const onStartCategoryCreate = (parentId: number | null) => {
    setCreateFormOpen(true);
    setNewCategoryParentId(parentId);
    setNewCategoryName("");
    setNewCategoryKeywords("");
  };

  const onCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      setSyncMessage("Введите название категории");
      return;
    }

    const result = await createCategory(newCategoryName.trim(), newCategoryParentId);
    setSyncMessage(result.message);

    if (result.ok && result.categoryId) {
      const keywords = newCategoryKeywords
        .split(/[\n,;]/)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);

      for (const keyword of keywords) {
        const addResult = await addCategoryKeyword(result.categoryId, keyword);
        if (!addResult.ok) {
          setSyncMessage(addResult.message);
          break;
        }
      }

      setCreateFormOpen(false);
      setNewCategoryParentId(null);
      setNewCategoryName("");
      setNewCategoryKeywords("");
      await refresh();
    }
  };

  const onDeleteCategory = async () => {
    if (!selectedCategoryId) {
      return;
    }
    const result = await deleteCategory(selectedCategoryId);
    setSyncMessage(result.message);
    if (result.ok) {
      setSelectedCategoryId(null);
      setRenameCategoryName("");
      setKeywordInput("");
    }
  };

  const onAddKeyword = async () => {
    if (!selectedCategoryId || !keywordInput.trim()) {
      return;
    }
    const result = await addCategoryKeyword(selectedCategoryId, keywordInput.trim());
    setSyncMessage(result.message);
    if (result.ok) {
      setKeywordInput("");
    }
  };

  const onRemoveKeyword = async (keyword: string) => {
    if (!selectedCategoryId) {
      return;
    }
    const result = await removeCategoryKeyword(selectedCategoryId, keyword);
    setSyncMessage(result.message);
  };

  const onMergePair = async (primaryId: number, duplicateId: number) => {
    const result = await mergeDedupPair(primaryId, duplicateId);
    setSyncMessage(result.message);
  };

  const onRejectPair = async (leftId: number, rightId: number) => {
    const result = await rejectDedupPair(leftId, rightId);
    setSyncMessage(result.message);
  };

  const renderTree = (nodes: typeof adminCategories, prefix = "") => {
    return (
      <div className="cat-tree-column">
        {nodes.map((node, index) => {
          const isLast = index === nodes.length - 1;
          const branch = prefix ? `${prefix}${isLast ? "└─ " : "├─ "}` : "";
          const nextPrefix = `${prefix}${isLast ? "   " : "│  "}`;

          return (
            <div key={node.id} className="cat-tree-node">
              <div className="cat-tree-item">
                <button
                  type="button"
                  className={selectedCategoryId === node.id ? "tab tab--active cat-tree-btn" : "tab cat-tree-btn"}
                  onClick={() => setSelectedCategoryId(node.id)}
                >
                  <span className="cat-tree-branch">{branch}</span>
                  <span>{node.name}</span>
                </button>
                <button
                  type="button"
                  className="tree-plus"
                  title="Добавить дочернюю категорию"
                  onClick={() => onStartCategoryCreate(node.id)}
                >
                  +
                </button>
                <span className="muted">{node.is_fallback ? "fallback" : `${node.keywords.length} ключей`}</span>
              </div>
              {node.children.length > 0 ? <div className="cat-tree-children">{renderTree(node.children, nextPrefix)}</div> : null}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section className="section admin">
      <div className="admin-head">
        <h1>Admin Panel</h1>
        <p className="muted">Реальные данные: дерево категорий, синхронизация, дедуп и управление товарами.</p>
        <div className="actions">
          <button type="button" onClick={onRunSync} disabled={!canRunSync}>
            Синхронизировать товары
          </button>
          <button type="button" onClick={() => setOpenModal(true)}>
            Добавить товар
          </button>
          <button type="button" onClick={() => void refresh()}>
            Обновить
          </button>
          <Link className="btn-link" to="/">
            Открыть витрину
          </Link>
        </div>
        <p className="muted">{syncMessage}</p>
      </div>

      <div className="tabs">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            className={item.key === tab ? "tab tab--active" : "tab"}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? <p className="muted">Loading...</p> : null}
      {error ? <p className="muted">Error: {error}</p> : null}

      {tab === "products" ? (
        <div className="card">
          <h2>
            Все товары ({filteredProducts.length}/{productsTotal})
          </h2>

          <div className="products-layout">
            <aside className="products-filters card">
              <h3>Фильтры</h3>
              <input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Поиск" />
              <select value={productSourceFilter} onChange={(event) => setProductSourceFilter(event.target.value)}>
                <option value="">Все сайты</option>
                {sources
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
                  <option key={vendor} value={vendor}>
                    {vendor}
                  </option>
                ))}
              </select>
              <select value={productTypeFilter} onChange={(event) => setProductTypeFilter(event.target.value)}>
                <option value="">Все локальные категории</option>
                {productTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <select value={productStatusFilter} onChange={(event) => setProductStatusFilter(event.target.value)}>
                <option value="">Все статусы</option>
                <option value="available">Доступен</option>
                <option value="out_of_stock">Нет в наличии</option>
                <option value="discontinued">Comming soon</option>
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

            <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Фото</th>
                    <th>Название</th>
                    <th>Сайт</th>
                    <th>Локальная категория</th>
                    <th>Категория</th>
                    <th>Статус</th>
                    <th>Оригинальная цена</th>
                    <th>Итоговая цена (RUB)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const status = statusBadge(product.status);
                    const rubPrice = convertToRub(product.price, product.currency);
                    const source = sourceById.get(product.source_id);
                    return (
                      <tr key={product.id}>
                        <td>
                          {toImageGatewayUrl(product.image_ids?.[0]) ? (
                            <img className="thumb-mini-image" src={toImageGatewayUrl(product.image_ids?.[0]) || undefined} alt={product.title} />
                          ) : (
                            <div className="thumb-mini">{product.image_count > 0 ? `${product.image_count} фото` : "Нет фото"}</div>
                          )}
                        </td>
                        <td>
                          <Link className="btn-link" to={`/product/${product.id}`}>
                            {product.title}
                          </Link>
                        </td>
                        <td>{source?.name || `#${product.source_id}`}</td>
                        <td>{product.product_type || "-"}</td>
                        <td>{inferInternalCategoryName(product)}</td>
                        <td>
                          <span className={status.cls}>{status.label}</span>
                        </td>
                        <td>
                          {product.price ?? "-"} {product.currency}
                        </td>
                        <td>{rubPrice === null ? "-" : `${Math.round(rubPrice)} RUB`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredProducts.length === 0 ? <p className="muted">По текущим фильтрам товаров нет</p> : null}
              {productsHasMore ? (
                <div style={{ marginTop: "0.75rem" }}>
                  <button type="button" onClick={() => void loadMoreProducts()}>
                    Загрузить еще
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "dedup" ? (
        <div className="card">
          <h2>Дедубликация</h2>
          <p className="muted">Кандидатов: {dedupCandidates.length}</p>
          <div className="dedup-list">
            {dedupCandidates.map((candidate) => (
              <div key={candidate.pair_key} className="dedup-item">
                <div className="dedup-head">
                  <strong>score: {candidate.score.toFixed(2)}</strong>
                  <span className="muted">{candidate.reasons.join(", ") || "heuristic_match"}</span>
                </div>

                <div className="dedup-grid">
                  <div className="dedup-col">
                    <strong>{candidate.left.title}</strong>
                    <p className="muted">{candidate.left.vendor || "-"}</p>
                    <p className="muted">
                      {candidate.left.price ?? "-"} {candidate.left.currency}
                    </p>
                    <a className="btn-link" href={candidate.left.url} target="_blank" rel="noreferrer">
                      Открыть источник
                    </a>
                    <button type="button" onClick={() => void onMergePair(candidate.left.id, candidate.right.id)}>
                      Merge: оставить левый
                    </button>
                  </div>

                  <div className="dedup-col">
                    <strong>{candidate.right.title}</strong>
                    <p className="muted">{candidate.right.vendor || "-"}</p>
                    <p className="muted">
                      {candidate.right.price ?? "-"} {candidate.right.currency}
                    </p>
                    <a className="btn-link" href={candidate.right.url} target="_blank" rel="noreferrer">
                      Открыть источник
                    </a>
                    <button type="button" onClick={() => void onMergePair(candidate.right.id, candidate.left.id)}>
                      Merge: оставить правый
                    </button>
                  </div>
                </div>

                <div className="actions">
                  <button type="button" onClick={() => void onRejectPair(candidate.left.id, candidate.right.id)}>
                    Не дубль
                  </button>
                </div>
              </div>
            ))}
            {dedupCandidates.length === 0 ? <p className="muted">Кандидатов нет</p> : null}
          </div>
        </div>
      ) : null}

      {tab === "categories" ? (
        <div className="card">
          <h2>Категории</h2>
          <div className="categories-layout">
            <div>
              <div className="actions" style={{ marginBottom: "0.5rem" }}>
                <button type="button" className="tree-plus" onClick={() => onStartCategoryCreate(null)}>
                  + root
                </button>
              </div>
              <div className="cat-tree-wrap">{renderTree(adminCategories)}</div>
            </div>

            <div className="card">
              {createFormOpen ? (
                <div className="form">
                  <h3>Создание категории</h3>
                  <p className="muted">Родитель: {newCategoryParentName}</p>
                  <input
                    value={newCategoryName}
                    onChange={(event) => setNewCategoryName(event.target.value)}
                    placeholder="Название"
                  />
                  <textarea
                    value={newCategoryKeywords}
                    onChange={(event) => setNewCategoryKeywords(event.target.value)}
                    placeholder="Ключевые слова (через запятую или с новой строки, опционально)"
                  />
                  <div className="actions">
                    <button type="button" onClick={onCreateCategory}>
                      Создать
                    </button>
                    <button type="button" onClick={() => setCreateFormOpen(false)}>
                      Отмена
                    </button>
                  </div>
                </div>
              ) : null}

              {selectedCategory ? (
                <>
                  <h3>Редактирование: {selectedCategory.name}</h3>
                  <div className="form">
                    <input
                      value={renameCategoryName}
                      onChange={(event) => setRenameCategoryName(event.target.value)}
                      placeholder="Название категории"
                    />
                    <button type="button" onClick={onDeleteCategory} disabled={selectedCategory.is_fallback}>
                      Удалить
                    </button>
                    {selectedCategory.is_fallback ? (
                      <p className="muted">Данная категория системная, ее нельзя удалить.</p>
                    ) : null}
                  </div>

                  <p className="muted">Ключевые слова (локальные):</p>
                  <div className="chip-list">
                    {selectedCategory.keywords.map((keyword) => (
                      <span key={keyword} className="tag tag--with-action">
                        <span>{keyword}</span>
                        <button type="button" className="tag-x" onClick={() => void onRemoveKeyword(keyword)}>
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="form">
                    <input
                      value={keywordInput}
                      onChange={(event) => setKeywordInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void onAddKeyword();
                        }
                      }}
                      placeholder="Введите ключ и нажмите Enter"
                    />
                    <button type="button" onClick={onAddKeyword}>
                      Добавить ключ
                    </button>
                  </div>

                  <p className="muted">Ключевые слова (наследованные):</p>
                  <div className="chip-list">
                    {selectedCategory.effective_keywords
                      .filter((keyword) => !selectedCategory.keywords.includes(keyword))
                      .map((keyword) => (
                        <span key={keyword} className="tag">
                          {keyword}
                        </span>
                      ))}
                  </div>
                </>
              ) : (
                <p className="muted">Выбери категорию в дереве слева, чтобы редактировать название и ключи.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "sync" ? (
        <div className="card">
          <h2>Синхронизация</h2>
          <p className="muted">Последняя синхронизация: {formatDateTime(latestJob?.completed_at)}</p>
          <p className="muted">Следующая синхронизация: {formatDateTime(latestJob?.next_scheduled_at)}</p>
          <div className="sync-stats">
            <span className="sync-pill sync-pill--new">new: {latestJob?.new_products || 0}</span>
            <span className="sync-pill sync-pill--updated">updated: {latestJob?.updated_products || 0}</span>
            <span className="sync-pill sync-pill--missing">missing: 0</span>
          </div>

          <h3 style={{ marginTop: "1rem" }}>История запусков</h3>
          <div className="list">
            {jobsHistory.map((job) => (
              <div key={job.id} className="list-row">
                <div>
                  <strong>{job.id}</strong>
                  <p className="muted">{formatDateTime(job.created_at)}</p>
                  <p className="muted">
                    new={job.new_products} updated={job.updated_products} errors={job.error_count}
                  </p>
                </div>
                <span className="muted">{job.triggered_by}</span>
              </div>
            ))}
            {jobsHistory.length === 0 ? <p className="muted">История пуста</p> : null}
          </div>
        </div>
      ) : null}

      {tab === "sources" ? (
        <div className="card">
          <h2>Источники ({sources.length})</h2>
          <div className="list">
            {sources.map((source) => (
              <div key={source.key} className="list-row">
                <div>
                  <strong>{source.name}</strong>
                  <p className="muted">{source.base_url}</p>
                  <p className="muted">
                    Товаров: {source.products_count} • Категорий: {source.categories_count}
                  </p>
                </div>
                <label className="switch-wrap">
                  <input
                    type="checkbox"
                    checked={source.enabled}
                    onChange={(event) => {
                      void (async () => {
                        const result = await toggleSourceEnabled(source.key, event.target.checked);
                        setSyncMessage(result.message);
                      })();
                    }}
                  />
                  <span>{source.enabled ? "Включен" : "Выключен"}</span>
                </label>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === "settings" ? (
        <div className="card">
          <h2>Настройки</h2>
          <div className="form">
            <input value={usdRate} onChange={(event) => setUsdRate(event.target.value)} placeholder="Курс USD" />
            <input value={weightRule} onChange={(event) => setWeightRule(event.target.value)} placeholder="Правило веса" />
            <label className="muted" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input type="checkbox" checked={ssrEnabled} onChange={(event) => setSsrEnabled(event.target.checked)} />
              SSR включен
            </label>
            <button
              type="button"
              onClick={() => {
                setSyncMessage("Настройки сохранены (локально в текущей сессии UI)");
              }}
            >
              Сохранить настройки
            </button>
          </div>
        </div>
      ) : null}

      {openModal ? (
        <div className="modal-backdrop" onClick={closeProductModal}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h2>Добавить товар</h2>
              <button type="button" onClick={closeProductModal}>
                Закрыть
              </button>
            </div>

            <div className="form">
              <div className="url-fetch-row">
                <input
                  value={productUrl}
                  onChange={(event) => setProductUrl(event.target.value)}
                  placeholder="Ссылка (опционально): https://shop.example.com/products/..."
                />
                <button type="button" className="mini-btn" onClick={onFetchPreview} title="Подтянуть поля из URL">
                  ⇣
                </button>
              </div>

              <input value={productTitle} onChange={(event) => setProductTitle(event.target.value)} placeholder="Название" />

              <div className="row2">
                <input value={productVendor} onChange={(event) => setProductVendor(event.target.value)} placeholder="Бренд" />
                <input
                  value={productCategory}
                  onChange={(event) => setProductCategory(event.target.value)}
                  placeholder="Категория / product_type"
                />
              </div>

              <div className="row2">
                <input value={productPrice} onChange={(event) => setProductPrice(event.target.value)} placeholder="Цена" />
                <select value={productCurrency} onChange={(event) => setProductCurrency(event.target.value)}>
                  {currencyOptions.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dropzone" onDrop={onDropImage} onDragOver={(event) => event.preventDefault()}>
                Drag-and-drop изображений сюда
              </div>
              <label className="btn-link" htmlFor="image-file">
                + добавить фото
              </label>
              <input
                id="image-file"
                type="file"
                accept="image/*"
                multiple
                onChange={onPickImage}
                style={{ display: "none" }}
              />

              {imagePreviews.length > 0 ? (
                <div className="image-preview-grid">
                  {imagePreviews.map((item, index) => (
                    <div key={`${item.file.name}-${index}`} className="image-preview-card">
                      <button type="button" className="image-preview-btn" onClick={() => setZoomedImageUrl(item.url)}>
                        <img src={item.url} alt={item.file.name} className="image-preview" />
                      </button>
                      <div className="actions" style={{ marginTop: "0.35rem" }}>
                        <button type="button" onClick={() => removePreviewImage(index)}>
                          Удалить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">Фото не выбраны</p>
              )}

              <button type="button" onClick={onSaveProduct}>
                Сохранить товар
              </button>
              <p className="muted">Whitelist: {whitelist.join(", ")}</p>
            </div>
          </div>
        </div>
      ) : null}

      {zoomedImageUrl ? (
        <div className="modal-backdrop" onClick={() => setZoomedImageUrl(null)}>
          <div className="zoom-modal" onClick={(event) => event.stopPropagation()}>
            <img src={zoomedImageUrl} alt="preview" className="zoom-image" />
          </div>
        </div>
      ) : null}
    </section>
  );
}
