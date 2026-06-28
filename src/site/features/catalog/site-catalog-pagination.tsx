export type SiteCatalogPaginationItem = number | "ellipsis";

export function buildCatalogPaginationItems(currentPage: number, totalPages: number): SiteCatalogPaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 5, "ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, "ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages];
}

export function SiteCatalogPagination({
  currentPage,
  totalPages,
  onPageChange,
  layout = "desktop",
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  layout?: "desktop" | "mobile";
}) {
  const pageItems = buildCatalogPaginationItems(currentPage, totalPages);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className={layout === "mobile" ? "site-catalog-pagination site-catalog-pagination--mobile" : "site-catalog-pagination"}
      aria-label="Страницы каталога"
    >
      <button
        type="button"
        className="site-catalog-pagination__arrow site-catalog-pagination__arrow--left"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        aria-label="Предыдущая страница"
      >
        <svg viewBox="0 0 6 11" aria-hidden="true">
          <path d="M0.199636 10.8394C0.420545 11.0539 0.777818 11.0539 0.998182 10.8394L5.66891 6.29423C5.77346 6.19404 5.85671 6.07345 5.9136 5.9398C5.97049 5.80616 5.99982 5.66224 5.99982 5.5168C5.99982 5.37136 5.97049 5.22745 5.9136 5.0938C5.85671 4.96015 5.77346 4.83957 5.66891 4.73938L0.964364 0.160625C0.857593 0.0582965 0.716199 0.000780936 0.568897 -0.000240587C0.421595 -0.00126211 0.279429 0.054287 0.171273 0.155125C0.117694 0.204923 0.0748234 0.26528 0.0453167 0.332461C0.01581 0.399642 0.000294966 0.472216 -0.000267501 0.545689C-0.000829969 0.619161 0.0135721 0.691968 0.0420467 0.7596C0.0705214 0.827232 0.112462 0.88825 0.165273 0.938875L4.47109 5.12823C4.52341 5.17832 4.56507 5.23863 4.59354 5.30548C4.62201 5.37233 4.63669 5.44432 4.63669 5.51708C4.63669 5.58983 4.62201 5.66182 4.59354 5.72867C4.56507 5.79552 4.52341 5.85583 4.47109 5.90593L0.199636 10.0623C0.147333 10.1123 0.105681 10.1726 0.0772178 10.2394C0.0487547 10.3062 0.0340761 10.3781 0.0340761 10.4509C0.0340761 10.5236 0.0487547 10.5955 0.0772178 10.6623C0.105681 10.7291 0.147333 10.7894 0.199636 10.8394Z" />
        </svg>
      </button>

      {pageItems.map((item, index) =>
        item === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="site-catalog-pagination__ellipsis" aria-hidden="true">
            ...
          </span>
        ) : (
          <button
            key={item}
            type="button"
            className={
              item === currentPage
                ? "site-catalog-pagination__page site-catalog-pagination__page--active"
                : "site-catalog-pagination__page"
            }
            onClick={() => onPageChange(item)}
            aria-current={item === currentPage ? "page" : undefined}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        className="site-catalog-pagination__arrow site-catalog-pagination__arrow--right"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        aria-label="Следующая страница"
      >
        <svg viewBox="0 0 6 11" aria-hidden="true">
          <path d="M0.199636 10.8394C0.420545 11.0539 0.777818 11.0539 0.998182 10.8394L5.66891 6.29423C5.77346 6.19404 5.85671 6.07345 5.9136 5.9398C5.97049 5.80616 5.99982 5.66224 5.99982 5.5168C5.99982 5.37136 5.97049 5.22745 5.9136 5.0938C5.85671 4.96015 5.77346 4.83957 5.66891 4.73938L0.964364 0.160625C0.857593 0.0582965 0.716199 0.000780936 0.568897 -0.000240587C0.421595 -0.00126211 0.279429 0.054287 0.171273 0.155125C0.117694 0.204923 0.0748234 0.26528 0.0453167 0.332461C0.01581 0.399642 0.000294966 0.472216 -0.000267501 0.545689C-0.000829969 0.619161 0.0135721 0.691968 0.0420467 0.7596C0.0705214 0.827232 0.112462 0.88825 0.165273 0.938875L4.47109 5.12823C4.52341 5.17832 4.56507 5.23863 4.59354 5.30548C4.62201 5.37233 4.63669 5.44432 4.63669 5.51708C4.63669 5.58983 4.62201 5.66182 4.59354 5.72867C4.56507 5.79552 4.52341 5.85583 4.47109 5.90593L0.199636 10.0623C0.147333 10.1123 0.105681 10.1726 0.0772178 10.2394C0.0487547 10.3062 0.0340761 10.3781 0.0340761 10.4509C0.0340761 10.5236 0.0487547 10.5955 0.0772178 10.6623C0.105681 10.7291 0.147333 10.7894 0.199636 10.8394Z" />
        </svg>
      </button>
    </nav>
  );
}
