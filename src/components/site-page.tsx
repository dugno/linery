import Link from "next/link";

import AccountPageContent from "@/components/account-page";
import BodyClassBridge from "@/components/body-class-bridge";
import LanguageSwitcher from "@/components/language-switcher";
import SearchProducts from "@/components/search-products";
import { getCartPreviewItem } from "@/lib/cart-preview";
import { t, type Locale } from "@/lib/i18n";
import type {
  AccountPage,
  Article,
  Blog,
  CartPage,
  Collection,
  HomePage,
  NavItem,
  Product,
  ProductCardData,
  SearchPage,
  SiteSettings,
  StaticContentPage,
  StorefrontPage,
  UnknownPage,
} from "@/content/types";

function isInternalHref(href: string) {
  return href.startsWith("/");
}

function SiteLink({
  children,
  href,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: React.ReactNode;
  href: string;
}) {
  if (isInternalHref(href)) {
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}

function NavTree({ items }: { items: NavItem[] }) {
  return (
    <ul className="navigation navigation-horizontal list-group list-group-flush scroll">
      {items.map((item) => (
        <li key={`${item.href}-${item.title}`} className="menu-item list-group-item">
          <SiteLink href={item.href} className="menu-item__link" title={item.title}>
            <span>{item.title}</span>
            {item.children.length ? (
              <i className="float-right" data-toggle-submenu>
                <svg className="icon">
                  <use xlinkHref="#icon-arrow" />
                </svg>
              </i>
            ) : null}
          </SiteLink>

          {item.children.length ? (
            <div className="submenu scroll default">
              <ul className="submenu__list container">
                {item.children.map((child) => (
                  <li key={`${child.href}-${child.title}`} className="submenu__item submenu__item--main">
                    <SiteLink className="link" href={child.href} title={child.title}>
                      {child.title}
                    </SiteLink>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <div className="item product-col col-6 col-md-4 col-lg-15">
      <div className="item_product_main">
        <div className="product-thumbnail pos-relative">
          <SiteLink
            className="image_thumb pos-relative embed-responsive embed-responsive-1by1"
            href={product.href}
            title={product.title}
          >
            {product.imageUrl ? (
              <img
                loading="lazy"
                className="img-fetured"
                width={480}
                height={480}
                style={{ ["--image-scale" as never]: 1 }}
                src={product.imageUrl}
                alt={product.imageAlt}
              />
            ) : null}
          </SiteLink>
        </div>

        <div className="product-info">
          {product.vendor ? <span className="product-vendor">{product.vendor}</span> : null}
          <span className="product-name">
            <SiteLink className="link line-clamp-2" href={product.href} title={product.title}>
              {product.title}
            </SiteLink>
          </span>
          <div className="product-item-cta position-relative">
            <div className="price-box">
              <span className="price">{product.price}</span>
              {product.comparePrice ? <span className="compare-price">{product.comparePrice}</span> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SiteHeader({ locale, settings }: { locale: Locale; settings: SiteSettings }) {
  return (
    <>
      {settings.topBanner ? (
        <div className="top-banner position-relative" style={{ background: "#d64d17" }}>
          <div className="container text-center px-0">
            <SiteLink className="position-relative d-block" href={settings.topBanner.href} style={{ color: "#ffffff" }}>
              {settings.topBanner.text}
            </SiteLink>
          </div>
        </div>
      ) : null}

      <header className="ega-header ega-pos--relative">
        <div className="header-wrap container">
          <div className="toggle-nav btn menu-bar mr-4 ml-0 p-0 d-lg-none d-flex text-white">
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
          </div>

          <div id="logo">
            <SiteLink href="/" className="logo-wrapper">
              {settings.logo?.src ? (
                <img className="img-fluid" src={settings.logo.src} alt={settings.logo.alt || "logo Tiệm sách Quýt"} width={200} height={100} />
              ) : null}
            </SiteLink>
          </div>

          <div className="navigation--horizontal d-lg-flex align-items-center d-none">
            <div className="navigation-wrapper navigation-horizontal-wrapper">
              <nav>
                <NavTree items={settings.menu} />
              </nav>
            </div>
          </div>

          <div className="header-right ega-d--flex">
            <div className="icon-action header-right__icons" style={{ ["--header-grid-template" as never]: "repeat(4, 1fr)" }}>
              <SiteLink className="header-icon icon-action__search icon-action__search--desktop" href="/search">
                {settings.searchIcon?.src ? <img src={settings.searchIcon.src} alt={settings.searchIcon.alt || "icon-search"} /> : t(locale, "common.search")}
              </SiteLink>
              <SiteLink id="icon-account" className="ega-color--inherit header-icon icon-account d-none d-lg-block" href="/account/login">
                {settings.accountIcon?.src ? <img src={settings.accountIcon.src} alt={settings.accountIcon.alt || "icon-account"} /> : "Account"}
              </SiteLink>
              <div className="mini-cart text-xs-center">
                <SiteLink className="header-icon cart-count ega-color--inherit" href="/cart" title={t(locale, "site.cart")}>
                  {settings.cartIcon?.src ? <img src={settings.cartIcon.src} alt={settings.cartIcon.alt || "icon-cart"} /> : t(locale, "site.cart")}
                  <span className="count_item count_item_pr">0</span>
                </SiteLink>
              </div>
              <LanguageSwitcher className="tsq-language-switcher-site" />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

function SiteFooter({ locale, settings }: { locale: Locale; settings: SiteSettings }) {
  return (
    <footer>
      <div className="mid-footer">
        <div className="container">
          <div className="row">
            <div className="col-xl-3">
              <div className="footer-block footer-click">
                <SiteLink href="/" className="logo-wrapper mb-3 d-block">
                  {settings.footerLogo?.src ? <img loading="lazy" src={settings.footerLogo.src} alt={settings.footerLogo.alt || "logo Tiệm sách Quýt"} width={80} height={80} /> : null}
                </SiteLink>
                <div className="text-base font-semibold mb-2 h4">Tiệm sách Quýt</div>
                {settings.contact.address ? (
                  <div className="single-contact">
                    <i className="fa fa-map-marker-alt" />
                    <div className="content">{t(locale, "site.address")}: <span>{settings.contact.address}</span></div>
                  </div>
                ) : null}
                {settings.contact.phone ? (
                  <div className="single-contact">
                    <i className="fa fa-mobile-alt" />
                    <div className="content">
                      {t(locale, "site.phone")}: <a className="link" href={`tel:${settings.contact.phone}`}>{settings.contact.phone}</a>
                    </div>
                  </div>
                ) : null}
                {settings.contact.email ? (
                  <div className="single-contact">
                    <i className="fa fa-envelope" />
                    <div className="content">
                      Email: <a className="link" href={`mailto:${settings.contact.email}`}>{settings.contact.email}</a>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="col-xl-9">
              <div className="row">
                {settings.footerGroups.map((group) => (
                  <div key={group.title} className="col-lg-4">
                    <div className="footer-block footer-click">
                      <h3 className="footer-title title-menu clicked">{group.title}</h3>
                      <ul className="list-menu toggle-mn">
                        {group.links.map((link) => (
                          <li key={`${link.href}-${link.title}`} className="li_menu">
                            <SiteLink className="link" href={link.href} title={link.title}>
                              {link.title}
                            </SiteLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Breadcrumbs({ items }: { items: { href: string; title: string }[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="bread-crumb mb-3">
      <div className="container">
        <ul className="breadcrumb m-0 px-0 py-2">
          {items.map((item, index) => (
            <li key={`${item.href}-${item.title}`}>
              {index > 0 ? <span className="mr-1">/</span> : null}
              {item.href ? (
                <SiteLink href={item.href} title={item.title}>
                  <span>{item.title}</span>
                </SiteLink>
              ) : (
                <strong>
                  <span>{item.title}</span>
                </strong>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function HomeTemplate({ page }: { page: HomePage }) {
  return (
    <>
      <section className="section_slider section">
        <div className="container">
          <div className="home-slider btn-slide--new">
            <SiteLink href={page.sliderLink || "/collections/all"} title={page.title}>
              {page.sliderImage?.src ? <img src={page.sliderImage.src} alt={page.sliderImage.alt || page.title} className="img-fluid" /> : null}
            </SiteLink>
          </div>
        </div>
      </section>

      {page.sections.map((section) => (
        <section key={section.title} className="section section_index_prd">
          <div className="container">
            <div className="title_module_main heading-bar d-flex align-items-center flex-wrap justify-content-between">
              <h2 className="heading-bar__title">
                <SiteLink className="link" href={section.href || "#"} title={section.title}>
                  {section.title}
                </SiteLink>
              </h2>
            </div>
            <div className="row section_prd_feature">
              {section.products.map((product) => (
                <ProductCard key={`${section.title}-${product.href}`} product={product} />
              ))}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}

function CollectionTemplate({ page }: { page: Collection }) {
  return (
    <>
      <Breadcrumbs items={page.breadcrumbs} />
      <section className="section wrap_background">
        <div className="container">
          <div className="bg_collection section">
            <div className="coll-head">
              <h1 className="title_page collection-title mb-0 pb-3">{page.title}</h1>
            </div>
            <div className="row">
              <div className="col-lg-3 col-md-12 col-sm-12">
                <aside className="scroll card px-2 py-2 dqdt-sidebar sidebar left-content">
                  <div className="wrap_background_aside asidecollection">
                    <div className="filter-content aside-filter">
                      {page.filters.slice(0, 4).map((filter) => (
                        <aside key={filter.title} className="aside-item">
                          <div className="aside-title">
                            <h2 className="title-head margin-top-0">
                              <span>{filter.title}</span>
                            </h2>
                          </div>
                          <div className="aside-content filter-group">
                            <ul>
                              {filter.items.slice(0, 12).map((item) => (
                                <li key={item} className="filter-item filter-item--check-box filter-item--green">
                                  <span>
                                    <label className="custom-checkbox">
                                      <input type="checkbox" disabled />
                                      <i className="fa" />
                                      {item}
                                    </label>
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </aside>
                      ))}
                    </div>
                  </div>
                </aside>
              </div>

              <div className="col-lg-9 col-md-12 col-sm-12">
                <div className="row">
                  {page.products.map((product) => (
                    <ProductCard key={product.href} product={product} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ProductTemplate({ locale, page }: { locale: Locale; page: Product }) {
  return (
    <>
      <Breadcrumbs items={page.breadcrumbs} />
      <section className="product details-main">
        <section className="section mt-0 mb-lg-4 mb-3 mb-sm-0">
          <div className="container">
            <div className="section wrap-padding-15 wp_product_main m-0">
              <div className="details-product fixed-layout">
                <div className="row m-sm-0">
                  <div className="product-detail-left product-images bg-white col-12 col-lg-7 overflow-hidden thumbs-on-mobile--show">
                    <div className="pt-0 col_large_full large-image">
                      {page.image?.src ? <img className="img-fluid" src={page.image.src} alt={page.image.alt || page.title} /> : null}
                    </div>
                  </div>

                  <div className="col-xs-12 col-lg-5 details-pro bg-white py-3 mt-3 mt-lg-0 px-3">
                    <h1 className="title-product">{page.title}</h1>
                    <div className="group-status">
                      {page.author ? <span className="first_status mr-2">{t(locale, "site.author")}: <span className="status_name">{page.author}</span></span> : null}
                      {page.condition ? <span className="first_status mr-2">{t(locale, "site.condition")}: <span className="status_name">{page.condition}</span></span> : null}
                    </div>
                    <div className="price-box">
                      <div className="special-price">
                        <span className="price product-price">{page.price}</span>
                      </div>
                    </div>
                    <div className="product-summary">
                      <div className="rte">
                        <div className="product-summary-content" dangerouslySetInnerHTML={{ __html: page.descriptionHtml }} />
                      </div>
                    </div>
                    <div className="form_button_details w-100">
                      <div className="form_product_content type1">
                        <div className="soluong soluong_type_1">
                          <div className="input_number_product custom-btn-number">
                            <button className="btn btn_num num_1 button button_qty" type="button" aria-label="Giảm số lượng">
                              -
                            </button>
                            <input className="form-control prd_quantity" type="text" value="1" readOnly aria-label="Số lượng" />
                            <button className="btn btn_num num_2 button button_qty" type="button" aria-label="Tăng số lượng">
                              +
                            </button>
                          </div>
                          <div className="button_actions mb-0">
                            <div style={{ display: "flex", flexWrap: "wrap", width: "100%" }}>
                              <SiteLink href="/cart" className="btn btn_add_cart btn-cart">{t(locale, "site.addToCart")}</SiteLink>
                            </div>
                          </div>
                        </div>
                        <div className="button_actions">
                          <SiteLink href="/checkout" className="btn btn_base buynow">{t(locale, "site.buyNow")}</SiteLink>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>

      {page.relatedProducts.length ? (
        <section className="section sec_tab mt-0 mb-lg-4 mb-3 mb-sm-0">
          <div className="container">
            <div className="related-product">
              <div className="title_module heading-bar d-flex justify-content-between align-items-center">
                <h2 className="bf_flower heading-bar__title">
                  <a className="link" href={page.breadcrumbs.at(-1)?.href || "/collections/all"}>
                    {t(locale, "site.related")}
                  </a>
                </h2>
              </div>
              <div className="row section_prd_feature">
                {page.relatedProducts.map((product) => (
                  <ProductCard key={product.href} product={product} />
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

function StaticPageTemplate({ page }: { page: StaticContentPage }) {
  return (
    <>
      <Breadcrumbs items={page.breadcrumbs} />
      <section className="wrap_background_aside margin-bottom-40">
        <div className="container">
          <h1 className="title_page">{page.title}</h1>
          <div className="content-page rte py-3" dangerouslySetInnerHTML={{ __html: page.contentHtml }} />
        </div>
      </section>
    </>
  );
}

function BlogTemplate({ page }: { page: Blog }) {
  return (
    <section className="blogpage section">
      <div className="containers">
        <div className="wrap_background_aside margin-bottom-0">
          <div className="container">
            <h1 className="title_page text-center">{page.title}</h1>
            <div className="row blog-list">
              <div className="col-lg-9 col-12 content-blog">
                <div className="row">
                  {page.articles.map((article) => (
                    <div key={article.href} className="col-12">
                      <div className="blogwp">
                        <a
                          className="image-blog text-center position-relative d-flex align-items-center justify-content-center aspect-ratio overflow-hidden"
                          href={article.href}
                          title={article.title}
                        >
                          {article.image?.src ? <img loading="lazy" className="img-fluid m-auto mh-100 w-auto" src={article.image.src} alt={article.image.alt || article.title} /> : null}
                        </a>
                        <div className="content_blog clearfix card-body px-0 py-2">
                          <h3>
                  <SiteLink className="link break-word line-clamp-2" href={article.href} title={article.title}>
                    {article.title}
                  </SiteLink>
                          </h3>
                          <div className="art-info text-muted">
                            {article.date ? <span>{article.date}</span> : null}
                            {article.readingTime ? <span className="reading-time">{article.readingTime}</span> : null}
                          </div>
                          {article.summary ? <p className="justify"><span className="art-summary break-word line-clamp-2">{article.summary}</span></p> : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ArticleTemplate({ page }: { page: Article }) {
  return (
    <section className="section">
      <div className="container">
        <section className="right-content col-lg-9 col-12 mx-auto">
          <article className="article-main">
            <div className="article-details">
              {page.image?.src ? <img className="img-fluid mx-auto mb-3 d-block mh-100 w-auto" src={page.image.src} alt={page.image.alt || page.title} /> : null}
              <h1 className="article-title title_page">{page.title}</h1>
              <div className="media">
                <div className="media-body text-right">
                  {page.author ? <div className="mt-0">{page.author}</div> : null}
                  <div className="art-info text-muted font-weight-light justify-content-end">
                    {page.date ? <span>{page.date}</span> : null}
                    {page.readingTime ? <span className="reading-time">{page.readingTime}</span> : null}
                  </div>
                </div>
              </div>
              <div className="article-content js-toc-content">
                <div className="rte" dangerouslySetInnerHTML={{ __html: page.contentHtml }} />
              </div>
            </div>
          </article>
        </section>
      </div>
    </section>
  );
}

async function CartTemplate({ locale, page }: { locale: Locale; page: CartPage }) {
  const item = await getCartPreviewItem();

  return (
    <>
      <Breadcrumbs items={[{ href: "/", title: locale === "en" ? "Home" : "Trang chủ" }, { href: "", title: page.title }]} />
      <section id="cart-tab" className="main-cart-page main-container col1-layout mobile-tab active">
        <form action="/cart" method="post" className="margin-bottom-0">
          <div className="container">
            <h1 className="tsq-cart-title">{page.title}</h1>
            <div className="tsq-cart-layout">
              <div className="cart_page_mobile content-product-list tsq-cart-items">
                <div className="tsq-cart-line">
                  <button className="tsq-cart-remove" type="button" aria-label={t(locale, "admin.delete")}>
                    ×
                  </button>
                  <SiteLink href={item.href} className="tsq-cart-thumb">
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.imageAlt} /> : null}
                  </SiteLink>
                  <div className="tsq-cart-info">
                    <SiteLink href={item.href} className="tsq-cart-product-title">
                      {item.title}
                    </SiteLink>
                  </div>
                  <div className="tsq-cart-price">{item.price}</div>
                  <div className="tsq-cart-quantity" aria-label={t(locale, "site.quantity")}>
                    <button className="reduced items-count btn-minus btn" type="button" aria-label="-">
                      -
                    </button>
                    <input className="form-control input-text number-sidebar" name="Lines" type="text" value={item.quantity} readOnly />
                    <button className="increase items-count btn-plus btn" type="button" aria-label="+">
                      +
                    </button>
                  </div>
                </div>
                <label className="tsq-cart-note-label" htmlFor="cart-note">
                  {t(locale, "site.cartNote")}
                </label>
                <textarea id="cart-note" className="tsq-cart-note" name="note" />
              </div>

              <aside className="tsq-cart-summary">
                <div className="tsq-cart-summary-row">
                  <strong>{t(locale, "site.orderTotal")}</strong>
                  <span>{item.price}</span>
                </div>
                <SiteLink href="/checkout" className="btn btn-block btn-proceed-checkout-mobile">
                  {t(locale, "site.checkout")}
                </SiteLink>
              </aside>
            </div>
          </div>
        </form>
      </section>
    </>
  );
}

function SearchTemplate({ locale, page }: { locale: Locale; page: SearchPage }) {
  return (
    <section className="signup section search-main wrap_background background_white">
      <div className="container">
        <h1 className="title_page">{page.title}</h1>
        <form action="/search" method="get" className="input-group search-bar custom-input-group">
          <input type="text" name="query" className="input-group-field auto-search form-control" placeholder={page.queryPlaceholder} />
          <input type="hidden" name="type" value="product" />
          <span className="input-group-btn btn-action">
            <button type="submit" className="btn text-white icon-fallback-text h-100">{t(locale, "common.searchButton")}</button>
          </span>
        </form>
        <SearchProducts />
      </div>
    </section>
  );
}

function AccountTemplate({ locale, page }: { locale: Locale; page: AccountPage }) {
  return (
    <>
      <Breadcrumbs items={page.breadcrumbs} />
      <AccountPageContent locale={locale} page={page} />
    </>
  );
}

function UnknownTemplate({ page }: { page: UnknownPage }) {
  return (
    <section className="section">
      <div className="container">
        <h1 className="title_page">{page.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: page.contentHtml }} />
      </div>
    </section>
  );
}

async function PageContent({ locale, page }: { locale: Locale; page: StorefrontPage }) {
  switch (page.type) {
    case "home":
      return <HomeTemplate page={page} />;
    case "collection":
      return <CollectionTemplate page={page} />;
    case "product":
      return <ProductTemplate locale={locale} page={page} />;
    case "page":
      return <StaticPageTemplate page={page} />;
    case "blog":
      return <BlogTemplate page={page} />;
    case "article":
      return <ArticleTemplate page={page} />;
    case "cart":
      return <CartTemplate locale={locale} page={page} />;
    case "search":
      return <SearchTemplate locale={locale} page={page} />;
    case "account":
      return <AccountTemplate locale={locale} page={page} />;
    default:
      return <UnknownTemplate page={page} />;
  }
}

export default async function SitePage({ locale, page, settings }: { locale: Locale; page: StorefrontPage; settings: SiteSettings }) {
  return (
    <>
      <BodyClassBridge className={page.bodyClass} id={page.bodyId} />
      <SiteHeader locale={locale} settings={settings} />
      <PageContent locale={locale} page={page} />
      <SiteFooter locale={locale} settings={settings} />
    </>
  );
}
