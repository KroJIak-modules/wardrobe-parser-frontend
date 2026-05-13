import { useMemo, useRef, useState } from "react";
import type { BrandMappingItem } from "./admin-types";
import { EmptyState } from "../shared/empty-state";

type Props = {
  loading: boolean;
  saving: boolean;
  hasUnsavedChanges: boolean;
  rows: BrandMappingItem[];
  knownTargets: string[];
  onChangeTarget: (sourceBrand: string, targetBrand: string) => void;
  onToggleIncludeInDesigners: (sourceBrand: string, includeInDesigners: boolean) => void;
  onSave: () => Promise<void>;
};

export function AdminDesignersTab({
  loading,
  saving,
  hasUnsavedChanges,
  rows,
  knownTargets,
  onChangeTarget,
  onToggleIncludeInDesigners,
  onSave,
}: Props) {
  const [search, setSearch] = useState<string>("");
  const [openSourceBrand, setOpenSourceBrand] = useState<string | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return rows;
    }
    return rows.filter((row) => {
      const source = String(row.source_brand || "").toLowerCase();
      const target = String(row.target_brand || "").toLowerCase();
      return source.includes(query) || target.includes(query);
    });
  }, [rows, search]);

  const hasInvalid = rows.some((row) => !String(row.target_brand || "").trim());

  const getSuggestions = (row: BrandMappingItem): string[] => {
    const query = String(row.target_brand || "").trim().toLowerCase();
    const raw = knownTargets.filter((target) => {
      const normalized = String(target || "").trim();
      if (!normalized) {
        return false;
      }
      if (!query) {
        return true;
      }
      return normalized.toLowerCase().includes(query);
    });
    const dedup = Array.from(new Set(raw));
    return dedup.slice(0, 14);
  };

  const scheduleClose = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      setOpenSourceBrand(null);
    }, 120);
  };

  return (
    <div className="card designers-tab-card">
      <div className="designers-tab-head">
        <h2>Дизайнеры</h2>
        {rows.length > 0 || loading ? (
          <input
            className="input"
            placeholder="Поиск по бренду"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        ) : null}
      </div>

      {!loading && filteredRows.length > 0 ? (
        <div className="designers-grid designers-grid--head">
          <div>Исходный бренд</div>
          <div>Новое название</div>
          <div>В дизайнеры</div>
        </div>
      ) : null}

      <div className="designers-grid-wrap">
        {loading ? <p className="muted">Загрузка брендов...</p> : null}
        {!loading && filteredRows.length === 0 ? (
          <EmptyState compact title="Ничего не найдено" />
        ) : null}
        {!loading
          ? filteredRows.map((row) => {
              const suggestions = getSuggestions(row);
              const isOpen = openSourceBrand === row.source_brand;
              return (
                <div key={row.source_brand} className="designers-grid">
                  <div className="designers-source">{row.source_brand}</div>
                  <div className="designers-combobox-wrap" onBlur={scheduleClose}>
                    <input
                      className="input"
                      value={row.target_brand}
                      onFocus={() => setOpenSourceBrand(row.source_brand)}
                      onChange={(event) => {
                        onChangeTarget(row.source_brand, event.target.value);
                        setOpenSourceBrand(row.source_brand);
                      }}
                    />
                    {isOpen && suggestions.length > 0 ? (
                      <div className="designers-combobox-list" role="listbox">
                        {suggestions.map((value) => (
                          <button
                            key={`${row.source_brand}-${value}`}
                            type="button"
                            className="designers-combobox-item"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              onChangeTarget(row.source_brand, value);
                              setOpenSourceBrand(row.source_brand);
                            }}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <label className="ui-switch ui-switch--compact designers-toggle">
                    <input
                      type="checkbox"
                      checked={Boolean(row.include_in_designers)}
                      onChange={(event) => onToggleIncludeInDesigners(row.source_brand, event.target.checked)}
                    />
                    <span className="ui-switch-track">
                      <span className="ui-switch-thumb" />
                    </span>
                    <span className="ui-switch-text">В дизайнеры</span>
                  </label>
                </div>
              );
            })
          : null}
      </div>

      {filteredRows.length > 0 ? (
        <div className="designers-save-fab-wrap">
          <button type="button" className="btn designers-save-fab" disabled={saving || hasInvalid} onClick={() => void onSave()}>
            {saving ? "Сохраняем..." : hasUnsavedChanges ? "Сохранить изменения" : "Сохранить"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
