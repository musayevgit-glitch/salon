"use client";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function PublicHeader() {
  const [open, setOpen] = useState(false); const button = useRef<HTMLButtonElement>(null);
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); }; addEventListener("keydown", close); return () => removeEventListener("keydown", close); }, []);
  const close = () => { setOpen(false); button.current?.focus(); };
  return <header className="public-header"><div className="shell header"><Link href="/" className="brand">salon<span>omia</span></Link><nav className="nav desktop-nav" aria-label="Əsas naviqasiya"><Link href="/salons">Salonlar</Link><Link href="/#nece-isleyir">Necə işləyir</Link><Link className="button" href="/login">Daxil ol</Link></nav><button ref={button} className="icon-button mobile-menu" aria-label="Menyunu aç" aria-expanded={open} onClick={() => setOpen(true)}><Menu/></button></div>{open && <div className="mobile-drawer" role="dialog" aria-modal="true" aria-label="Mobil menyu"><div className="drawer-backdrop" onClick={close}/><div className="drawer-panel"><div className="row"><span className="brand">salon<span>omia</span></span><button className="icon-button" aria-label="Menyunu bağla" onClick={close}><X/></button></div><nav><Link href="/salons" onClick={close}>Salonlar</Link><Link href="/#nece-isleyir" onClick={close}>Necə işləyir</Link><Link href="/login" className="button" onClick={close}>Daxil ol</Link></nav></div></div>}</header>;
}
