import Link from "next/link";

import type { AccountPage } from "@/content/types";
import { t, type Locale } from "@/lib/i18n";

const FACEBOOK_LOGIN_URL = "https://www.facebook.com/v3.2/dialog/oauth";
const GOOGLE_LOGIN_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const SOCIAL_REDIRECT_ORIGIN = "https://store.mysapo.net";

function buildQuery(params: Record<string, string>) {
  return new URLSearchParams(params).toString();
}

function getRedirectState(redirectUrl: string) {
  return JSON.stringify({
    redirect_url: redirectUrl,
  });
}

function getFacebookLoginUrl(redirectUrl: string) {
  return `${FACEBOOK_LOGIN_URL}?${buildQuery({
    client_id: "947410958642584",
    redirect_uri: `${SOCIAL_REDIRECT_ORIGIN}/account/facebook_account_callback`,
    response_type: "code",
    scope: "email",
    state: getRedirectState(redirectUrl),
  })}`;
}

function getGoogleLoginUrl(redirectUrl: string) {
  return `${GOOGLE_LOGIN_URL}?${buildQuery({
    access_type: "online",
    client_id: "997675985899-pu3vhvc2rngfcuqgh5ddgt7mpibgrasr.apps.googleusercontent.com",
    redirect_uri: `${SOCIAL_REDIRECT_ORIGIN}/account/google_account_callback`,
    response_type: "code",
    scope: "email profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
    state: getRedirectState(redirectUrl),
  })}`;
}

function SocialLoginButtons({ locale, page, withTopMarginClass = false }: { locale: Locale; page: AccountPage; withTopMarginClass?: boolean }) {
  const redirectUrl = `https://tiemsachquyt.com${page.href}`;

  return (
    <div className={`block social-login--facebooks ${withTopMarginClass ? "margin-top-20 " : ""}text-center`}>
      <p className="a-center text-secondary">{t(locale, "account.loginWith")}</p>
      <a href={getFacebookLoginUrl(redirectUrl)} className="social-login--facebook" rel="nofollow">
        Facebook
      </a>
      {" "}
      <a href={getGoogleLoginUrl(redirectUrl)} className="social-login--google" rel="nofollow">
        Google
      </a>
    </div>
  );
}

function LoginForm({ locale }: { locale: Locale }) {
  return (
    <div className="page-login">
      <input type="checkbox" id="recover-toggle" className="account-recover-toggle" aria-hidden="true" hidden />
      <div id="login" className="account-login-panel">
        <form method="post" action="/account/login" id="customer_login" acceptCharset="UTF-8">
          <input name="FormType" type="hidden" value="customer_login" />
          <input name="utf8" type="hidden" value="true" />
          <div className="form-signup margin-bottom-15" style={{ color: "red" }} />
          <div className="form-signup clearfix">
            <fieldset className="form-group">
              <label htmlFor="customer_email">
                Email <span className="required">*</span>
              </label>
              <input
                type="email"
                pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,63}$"
                className="form-control"
                name="email"
                id="customer_email"
                placeholder="Email"
                required
              />
            </fieldset>
            <fieldset className="form-group">
              <label htmlFor="customer_password">
                {t(locale, "account.password")} <span className="required">*</span>
              </label>
              <input type="password" className="form-control" name="password" id="customer_password" placeholder={t(locale, "account.password")} required />
              <small className="d-block my-2">
                {t(locale, "account.forgotPassword")}{" "}
                <label htmlFor="recover-toggle" className="btn-link-style text-primary account-recover-link">
                  {t(locale, "account.there")}
                </label>
              </small>
            </fieldset>

            <div className="pull-xs-left button_bottom a-center mb-3">
              <button className="btn btn-block btn-style btn-login" type="submit" value={t(locale, "account.login")}>
                {t(locale, "account.login")}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div id="recover-password" className="form-signup page-login text-center account-recover-panel">
        <h2>{t(locale, "account.resetPassword")}</h2>
        <p>{t(locale, "account.recoverIntro")}</p>
        <form method="post" action="/account/recover" id="recover_customer_password" acceptCharset="UTF-8">
          <input name="FormType" type="hidden" value="recover_customer_password" />
          <input name="utf8" type="hidden" value="true" />
          <div className="form-signup" style={{ color: "red" }} />
          <div className="form-signup clearfix">
            <fieldset className="form-group">
              <input
                type="email"
                pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,63}$"
                className="form-control form-control-lg"
                name="Email"
                id="recover-email"
                placeholder="Email"
                required
              />
            </fieldset>
          </div>

          <div className="action_bottom my-3">
            <button className="btn btn-style btn-recover btn-block" type="submit">
              {t(locale, "account.recoverPassword")}
            </button>
            <label htmlFor="recover-toggle" className="btn btn-style link btn-style-active">
              {t(locale, "account.back")}
            </label>
          </div>
        </form>
      </div>
    </div>
  );
}

