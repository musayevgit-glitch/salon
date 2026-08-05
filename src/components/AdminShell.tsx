"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

export function AdminShell({ children, title, links }: { children: React.ReactNode; title: string; links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.classList.add("admin-drawer-open");
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("admin-drawer-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const nav = (
    <nav aria-label={`${title} naviqasiyası`}>
      {links.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return <Link aria-current={active ? "page" : undefined} className={active ? "active" : ""} key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>;
      })}
    </nav>
  );

  return <div className="admin">
    <header className="admin-mobile-header">
      <Link href="/" className="brand">salon<span>omia</span></Link>
      <button className="admin-menu-button" type="button" aria-expanded={open} aria-controls="admin-drawer" onClick={() => setOpen(true)}>
        <Menu size={20} aria-hidden="true" />
        Menyu
      </button>
    </header>
    {open && <button className="admin-drawer-backdrop" type="button" aria-label="Menyunu bağla" onClick={() => setOpen(false)} />}
    <aside id="admin-drawer" className={`side ${open ? "open" : ""}`}>
      <div className="side-head">
        <Link href="/" className="brand">salon<span>omia</span></Link>
        <button className="admin-close-button" type="button" aria-label="Menyunu bağla" onClick={() => setOpen(false)}><X size={20} /></button>
      </div>
      <p className="side-kicker">{title}</p>
      {nav}
    </aside>
    <main className="main" tabIndex={-1}>
      <p className="tag">{title}</p>
      {children}
    </main>
  </div>;
}
