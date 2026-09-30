"use client";

import Link from "next/link";
import { useState } from "react";

import { t, type Locale } from "@/lib/i18n";
import type { NavItem, SiteSettings } from "@/content/types";

function isInternalHref(href: string) {
  return href.startsWith("/");
}

function SiteLink({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: React.ReactNode; href: string }) {
  if (isInternalHref(href)) {
    return <Link href={href} {...props}>{children}</Link>;
  }
  return <a href={href} {...props}>{children}</a>;
}

function HeaderIcon({ type, label }: { type: "search" | "account" | "cart"; label: string }) {
  const paths = {
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
    account: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-3.5 3.2-5.5 7-5.5s6.2 2 7 5.5" /></>,
    cart: <><path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h6.8a2 2 0 0 0 1.9-1.4L19.5 8H6" /><circle cx="9" cy="19" r="1" /><circle cx="17" cy="19" r="1" /></>,
  };

  return <svg className={`tsq-header-svg-icon tsq-header-svg-icon--${type}`} viewBox="0 0 24 24" aria-label={label} role="img" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg>;
}

function NavTree({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  return (
    <ul className="navigation navigation-horizontal list-group list-group-flush scroll">
      {items.map((item) => (
        <li key={`${item.href}-${item.title}`} className="menu-item list-group-item">
          <SiteLink href={item.href} className="menu-item__link" title={item.title} onClick={onNavigate}>
            <span>{item.title}</span>
            {item.children.length ? <i className="float-right" data-toggle-submenu><svg className="icon"><use xlinkHref="#icon-arrow" /></svg></i> : null}
          </SiteLink>
          {item.children.length ? (
            <div className="submenu scroll default">
              <ul className="submenu__list container">
                {item.children.map((child) => (
                  <li key={`${child.href}-${child.title}`} className="submenu__item submenu__item--main">
                    <SiteLink className="link" href={child.href} title={child.title} onClick={onNavigate}>{child.title}</SiteLink>
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

export default function SiteHeaderClient({ locale, settings }: { locale: Locale; settings: SiteSettings }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {settings.topBanner ? <div className="top-banner position-relative" style={{ background: "#9b942f" }}><div className="container text-center px-0"><SiteLink className="position-relative d-block" href={settings.topBanner.href} style={{ color: "#ffffff" }}>{settings.topBanner.text}</SiteLink></div></div> : null}
      <header className={`ega-header ega-pos--relative ${open ? "tsq-mobile-menu-open" : ""}`}>
        <div className="header-wrap container">
          <button className="toggle-nav btn menu-bar mr-4 ml-0 p-0 d-lg-none d-flex text-white" type="button" aria-label="Mở menu" onClick={() => setOpen((v) => !v)}>
            <span className="bar" /><span className="bar" /><span className="bar" />
          </button>
          <Link id="logo" href="/" className="tsq-site-logo" aria-label={settings.siteName || "Linery Bookstore"}>
            <span className="tsq-logo-mark">L</span>
            <span className="tsq-logo-copy"><strong>{settings.siteName || "Linery"}</strong><small>Independent books</small></span>
          </Link>
          <div className={`navigation--horizontal align-items-center ${open ? "d-flex" : "d-none"} d-lg-flex`}>
            <div className="navigation-wrapper navigation-horizontal-wrapper"><nav><NavTree items={settings.menu} onNavigate={() => setOpen(false)} /></nav></div>
          </div>
          <div className="header-right ega-d--flex">
            <div className="icon-action header-right__icons" style={{ ["--header-grid-template" as never]: "repeat(3, 1fr)" }}>
              <SiteLink aria-label={t(locale, "common.search")} className="header-icon icon-action__search icon-action__search--desktop" href="/search"><HeaderIcon type="search" label={t(locale, "common.search")} /></SiteLink>
              <SiteLink id="icon-account" aria-label="Account" className="ega-color--inherit header-icon icon-account d-none d-lg-block" href="/account/login"><HeaderIcon type="account" label="Account" /></SiteLink>
              <div className="mini-cart text-xs-center"><SiteLink className="header-icon cart-count ega-color--inherit" href="/cart" title={t(locale, "site.cart")} aria-label={t(locale, "site.cart")}><HeaderIcon type="cart" label={t(locale, "site.cart")} /><span className="count_item count_item_pr">0</span></SiteLink></div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
