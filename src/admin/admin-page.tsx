import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLiveData } from "../shared/live-data-context";

type AdminTab = "products" | "dedup" | "categories" | "sync" | "sources";
type AddMode = "url" | "manual";

const tabs: { key: AdminTab; label: string }[] = [
  { key: "products", label: "Все товары" },
  { key: "dedup", label: "Дедубликация" },
  { key: "categories", label: "Категории" },
  { key: "sync", label: "Синхронизация" },
  { key: "sources", label: "Источники" },
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

export function AdminPage() {
  const {
    products,
    sources,
    latestJob,
    loading,
    error,
    refresh,
    runSync,
    addProductByUrl,
    createManualProduct,
    uploadProductImage,
    adminCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    addCategoryKeyword,
    removeCategoryKeyword,
  } = useLiveData();

  const [tab, setTab] = useState<AdminTab>("products");
  const [syncMessage, setSyncMessage] = useState<string>("");
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [addMode, setAddMode] = useState<AddMode>("url");
  const [productUrl, setProductUrl] = useState<string>("");

  const [manualTitle, setManualTitle] = useState<string>("");
  const [manualPrice, setManualPrice] = useState<string>("");
  const [manualCurrency, setManualCurrency] = useState<string>("USD");
  const [manualCategory, setManualCategory] = useState<string>("");
  const [manualImageFile, setManualImageFile] = useState<File | null>(null);
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [newCategoryParentId, setNewCategoryParentId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [renameCategoryName, setRenameCategoryName] = useState<string>("");
  const [keywordInput, setKeywordInput] = useState<string>("");

  const canRunSync = latestJob?.status !== "in_progress";

  const categoryOptions = useMemo(() => {
    const rows: { id: number; name: string }[] = [];
    const walk = (nodes: typeof adminCategories, prefix: string) => {
      for (const node of nodes) {
        rows.push({ id: node.id, name: `${prefix}${node.name}` });
        walk(node.children, `${prefix}-- `);
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

  const onRunSync = async () => {
    setSyncMessage("Запуск...");
    const result = await runSync();
    setSyncMessage(result.message);
  };

  const onDropImage = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      setManualImageFile(file);
    }
  };

  const onPickImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setManualImageFile(file);
    }
  };

  const onValidateUrl = async () => {
    const result = await addProductByUrl(productUrl);
    setSyncMessage(result.message);
    if (result.ok) {
      setProductUrl("");
      setOpenModal(false);
    }
  };

  const onSaveManual = async () => {
    if (!manualTitle.trim()) {
      setSyncMessage("Введите название товара");
      return;
    }

    const parsedPrice = manualPrice.trim() ? Number(manualPrice) : null;
    if (parsedPrice !== null && Number.isNaN(parsedPrice)) {
      setSyncMessage("Цена должна быть числом");
      return;
    }

    let imageCount = 0;
    if (manualImageFile) {
      const uploadResult = await uploadProductImage(manualImageFile);
      if (!uploadResult.ok) {
        setSyncMessage(uploadResult.message);
        return;
      }
      imageCount = 1;
    }

    const result = await createManualProduct({
      title: manualTitle.trim(),
      price: parsedPrice,
      currency: manualCurrency.trim() || "USD",
      product_type: manualCategory.trim() || null,
      image_count: imageCount,
    });
    setSyncMessage(result.message);
    if (result.ok) {
      setManualTitle("");
      setManualPrice("");
      setManualCurrency("USD");
      setManualCategory("");
      setManualImageFile(null);
      setOpenModal(false);
    }
  };

  const onCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      setSyncMessage("Введите название категории");
      return;
    }
    const parentId = newCategoryParentId ? Number(newCategoryParentId) : null;
    const result = await createCategory(newCategoryName.trim(), parentId);
    setSyncMessage(result.message);
    if (result.ok) {
      setNewCategoryName("");
      setNewCategoryParentId("");
    }
  };

  const onRenameCategory = async () => {
    if (!selectedCategoryId || !renameCategoryName.trim()) {
      return;
    }
    const result = await updateCategory(selectedCategoryId, { name: renameCategoryName.trim() });
    setSyncMessage(result.message);
    if (result.ok) {
      setRenameCategoryName("");
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

  const renderTree = (nodes: typeof adminCategories, level = 0): JSX.Element[] => {
    return nodes.flatMap((node) => {
      const line = (
        <div key={node.id} className="list-row" style={{ paddingLeft: `${level * 18}px` }}>
          <button
            type="button"
            className={selectedCategoryId === node.id ? "tab tab--active" : "tab"}
            onClick={() => {
              setSelectedCategoryId(node.id);
              setRenameCategoryName(node.name);
            }}
          >
            {node.name}
          </button>
          <span className="muted">{node.is_fallback ? "fallback" : `${node.keywords.length} keywords`}</span>
        </div>
      );
      return [line, ...renderTree(node.children, level + 1)];
    });
  };

  return (
    <section className="section admin">
      <div className="admin-head">
        <h1>Admin Panel</h1>
        <p className="muted">Текущая итерация: реальные данные, вкладки, синхронизация, modal добавления.</p>
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
          <h2>Все товары ({products.length})</h2>
          <div className="list">
            {products.map((product) => (
              <div key={product.id} className="list-row">
                <div>
                  <strong>{product.title}</strong>
                  <p className="muted">
                    {product.vendor || "-"} • {product.product_type || "Other"} • {product.price} {product.currency}
                  </p>
                </div>
                <a className="btn-link" href={product.url} target="_blank" rel="noreferrer">
                  Source
                </a>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === "dedup" ? (
        <div className="card">
          <h2>Дедубликация</h2>
          <p className="muted">Будет подключена к очереди duplicate candidates из API.</p>
        </div>
      ) : null}

      {tab === "categories" ? (
        <div className="card">
          <h2>Категории</h2>
          <div className="form">
            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Новая категория"
            />
            <select value={newCategoryParentId} onChange={(e) => setNewCategoryParentId(e.target.value)}>
              <option value="">Без родителя</option>
              {categoryOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <button type="button" onClick={onCreateCategory}>
              Создать категорию
            </button>
          </div>

          <div className="list">{renderTree(adminCategories)}</div>

          {selectedCategory ? (
            <div className="card" style={{ marginTop: "1rem" }}>
              <h3>Редактирование: {selectedCategory.name}</h3>
              <div className="form">
                <input
                  value={renameCategoryName}
                  onChange={(e) => setRenameCategoryName(e.target.value)}
                  placeholder="Новое имя"
                />
                <button type="button" onClick={onRenameCategory}>
                  Переименовать
                </button>
                <button type="button" onClick={onDeleteCategory} disabled={selectedCategory.is_fallback}>
                  Удалить
                </button>
              </div>

              <p className="muted">Keywords (локальные):</p>
              <div className="chip-list">
                {selectedCategory.keywords.map((keyword) => (
                  <button key={keyword} type="button" className="tag" onClick={() => void onRemoveKeyword(keyword)}>
                    {keyword} x
                  </button>
                ))}
              </div>
              <div className="form">
                <input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void onAddKeyword();
                    }
                  }}
                  placeholder="Введите keyword и нажмите Enter"
                />
                <button type="button" onClick={onAddKeyword}>
                  Добавить keyword
                </button>
              </div>

              <p className="muted">Effective keywords (с наследованием):</p>
              <div className="chip-list">
                {selectedCategory.effective_keywords.map((keyword) => (
                  <span key={keyword} className="tag">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "sync" ? (
        <div className="card">
          <h2>Синхронизация</h2>
          <p className="muted">Статус: {latestJob?.status || "not_started"}</p>
          <p className="muted">Последняя синхронизация: {latestJob?.completed_at || "-"}</p>
          <p className="muted">
            Изменения: new={latestJob?.new_products || 0}, updated={latestJob?.updated_products || 0}
          </p>
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
                </div>
                <span className="muted">{source.enabled ? "enabled" : "disabled"}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {openModal ? (
        <div className="modal-backdrop" onClick={() => setOpenModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Добавить товар</h2>
              <button type="button" onClick={() => setOpenModal(false)}>
                Закрыть
              </button>
            </div>

            <div className="tabs">
              <button
                type="button"
                className={addMode === "url" ? "tab tab--active" : "tab"}
                onClick={() => setAddMode("url")}
              >
                По ссылке
              </button>
              <button
                type="button"
                className={addMode === "manual" ? "tab tab--active" : "tab"}
                onClick={() => setAddMode("manual")}
              >
                Вручную
              </button>
            </div>

            {addMode === "url" ? (
              <div className="form">
                <input
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  placeholder="https://shop.example.com/products/..."
                />
                <button type="button" onClick={onValidateUrl}>
                  Добавить по ссылке
                </button>
                <p className="muted">Whitelist: {whitelist.join(", ")}</p>
              </div>
            ) : null}

            {addMode === "manual" ? (
              <div className="form">
                <input value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} placeholder="Название" />
                <div className="row2">
                  <input value={manualPrice} onChange={(e) => setManualPrice(e.target.value)} placeholder="Цена" />
                  <input value={manualCurrency} onChange={(e) => setManualCurrency(e.target.value)} placeholder="Валюта" />
                </div>
                <select value={manualCategory} onChange={(e) => setManualCategory(e.target.value)}>
                  <option value="">Выбери категорию</option>
                  {categoryOptions.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>

                <div className="dropzone" onDrop={onDropImage} onDragOver={(e) => e.preventDefault()}>
                  Drag-and-drop изображение сюда
                </div>
                <label className="btn-link" htmlFor="image-file">
                  +
                </label>
                <input id="image-file" type="file" accept="image/*" onChange={onPickImage} style={{ display: "none" }} />
                <p className="muted">{manualImageFile ? `Файл: ${manualImageFile.name}` : "Файл не выбран"}</p>
                <button type="button" onClick={onSaveManual}>
                  Сохранить
                </button>
              </div>
            ) : null}

          </div>
        </div>
      ) : null}
    </section>
  );
}