function RegisterForm({ locale, socialLogin }: { locale: Locale; socialLogin: React.ReactNode }) {
  return (
    <div className="page-login py-3">
      <div id="login">
        <h2 className="text-center">{t(locale, "account.personalInfo")}</h2>
        <form method="post" action="/account/register" id="customer_register" acceptCharset="UTF-8">
          <input name="FormType" type="hidden" value="customer_register" />
          <input name="utf8" type="hidden" value="true" />
          <div className="form-signup" style={{ color: "red" }} />
          <div className="form-signup clearfix">
            <div className="row">
              <div className="col-md-12 col-lg-12 col-sm-12 col-xs-12">
                <fieldset className="form-group">
                  <label htmlFor="lastName">
                    {t(locale, "account.lastName")} <span className="required">*</span>
                  </label>
                  <input type="text" className="form-control form-control-lg" name="lastName" id="lastName" placeholder={t(locale, "account.lastName")} required />
                </fieldset>
              </div>
              <div className="col-md-12">
                <fieldset className="form-group">
                  <label htmlFor="firstName">
                    {t(locale, "account.firstName")} <span className="required">*</span>
                  </label>
                  <input type="text" className="form-control form-control-lg" name="firstName" id="firstName" placeholder={t(locale, "account.firstName")} required />
                </fieldset>
              </div>
              <div className="col-md-12 col-lg-12 col-sm-12 col-xs-12">
                <fieldset className="form-group">
                  <label htmlFor="Phone">
                    {t(locale, "account.phone")} <span className="required">*</span>
                  </label>
                  <input placeholder={t(locale, "account.phone")} type="text" pattern="\d+" id="Phone" className="form-control form-control-comment form-control-lg" name="Phone" required />
                </fieldset>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12 col-lg-12 col-sm-12 col-xs-12">
                <fieldset className="form-group">
                  <label htmlFor="email">
                    Email <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,63}$"
                    className="form-control form-control-lg"
                    name="email"
                    id="email"
                    placeholder="Email"
                    required
                  />
                </fieldset>
              </div>
              <div className="col-md-12 col-lg-12 col-sm-12 col-xs-12">
                <fieldset className="form-group">
                  <label htmlFor="password">
                    {t(locale, "account.password")} <span className="required">*</span>
                  </label>
                  <input type="password" className="form-control form-control-lg" name="password" id="password" placeholder={t(locale, "account.password")} required />
                </fieldset>
              </div>
            </div>

            <div className="section margin-top-10 button_bottom mt-3">
              <button type="submit" value={t(locale, "account.register")} className="btn btn-style btn_register btn-block">
                {t(locale, "account.register")}
              </button>
            </div>
          </div>
        </form>
        {socialLogin}
      </div>
    </div>
  );
}

export default function AccountPageContent({ locale, page }: { locale: Locale; page: AccountPage }) {
  const isLogin = page.mode === "login";

  return (
    <section className="section">
      <div className={`container margin-bottom-20 card ${isLogin ? "py-20" : "py-2"}`}>
        <div className="wrap_background_aside margin-bottom-40 page_login">
          <div className="heading-bar text-center">
            <h1 className="title_page mb-0">{page.title}</h1>
            {isLogin ? (
              <p className="mb-0">
                {t(locale, "account.noAccount")}
                <Link href="/account/register" className="btn-link-style btn-register" style={{ textDecoration: "underline" }}>
                  {" "}
                  {t(locale, "account.registerHere")}
                </Link>
              </p>
            ) : (
              <span className="or">
                {t(locale, "account.alreadyHaveAccount")}{" "}
                <Link href="/account/login" style={{ textDecoration: "underline" }} className="btn-link-style btn-style margin-right-0">
                  {t(locale, "account.there")}
                </Link>
              </span>
            )}
          </div>

          <div className="row">
            <div className="col-12 col-md-6 col-lg-5 offset-md-3 py-3 mx-auto">
              {isLogin ? (
                <>
                  <LoginForm locale={locale} />
                  <SocialLoginButtons locale={locale} page={page} withTopMarginClass />
                </>
              ) : (
                <RegisterForm locale={locale} socialLogin={<SocialLoginButtons locale={locale} page={page} />} />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
