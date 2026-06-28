import { Link } from "react-router-dom";
import { siteFooterColumns } from "../../app/site-static-content";

export function SiteFooterSection({ layout = "desktop" }: { layout?: "desktop" | "mobile" }) {
  return (
    <footer className={`site-footer${layout === "mobile" ? " site-footer--mobile" : ""}`} aria-label="Дополнительная информация">
      {siteFooterColumns.map((column) => (
        <section key={column.title} className="site-footer__column">
          <div className="site-footer__title">{column.title}</div>
          <div className="site-footer__links">
            {column.links.map((item) =>
              item.to ? (
                <Link key={item.label} className="site-footer__link" to={item.to}>
                  {item.label}
                </Link>
              ) : item.href ? (
                <a key={item.label} className="site-footer__link" href={item.href} target="_blank" rel="noreferrer">
                  {item.label}
                </a>
              ) : (
                <span key={item.label} className="site-footer__link">
                  {item.label}
                </span>
              ),
            )}
          </div>
        </section>
      ))}
    </footer>
  );
}
