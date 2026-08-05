"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, ChevronLeft, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

type AuthMode = "login" | "register" | "forgot";

/** Where to send the customer after a successful login/register. If they were redirected here
 * mid-reservation (see BookingForm's auth gate) `next` points back at that exact page/step;
 * otherwise fall back to role-based routing on /post-login. Only same-origin relative paths
 * are honored to avoid an open-redirect via the query string. */
function useSafeNext() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

function BlockedSalonNotice() {
  const searchParams = useSearchParams();
  if (searchParams.get("blocked") !== "salon_inactive") return null;
  return <p className="auth-notice warning" role="alert"><AlertTriangle size={17} aria-hidden="true" /><span>Bu salon hazırda deaktiv edilib. Admin panelinə giriş bloklanıb — sualınız varsa platforma dəstəyi ilə əlaqə saxlayın.</span></p>;
}

export function LoginForm({ mode = "login" }: { mode?: AuthMode }) {
  if (mode === "register") return <RegisterForm />;
  if (mode === "forgot") return <ForgotPasswordForm />;
  return <SignInForm />;
}

function SignInForm() {
  const router = useRouter();
  const next = useSafeNext();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(data: FormData) {
    setPending(true);
    setError("");
    const { error: result } = await authClient.signIn.email({ email: String(data.get("email")), password: String(data.get("password")) });
    setPending(false);
    if (result) {
      setError("E-poçt və ya şifrə yanlışdır.");
      return;
    }
    router.refresh();
    router.push(next ?? "/post-login");
  }

  return <AuthShell
    variant="login"
    next={next}
    eyebrow="Xoş gəlmisiniz"
    title="Hesabınıza daxil olun"
    subtitle="Sevdiyiniz salon və ustaları seçin, rezervasiyanızı asanlıqla edin."
  >
    <form action={submit} className="auth-form">
      <GoogleButton label="Google ilə davam et" onClick={() => setError("Google OAuth hazırda aktiv deyil. E-poçt və şifrə ilə daxil olun.")} />
      <Divider />
      <AuthInput icon="mail" id="login-email" name="email" label="E-poçt" placeholder="Email ünvanınız" type="email" autoComplete="email" />
      <AuthInput icon="lock" id="login-password" name="password" label="Şifrə" type={showPassword ? "text" : "password"} autoComplete="current-password" trailing={<PasswordToggle shown={showPassword} setShown={setShowPassword} />} />
      <div className="auth-inline-links"><Link href="/forgot-password">Şifrəni unutmusunuz?</Link></div>
      <BlockedSalonNotice />
      {error && <p className="auth-notice error" role="alert"><AlertTriangle size={17} aria-hidden="true" /><span>{error}</span></p>}
      <button className="auth-submit" disabled={pending} type="submit">{pending ? "Giriş edilir…" : "Daxil ol"}</button>
      <p className="auth-bottom">Hesabınız yoxdur? <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"}>Qeydiyyatdan keçin</Link></p>
    </form>
  </AuthShell>;
}

function RegisterForm() {
  const router = useRouter();
  const next = useSafeNext();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);

  async function submit(data: FormData) {
    setError("");
    const password = String(data.get("password"));
    const repeat = String(data.get("repeatPassword"));
    if (password !== repeat) {
      setError("Şifrələr eyni deyil.");
      return;
    }
    setPending(true);
    const firstName = String(data.get("firstName"));
    const lastName = String(data.get("lastName"));
    const { error: result } = await authClient.signUp.email({ name: `${firstName} ${lastName}`.trim(), email: String(data.get("email")), password });
    setPending(false);
    if (result) {
      setError(result.message || "Qeydiyyat alınmadı. Məlumatları yoxlayın.");
      return;
    }
    router.refresh();
    router.push(next ?? "/post-login");
  }

  return <AuthShell
    variant="register"
    next={next}
    eyebrow="Yeni müştəri"
    title="Hesab yaradın"
    subtitle="Rezervasiya etmək üçün hesab yaratmağınız tələb olunur."
  >
    <form action={submit} className="auth-form">
      <GoogleButton label="Google ilə qeydiyyatdan keçin" onClick={() => setError("Google OAuth hazırda aktiv deyil. E-poçt və şifrə ilə qeydiyyatdan keçin.")} />
      <Divider />
      <div className="auth-form-row two-col">
        <AuthInput icon="user" id="register-name" name="firstName" label="Ad" autoComplete="given-name" />
        <AuthInput icon="user" id="register-surname" name="lastName" label="Soyad" autoComplete="family-name" />
      </div>
      <AuthInput icon="mail" id="register-email" name="email" label="Email ünvanı" type="email" autoComplete="email" />
      <AuthInput icon="lock" id="register-password" name="password" label="Şifrə" type={showPassword ? "text" : "password"} autoComplete="new-password" trailing={<PasswordToggle shown={showPassword} setShown={setShowPassword} />} />
      <AuthInput icon="lock" id="register-repeat" name="repeatPassword" label="Şifrəni təkrar edin" type={showRepeat ? "text" : "password"} autoComplete="new-password" trailing={<PasswordToggle shown={showRepeat} setShown={setShowRepeat} />} />
      <label className="auth-check"><input required type="checkbox" defaultChecked /> <span>Mən <a href="#">istifadəçi razılaşması</a> və <a href="#">məxfilik siyasəti</a> ilə razıyam.</span></label>
      {error && <p className="auth-notice error" role="alert"><AlertTriangle size={17} aria-hidden="true" /><span>{error}</span></p>}
      <button className="auth-submit" disabled={pending} type="submit">{pending ? "Yaradılır…" : "Qeydiyyatdan keç"}</button>
      <p className="auth-bottom">Artıq hesabınız var? <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}>Daxil olun</Link></p>
    </form>
  </AuthShell>;
}

function ForgotPasswordForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(data: FormData) {
    setMessage("");
    setError("");
    setPending(true);
    const response = await fetch("/api/auth/request-password-reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: String(data.get("email")), redirectTo: `${window.location.origin}/login` }),
    });
    setPending(false);
    if (!response.ok) {
      setError("Şifrə yeniləmə email xidməti hələ aktiv deyil. Admin email provider qoşmalıdır.");
      return;
    }
    setMessage("Əgər bu email sistemdə varsa, şifrə yeniləmə linki göndəriləcək.");
  }

  return <AuthShell
    variant="forgot"
    next={null}
    eyebrow="Hesab bərpası"
    title="Şifrəni unutmusunuz?"
    subtitle="Qeydiyyatdan keçdiyiniz email ünvanını daxil edin. Sizə şifrəni yeniləmək üçün link göndərəcəyik."
  >
    <form action={submit} className="auth-form">
      <div className="auth-icon-badge" aria-hidden="true"><LockKeyhole size={26} /></div>
      <AuthInput icon="mail" id="forgot-email" name="email" label="Email ünvanınız" type="email" autoComplete="email" />
      {error && <p className="auth-notice error" role="alert"><AlertTriangle size={17} aria-hidden="true" /><span>{error}</span></p>}
      {message && <p className="auth-notice success" role="status"><CheckCircle2 size={17} aria-hidden="true" /><span>{message}</span></p>}
      <button className="auth-submit" disabled={pending} type="submit">{pending ? "Göndərilir…" : "Linki göndər"}</button>
      <Link className="auth-secondary-link" href="/login">Daxil ol səhifəsinə qayıt</Link>
    </form>
  </AuthShell>;
}

function ModeSwitcher({ variant, next }: { variant: AuthMode; next: string | null }) {
  const suffix = next ? `?next=${encodeURIComponent(next)}` : "";
  return <nav className="auth-tabs" aria-label="Giriş rejimi">
    <Link href={`/login${suffix}`} className={variant === "login" ? "active" : ""} aria-current={variant === "login" ? "page" : undefined}>Daxil ol</Link>
    <Link href={`/register${suffix}`} className={variant === "register" ? "active" : ""} aria-current={variant === "register" ? "page" : undefined}>Qeydiyyat</Link>
  </nav>;
}

function AuthShell({ eyebrow, title, subtitle, children, variant, next }: { eyebrow: string; title: string; subtitle: string; children: React.ReactNode; variant: AuthMode; next: string | null }) {
  return <main className={`auth-shell ${variant}`}>
    <section className="auth-visual" aria-hidden="true">
      <div className="auth-visual-top">
        <Link className="auth-visual-back" href="/" aria-label="Ana səhifəyə qayıt"><ChevronLeft size={18} /> Ana səhifə</Link>
      </div>
      <p className="auth-wordmark"><b>Salonomia</b><span>Gözəlliyinizə zaman ayırın</span></p>
      <blockquote className="auth-visual-quote">Rezervasiyadan ödənişə qədər hər addımı sadələşdirən, salonlar üçün premium idarəetmə təcrübəsi.</blockquote>
    </section>

    <section className="auth-panel">
      <div className="auth-panel-inner">
        {variant !== "forgot" && <ModeSwitcher variant={variant} next={next} />}
        <div className="auth-copy">
          <p className="eyebrow-divider"><span>{eyebrow}</span></p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {children}
      </div>
    </section>
  </main>;
}

function AuthInput({ icon, id, name, label, placeholder, type = "text", autoComplete, trailing }: { icon: "mail" | "lock" | "user"; id: string; name: string; label: string; placeholder?: string; type?: string; autoComplete?: string; trailing?: React.ReactNode }) {
  const Icon = icon === "mail" ? Mail : icon === "lock" ? LockKeyhole : UserRound;
  return <label className="auth-field" htmlFor={id}>
    <span>{label}</span>
    <span className="auth-field-control">
      <Icon size={19} aria-hidden="true" />
      <input id={id} name={name} type={type} required aria-label={label} placeholder={placeholder ?? label} autoComplete={autoComplete} />
      {trailing}
    </span>
  </label>;
}

function PasswordToggle({ shown, setShown }: { shown: boolean; setShown: (value: boolean) => void }) {
  return <button type="button" aria-label={shown ? "Parolu gizlət" : "Parolu göstər"} onClick={() => setShown(!shown)}>{shown ? <EyeOff size={18} /> : <Eye size={18} />}</button>;
}

function GoogleButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button className="auth-google" type="button" onClick={onClick}><span>G</span>{label}</button>;
}

function Divider() {
  return <div className="auth-divider"><span /> və ya <span /></div>;
}
