import { signIn } from "@/auth";

const ERRORS: Record<string, string> = {
  AccessDenied: "这个 Google 账号没有访问权限，请联系管理员加入白名单。",
  Configuration: "Google 登录尚未配置完成，请检查服务器的 OAuth 设置。",
  Verification: "登录验证已过期，请重试。",
};

function safeCallbackUrl(value: string | undefined): string {
  if (!value?.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);
  const errorMessage = params.error
    ? (ERRORS[params.error] ?? `登录失败：${params.error}`)
    : null;

  return (
    <main className="login-shell">
      <div className="ambient-grid" aria-hidden="true" />
      <section className="login-card">
        <div className="login-card__brand">
          <span>
            <span className="wordmark__glyph" aria-hidden="true">
              AI
            </span>
            <span>Signal Desk</span>
          </span>
          <span className="login-card__brand-tag">v0.1</span>
        </div>
        <p className="eyebrow">SECURE ACCESS / 安全访问</p>
        <h1>登录情报台</h1>
        <p className="login-card__intro">
          使用获准的 Google 账号继续。未加入白名单的账号无法访问情报与刷新接口。
        </p>

        {errorMessage && (
          <div className="login-card__error" role="alert">
            {errorMessage}
          </div>
        )}

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: callbackUrl });
          }}
        >
          <button type="submit" className="google-login-button">
            <GoogleMark />
            使用 Google 账号登录
            <span aria-hidden="true">→</span>
          </button>
        </form>

        <div className="login-card__meta">
          <span>Auth / Google OAuth 2.0</span>
          <span>SEC-01</span>
        </div>
        <p className="login-card__note">仅限 ALLOWED_USERS 白名单成员</p>
      </section>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
