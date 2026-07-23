import { useEffect, useId, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

/**
 * Catalog search for admin showcase.
 * Behavior mirrors public SiteHeader search: expand on icon, submit on Enter/icon,
 * navigate to /catalog?q=… (empty query clears q).
 */
export function AdminShowcaseSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const urlQuery = searchParams.get("q")?.trim() ?? "";
  const [value, setValue] = useState(urlQuery);
  const [expanded, setExpanded] = useState(urlQuery !== "");

  useEffect(() => {
    setValue(urlQuery);
    if (urlQuery !== "") {
      setExpanded(true);
    }
  }, [urlQuery, location.pathname]);

  const submitSearch = (raw: string) => {
    const nextValue = raw.trim();
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("page");
    if (nextValue === "") {
      nextParams.delete("q");
    } else {
      nextParams.set("q", nextValue);
    }
    const search = nextParams.toString();
    navigate({
      pathname: "/catalog",
      search: search ? `?${search}` : "",
    });
  };

  return (
    <div className={expanded ? "showcase-search showcase-search--expanded" : "showcase-search"}>
      <label className="showcase-search__field" htmlFor={inputId} aria-hidden={!expanded}>
        <input
          id={inputId}
          ref={inputRef}
          type="search"
          className="showcase-search__input"
          value={value}
          placeholder="Поиск"
          aria-label="Поиск товара"
          onChange={(event) => setValue(event.target.value)}
          onBlur={() => {
            if (value.trim() === "" && urlQuery === "") {
              setExpanded(false);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submitSearch(value);
            }
            if (event.key === "Escape") {
              event.preventDefault();
              if (value.trim() === "") {
                setExpanded(false);
              }
            }
          }}
        />
      </label>
      <button
        type="button"
        className="showcase-search__button"
        aria-label={expanded ? "Запустить поиск" : "Открыть поиск"}
        onClick={() => {
          if (!expanded) {
            setExpanded(true);
            window.requestAnimationFrame(() => inputRef.current?.focus());
            return;
          }
          submitSearch(value);
        }}
      >
        <svg className="showcase-search__icon" viewBox="0 0 23 23" fill="none" aria-hidden="true">
          <path
            d="M14.4149 13.6406C15.2802 12.5931 15.8267 11.2495 15.8267 9.76931C15.8267 6.44455 13.1168 3.73465 9.79208 3.73465C6.46733 3.73465 3.75743 6.44455 3.75743 9.76931C3.75743 13.0941 6.46733 15.804 9.79208 15.804C11.2495 15.804 12.6158 15.2802 13.6634 14.3921L18.3545 19.0832C18.4683 19.197 18.605 19.2426 18.7416 19.2426C18.8782 19.2426 19.0149 19.197 19.1287 19.0832C19.3337 18.8782 19.3337 18.5139 19.1287 18.3089L14.4149 13.6406ZM9.76931 14.7109C7.03663 14.7109 4.82772 12.502 4.82772 9.76931C4.82772 7.03663 7.03663 4.82772 9.76931 4.82772C12.502 4.82772 14.7109 7.03663 14.7109 9.76931C14.7109 12.502 12.502 14.7109 9.76931 14.7109Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  );
}
