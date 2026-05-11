import type { Metadata } from "next";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";

import BodyClassBridge from "@/components/body-class-bridge";
import { getCartPreviewItem } from "@/lib/cart-preview";
import { localeCookieName, normalizeLocale, t } from "@/lib/i18n";
import { getSiteSettings } from "@/lib/storefront";

export const metadata: Metadata = {
  title: "Linery book - Thanh toán đơn hàng",
};

function Field({
  label,
  value,
  disabled = false,
  type = "text",
}: {
  disabled?: boolean;
  label: string;
  type?: string;
  value?: string;
}) {
  return (
    <div className="field">
      <div className="field__input-wrapper">
        <input className="field__input" defaultValue={value} disabled={disabled} placeholder={label} type={type} />
        <label className="field__label">{label}</label>
      </div>
    </div>
  );
}

function SelectField({ label, value, disabled = false }: { disabled?: boolean; label: string; value: string }) {
  return (
    <div className="field">
      <div className="field__input-wrapper field__input-wrapper--select">
        <select className="field__input field__input--select" defaultValue={value} disabled={disabled} aria-label={label}>
          <option value={value}>{value}</option>
        </select>
        <label className="field__label">{label}</label>
      </div>
    </div>
  );
}

export default async function CheckoutPage() {
  const item = await getCartPreviewItem();
  const settings = await getSiteSettings();
  const locale = normalizeLocale((await cookies()).get(localeCookieName)?.value);

  return (
    <>
      <BodyClassBridge className="" id="" />
      <form id="checkoutForm" className="tsq-checkout-page" action="/checkout" method="post">
        <main className="main tsq-checkout-main">
          <header className="main__header tsq-checkout-header">
            <Link href="/">
              {settings.logo?.src ? <Image src={settings.logo.src} alt={settings.logo.alt || "Linery book"} width={88} height={44} /> : null}
            </Link>
          </header>
          <div className="main__content tsq-checkout-content">
            <section className="section tsq-checkout-info">
              <div className="section__header tsq-checkout-section-title">
                <h2>{t(locale, "site.receiverInfo")}</h2>
                <Link href="/account/logout">{t(locale, "admin.logout")}</Link>
              </div>
              <div className="fieldset">
                <SelectField label={locale === "en" ? "Address book" : "Sổ địa chỉ"} value={locale === "en" ? "Other address..." : "Địa chỉ khác..."} />
                <Field label={t(locale, "site.email")} value="khachhang@example.com" disabled type="email" />
                <Field label={t(locale, "site.fullName")} value={locale === "en" ? "Customer" : "Khách hàng"} />
                <Field label={t(locale, "site.phone")} value="+84900000000" type="tel" />
                <Field label={t(locale, "site.address")} />
                <SelectField label={locale === "en" ? "Province / city" : "Tỉnh thành"} value="---" />
                <SelectField label={locale === "en" ? "District" : "Quận huyện"} value={locale === "en" ? "District" : "Quận huyện"} disabled />
                <SelectField label={locale === "en" ? "Ward" : "Phường xã"} value={locale === "en" ? "Ward" : "Phường xã"} disabled />
                <div className="field">
                  <div className="field__input-wrapper">
                    <textarea id="note" className="field__input" name="note" placeholder={t(locale, "site.notePlaceholder")} />
                  </div>
                </div>
              </div>
            </section>

            <div className="tsq-checkout-secondary">
              <section className="section tsq-checkout-shipping">
                <div className="section__header tsq-checkout-section-title">
                  <h2>{t(locale, "site.shipping")}</h2>
                </div>
                <div className="tsq-checkout-alert">{t(locale, "site.shippingInfoRequired")}</div>
              </section>

              <section className="section tsq-checkout-payment">
                <div className="section__header tsq-checkout-section-title">
                  <h2>{t(locale, "site.payment")}</h2>
                </div>
                <div className="content-box">
                  {(locale === "en" ? ["Bank transfer", "MBBank VietQR payment", "Cash on delivery (COD)"] : ["Chuyển khoản", "Thanh toán qua MBBank VietQR", "Thu hộ (COD)"]).map((method, index) => (
                    <label key={method} className="tsq-payment-option">
                      <input className="input-radio" type="radio" name="paymentMethod" defaultChecked={index === 0} />
                      <span>{method}</span>
                    </label>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </main>

        <aside className="sidebar tsq-checkout-sidebar">
          <div className="sidebar__header">
            <h2>{t(locale, "site.checkoutOrder")}</h2>
          </div>
          <div id="order-summary" className="order-summary order-summary--is-collapsed">
            <table id="product-table" className="product-table">
              <tbody>
                <tr className="product">
                  <td className="product__image">
                    <div className="tsq-checkout-product-image">
                      {item.imageUrl ? <Image src={item.imageUrl} alt={item.imageAlt} width={50} height={50} /> : null}
                      <span>{item.quantity}</span>
                    </div>
                  </td>
                  <th className="product__description">
                    <span>{item.title}</span>
                  </th>
                  <td className="product__price">{item.price}</td>
                </tr>
              </tbody>
            </table>

            <div className="tsq-discount field">
              <div className="field__input-wrapper">
                <input id="reductionCode" className="field__input" name="reductionCode" placeholder={t(locale, "site.discountPlaceholder")} type="text" />
              </div>
              <button className="field__input-btn btn spinner btn--disabled" type="button">
                {t(locale, "site.apply")}
              </button>
            </div>

            <table className="tsq-checkout-total-table">
              <tbody>
                <tr className="total-line total-line--subtotal">
                  <th>{t(locale, "site.subtotal")}</th>
                  <td>{item.price}</td>
                </tr>
                <tr className="total-line total-line--shipping-fee">
                  <th>{t(locale, "site.shippingFee")}</th>
                  <td>-</td>
                </tr>
                <tr className="total-line payment-due">
                  <th>{t(locale, "site.total")}</th>
                  <td>{item.price}</td>
                </tr>
              </tbody>
            </table>

            <div className="tsq-checkout-actions">
              <Link href="/cart" className="previous-link">
                {t(locale, "site.backToCart")}
              </Link>
              <button className="btn btn-checkout spinner" type="button">
                {t(locale, "site.orderNow")}
              </button>
            </div>
          </div>
        </aside>
      </form>
    </>
  );
}
