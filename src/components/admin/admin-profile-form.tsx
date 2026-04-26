"use client";

import { useEffect, useMemo, useState } from "react";

type AdminMe = {
  customer?: {
    email?: string;
    firstName?: string;
    lastName?: string;
  } | null;
  user: {
    email?: string;
    uid: string;
  };
};

type ProfileResponse = {
  customer?: {
    email?: string;
    firstName?: string;
    lastName?: string;
  } | null;
  passwordChanged: boolean;
};

type ApiEnvelope<T> = {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  success: boolean;
};

async function requestJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });
  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!payload.success) {
    throw new Error(payload.error?.message || "Yêu cầu không thành công.");
  }

  return payload.data as T;
}

function getInitials(firstName: string, lastName: string, email: string) {
  const initials = [lastName, firstName]
    .map((value) => value.trim().charAt(0))
    .filter(Boolean)
    .join("")
    .slice(0, 2);

  return (initials || email.charAt(0) || "A").toUpperCase();
}

export default function AdminProfileForm() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"error" | "success">("success");
  const [isBusy, setIsBusy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const displayName = useMemo(() => [lastName, firstName].filter(Boolean).join(" ") || email || "Admin", [email, firstName, lastName]);
  const initials = useMemo(() => getInitials(firstName, lastName, email), [email, firstName, lastName]);

  useEffect(() => {
    let ignore = false;

    requestJson<AdminMe>("/api/admin/me")
      .then((me) => {
        if (ignore) {
          return;
        }

        setEmail(me.customer?.email || me.user.email || "");
        setFirstName(me.customer?.firstName || "");
        setLastName(me.customer?.lastName || "");
      })
      .catch((error) => {
        if (!ignore) {
          setMessage(error instanceof Error ? error.message : "Không tải được thông tin tài khoản.");
          setMessageTone("error");
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (newPassword !== confirmPassword) {
      setMessage("Mật khẩu mới và xác nhận mật khẩu không khớp.");
      setMessageTone("error");
      return;
    }

    setIsBusy(true);

    try {
      const result = await requestJson<ProfileResponse>("/api/admin/profile", {
        body: JSON.stringify({
          currentPassword,
          firstName,
          lastName,
          newPassword,
        }),
        method: "PATCH",
      });
      const updatedCustomer = result.customer || {};

      setEmail(updatedCustomer.email || email);
      setFirstName(updatedCustomer.firstName || firstName);
      setLastName(updatedCustomer.lastName || lastName);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage(result.passwordChanged ? "Đã cập nhật thông tin và đổi mật khẩu." : "Đã cập nhật thông tin tài khoản.");
      setMessageTone("success");

      window.dispatchEvent(
        new CustomEvent("tsq-admin-profile-updated", {
          detail: {
            customer: {
              email: updatedCustomer.email || email,
              firstName: updatedCustomer.firstName || firstName,
              lastName: updatedCustomer.lastName || lastName,
            },
          },
        }),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không lưu được thông tin tài khoản.");
      setMessageTone("error");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="tsq-admin-page">
      <div className="tsq-admin-page-header">
        <div>
          <span className="tsq-admin-eyebrow">Tài khoản quản trị</span>
          <h1>Hồ sơ admin</h1>
          <p className="tsq-admin-muted">Cập nhật tên hiển thị và đổi mật khẩu đăng nhập quản trị.</p>
        </div>
      </div>

      {message ? <div className={`tsq-admin-alert ${messageTone}`}>{message}</div> : null}

      <section className="tsq-admin-profile-grid">
        <aside className="tsq-admin-panel tsq-admin-profile-summary">
          <span className="tsq-admin-profile-avatar">{initials}</span>
          <div>
            <h2>{displayName}</h2>
            <p>{email || "Chưa có email"}</p>
          </div>
        </aside>

        <form className="tsq-admin-panel tsq-admin-profile-form" onSubmit={submit}>
          <div className="tsq-admin-panel-header">
            <h2>Thông tin cá nhân</h2>
            <button className="tsq-admin-primary-button" disabled={isBusy || isLoading} type="submit">
              {isBusy ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>

          <div className="tsq-admin-quick-form">
            <label>
              Họ
              <input autoComplete="family-name" disabled={isLoading} maxLength={80} name="lastName" required value={lastName} onChange={(event) => setLastName(event.target.value)} />
            </label>
            <label>
              Tên
              <input autoComplete="given-name" disabled={isLoading} maxLength={80} name="firstName" required value={firstName} onChange={(event) => setFirstName(event.target.value)} />
            </label>
            <label className="tsq-admin-wide-field">
              Email
              <input disabled name="email" readOnly type="email" value={email} />
            </label>
          </div>

          <h3 className="tsq-admin-subheading">Đổi mật khẩu</h3>
          <div className="tsq-admin-quick-form">
            <label>
              Mật khẩu hiện tại
              <input autoComplete="current-password" disabled={isLoading} maxLength={128} name="currentPassword" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
            </label>
            <label>
              Mật khẩu mới
              <input autoComplete="new-password" disabled={isLoading} maxLength={128} minLength={8} name="newPassword" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            </label>
            <label className="tsq-admin-wide-field">
              Xác nhận mật khẩu mới
              <input autoComplete="new-password" disabled={isLoading} maxLength={128} minLength={8} name="confirmPassword" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            </label>
          </div>
        </form>
      </section>
    </div>
  );
}
