"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
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
  return <p className="auth-ref-error" role="alert">Bu salon hazırda deaktiv edilib. Admin panelinə giriş bloklanıb — sualınız varsa platforma dəstəyi ilə əlaqə saxlayın.</p>;
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

  return <AuthShell title="Xoş gəldiniz!" subtitle="Sevdiyiniz salon və ustaları seçin, rezervasiyanızı asanlıqla edin." variant="login">
    <form action={submit} className="auth-ref-form">
      <GoogleButton label="Google ilə davam et" onClick={() => setError("Google OAuth hazırda aktiv deyil. E-poçt və şifrə ilə daxil olun.")} />
      <Divider />
      <AuthInput icon="mail" id="login-email" name="email" label="E-poçt" placeholder="Email ünvanınız" type="email" autoComplete="email" />
      <AuthInput icon="lock" id="login-password" name="password" label="Şifrə" type={showPassword ? "text" : "password"} autoComplete="current-password" trailing={<PasswordToggle shown={showPassword} setShown={setShowPassword} />} />
      <Link className="auth-forgot" href="/forgot-password">Şifrəni unutmusunuz?</Link>
      <BlockedSalonNotice />
      {error && <p className="auth-ref-error" role="alert">{error}</p>}
      <button className="auth-ref-primary" disabled={pending} type="submit">{pending ? "Giriş edilir…" : "Daxil ol"}</button>
      <p className="auth-bottom-copy">Hesabınız yoxdur? <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"}>Qeydiyyatdan keçin</Link></p>
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

  return <AuthShell title="Hesab yaradın" subtitle="Rezervasiya etmək üçün hesab yaratmağınız tələb olunur." variant="register">
    <form action={submit} className="auth-ref-form">
      <GoogleButton label="Google ilə qeydiyyatdan keçin" onClick={() => setError("Google OAuth hazırda aktiv deyil. E-poçt və şifrə ilə qeydiyyatdan keçin.")} />
      <Divider />
      <AuthInput icon="user" id="register-name" name="firstName" label="Ad" autoComplete="given-name" />
      <AuthInput icon="user" id="register-surname" name="lastName" label="Soyad" autoComplete="family-name" />
      <AuthInput icon="mail" id="register-email" name="email" label="Email ünvanı" type="email" autoComplete="email" />
      <AuthInput icon="lock" id="register-password" name="password" label="Şifrə" type={showPassword ? "text" : "password"} autoComplete="new-password" trailing={<PasswordToggle shown={showPassword} setShown={setShowPassword} />} />
      <AuthInput icon="lock" id="register-repeat" name="repeatPassword" label="Şifrəni təkrar edin" type={showRepeat ? "text" : "password"} autoComplete="new-password" trailing={<PasswordToggle shown={showRepeat} setShown={setShowRepeat} />} />
      <label className="auth-ref-check"><input required type="checkbox" defaultChecked /> <span>Mən <a href="#">istifadəçi razılaşması</a> və <a href="#">məxfilik siyasəti</a> ilə razıyam.</span></label>
      {error && <p className="auth-ref-error" role="alert">{error}</p>}
      <button className="auth-ref-primary" disabled={pending} type="submit">{pending ? "Yaradılır…" : "Qeydiyyatdan keç"}</button>
      <p className="auth-bottom-copy">Artıq hesabınız var? <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}>Daxil olun</Link></p>
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

  return <AuthShell title="Şifrəni unutmusunuz?" subtitle="Qeydiyyatdan keçdiyiniz email ünvanını daxil edin. Sizə şifrəni yeniləmək üçün link göndərəcəyik." variant="forgot">
    <form action={submit} className="auth-ref-form forgot">
      <div className="auth-envelope" aria-hidden="true"><span>✦</span><div><LockKeyhole size={28} /></div><span>✦</span></div>
      <AuthInput icon="mail" id="forgot-email" name="email" label="Email ünvanınız" type="email" autoComplete="email" />
      {error && <p className="auth-ref-error" role="alert">{error}</p>}
      {message && <p className="auth-ref-success" role="status">{message}</p>}
      <button className="auth-ref-primary" disabled={pending} type="submit">{pending ? "Göndərilir…" : "Linki göndər"}</button>
      <Link className="auth-ref-secondary" href="/login">Daxil ol səhifəsinə qayıt</Link>
    </form>
  </AuthShell>;
}

function AuthShell({ title, subtitle, children, variant }: { title: string; subtitle: string; children: React.ReactNode; variant: AuthMode }) {
  return <main className={`auth-ref-page ${variant}`}>
    <section className="auth-ref-phone">
      <Link className="auth-ref-back" href="/" aria-label="Geri">←</Link>
      {variant === "login" ? <div className="auth-brand-block"><h1>SALONOMIA</h1><i>✦</i><p>GÖZƏLLİYİNİZƏ ZAMAN AYIRIN</p></div> : <i className="auth-sparkle">✦</i>}
      <div className="auth-ref-copy"><h2>{title}</h2><p>{subtitle}</p></div>
      {children}
    </section>
  </main>;
}

function AuthInput({ icon, id, name, label, placeholder, type = "text", autoComplete, trailing }: { icon: "mail" | "lock" | "user"; id: string; name: string; label: string; placeholder?: string; type?: string; autoComplete?: string; trailing?: React.ReactNode }) {
  const Icon = icon === "mail" ? Mail : icon === "lock" ? LockKeyhole : UserRound;
  return <label className="auth-ref-input" htmlFor={id}>
    <Icon size={21} aria-hidden="true" />
    <span className="sr-only">{label}</span>
    <input id={id} name={name} type={type} required aria-label={label} placeholder={placeholder ?? label} autoComplete={autoComplete} />
    {trailing}
  </label>;
}

function PasswordToggle({ shown, setShown }: { shown: boolean; setShown: (value: boolean) => void }) {
  return <button type="button" aria-label={shown ? "Parolu gizlət" : "Parolu göstər"} onClick={() => setShown(!shown)}>{shown ? <EyeOff size={19} /> : <Eye size={19} />}</button>;
}

function GoogleButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button className="auth-google" type="button" onClick={onClick}><span>G</span>{label}</button>;
}

function Divider() {
  return <div className="auth-divider"><span /> və ya <span /></div>;
}
