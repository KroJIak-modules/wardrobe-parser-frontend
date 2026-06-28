import { Link } from "react-router-dom";
import { toExternalHttpUrl } from "../shared/external-links";
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
  const pricingExampleHref = pricingExample?.productId ? `/product/${pricingExample.productId}?from=admin` : null;
  const pricingExampleSourceHref = toExternalHttpUrl(pricingExample?.url);
  const formatMetricMoney = (value: number, currency: string, hasRange: boolean) => {
    const formatted = formatDisplayMoney(value, currency);
    return hasRange ? `От ${formatted}` : formatted;
  };

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
            <strong>{pricingExample.isSample ? "Пример расчета:" : "Пример на товаре:"}</strong>
            <HelpHint
              text={
                pricingExample.isSample
                  ? "Если в каталоге пока нет товара с полным derived pricing, система показывает типовой пример по текущей формуле и активному тарифу."
                  : "Это реальный товар из базы. Пример показывает, как числа подставляются в формулу."
              }
            />
          </p>
          <div className="pricing-example-head">
            {pricingExampleHref ? (
              <Link className="pricing-example-thumb-link" to={pricingExampleHref}>
                <ImageWithFallback
                  src={toCompressedThumbUrl(pricingExample.imageUrl, 240, 240, 55)}
                  alt={pricingExample.title}
                  className="pricing-example-thumb"
                  placeholderClassName="pricing-example-thumb-placeholder photo-placeholder"
                  placeholderText="Нет фото"
                  loadingText="Загружаем..."
                />
              </Link>
            ) : (
              <div className="pricing-example-thumb-link">
                <ImageWithFallback
                  src={toCompressedThumbUrl(pricingExample.imageUrl, 240, 240, 55)}
                  alt={pricingExample.title}
                  className="pricing-example-thumb"
                  placeholderClassName="pricing-example-thumb-placeholder photo-placeholder"
                  placeholderText="Нет фото"
                  loadingText="Загружаем..."
                />
              </div>
            )}
            <div className="pricing-example-title-row">
              {pricingExampleHref ? (
                <Link className="btn-link pricing-example-title-link" to={pricingExampleHref}>
                  {pricingExample.title}
                </Link>
              ) : (
                <span className="pricing-example-title-link">{pricingExample.title}</span>
              )}
              {pricingExampleSourceHref ? (
                <a className="btn-link pricing-example-source-link" href={pricingExampleSourceHref} target="_blank" rel="noreferrer">
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
              <div className="pricing-example-metric-value">{formatMetricMoney(pricingExample.sourcePrice, pricingExample.sourceCurrency, pricingExample.sourceHasRange)}</div>
            </div>
            <div className="pricing-example-metric">
              <div className="pricing-example-metric-key" dangerouslySetInnerHTML={{ __html: pricingExample.summaryRubLatex }} />
              <div className="pricing-example-metric-value">{formatMetricMoney(pricingExample.sourcePriceRub, "RUB", pricingExample.sourceHasRange)}</div>
            </div>
            <div className="pricing-example-metric">
              <div className="pricing-example-metric-key" dangerouslySetInnerHTML={{ __html: pricingExample.summaryFpLatex }} />
              <div className="pricing-example-metric-value">{formatMetricMoney(pricingExample.finalPrice, "RUB", pricingExample.finalHasRange)}</div>
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
