import { Link } from "react-router-dom";
import { ImageWithFallback } from "../shared/image-with-fallback";
import type { PricingSettings } from "../shared/live-data-context";
import { AdminPricingSkeleton } from "../shared/skeleton";
import { formatDisplayMoney, renderLegendSymbol, toCompressedThumbUrl } from "./admin-formatters";
import { HelpHint } from "./help-hint";
import type { PricingExampleView } from "./admin-types";

type Props = {
  pricingSettings: PricingSettings;
  pricingFormulaHtml: string;
  pricingExample: PricingExampleView | null;
  pricingExampleLoading: boolean;
  pricingExampleError: string | null;
};

export function AdminPricingFormulaSection({ pricingSettings, pricingFormulaHtml, pricingExample, pricingExampleLoading, pricingExampleError }: Props) {
  return (
    <div className="pricing-formula-box">
      <h3 className="with-help">
        Формула финальной цены
        <HelpHint text="Это единая формула, по которой система считает цену для витрины. Она одинаковая для всех магазинов." />
      </h3>
      <div className="pricing-formula-text pricing-formula-latex pricing-main-formula" dangerouslySetInnerHTML={{ __html: pricingFormulaHtml }} />
      {pricingExample ? (
        <div className="pricing-example-box">
          <p className="with-help">
            <strong>Пример на товаре:</strong>
            <HelpHint text="Это реальный товар из базы. Пример показывает, как числа подставляются в формулу." />
          </p>
          <div className="pricing-example-head">
            <Link className="pricing-example-thumb-link" to={`/product/${pricingExample.productId}?from=admin`}>
              <ImageWithFallback
                src={toCompressedThumbUrl(pricingExample.imageUrl, 240, 240, 55)}
                alt={pricingExample.title}
                className="pricing-example-thumb"
                placeholderClassName="pricing-example-thumb-placeholder photo-placeholder"
                placeholderText="Нет фото"
                loadingText="Загружаем..."
              />
            </Link>
            <div className="pricing-example-title-row">
              <Link className="btn-link pricing-example-title-link" to={`/product/${pricingExample.productId}?from=admin`}>
                {pricingExample.title}
              </Link>
              {pricingExample.url ? (
                <a className="btn-link pricing-example-source-link" href={pricingExample.url} target="_blank" rel="noreferrer">
                  {pricingExample.sourceName || "Источник"}
                </a>
              ) : (
                <span className="muted pricing-example-source-link">{pricingExample.sourceName || "Источник"}</span>
              )}
            </div>
          </div>
          <div className="pricing-formula-text pricing-formula-latex pricing-example-formula" dangerouslySetInnerHTML={{ __html: pricingExample.formulaHtml }} />
          <div className="pricing-example-summary">
            <div className="pricing-example-metric">
              <div className="pricing-example-metric-key" dangerouslySetInnerHTML={{ __html: pricingExample.summarySpLatex }} />
              <div className="pricing-example-metric-value">{formatDisplayMoney(pricingExample.sourcePrice, pricingExample.sourceCurrency)}</div>
            </div>
            <div className="pricing-example-metric">
              <div className="pricing-example-metric-key" dangerouslySetInnerHTML={{ __html: pricingExample.summaryRubLatex }} />
              <div className="pricing-example-metric-value">{formatDisplayMoney(pricingExample.sourcePriceRub, "RUB")}</div>
            </div>
            <div className="pricing-example-metric">
              <div className="pricing-example-metric-key" dangerouslySetInnerHTML={{ __html: pricingExample.summaryFpLatex }} />
              <div className="pricing-example-metric-value">{formatDisplayMoney(pricingExample.finalPrice, "RUB")}</div>
            </div>
            <div className="pricing-example-metric">
              <div className="pricing-example-metric-key">Моржа</div>
              <div className="pricing-example-metric-value">{formatDisplayMoney(pricingExample.marginRub, "RUB")}</div>
            </div>
          </div>
        </div>
      ) : pricingExampleLoading ? (
        <div className="pricing-example-box">
          <AdminPricingSkeleton />
        </div>
      ) : (
        <div className="pricing-example-box pricing-example-box--empty">
          <p className="with-help">
            <strong>Пример на товаре:</strong>
          </p>
          <div className="login-error-alert" role="alert" aria-live="polite">
            {pricingExampleError || "Не удалось собрать пример: у доступных товаров не хватает расчетных полей."}
          </div>
        </div>
      )}
      <div className="pricing-formula-legend pricing-legend-grid">
        {pricingSettings.formula_legend.map((item) => (
          <div key={item.key} className="pricing-legend-item">
            <p
              className={pricingExample?.legendDim?.[item.key] ? "pricing-legend-key pricing-legend-key--dim" : "pricing-legend-key"}
              dangerouslySetInnerHTML={{ __html: renderLegendSymbol(item.key) }}
            />
            <p className="muted">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
