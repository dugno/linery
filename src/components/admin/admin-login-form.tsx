"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useLanguage } from "@/components/language-provider";

type ApiEnvelope<T> = {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  success: boolean;
};

async function requestJson<T>(url: string, init: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init.headers,
    },
  });
  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!payload.success) {
    throw new Error(payload.error?.message || "Yêu cầu không thành công.");
  }

  return payload.data as T;
}

export default function AdminLoginForm() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setMessage("");

    try {
      await requestJson("/api/auth/login", {
        body: JSON.stringify({ email, password }),
        method: "POST",
      });
      await requestJson("/api/admin/me", {
        method: "GET",
      });
      router.replace("/admin");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("admin.login.failed"));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="tsq-admin-login">
      <section className="tsq-admin-login-panel">
        <div className="tsq-admin-login-brand">
          <span className="tsq-admin-brand-mark">L</span>
          <div>
            <strong>Linery</strong>
            <span>{t("admin.brand.subtitle")}</span>
          </div>
        </div>
        <form onSubmit={submit} className="tsq-admin-login-form">
          <div>
            <h1>{t("admin.login.heading")}</h1>
            <p>{t("admin.login.description")}</p>
          </div>
          <label>
            Email
            <input autoComplete="email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            {t("account.password")}
            <input autoComplete="current-password" name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {message ? <p className="tsq-admin-form-error">{message}</p> : null}
          <button type="submit" disabled={isBusy}>
            {isBusy ? t("admin.login.verifying") : t("admin.login.submit")}
          </button>
        </form>
      </section>
    </div>
  );
}
