"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface User {
  name: string;
  email: string;
  verificationStatus: string;
}

export default function HeaderAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch {
      // not logged in
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setMenuOpen(false);
    window.location.href = "/";
  }

  if (loading) {
    return <div className="w-24 h-9" />; // placeholder para não dar layout shift
  }

  // Não logado
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="text-gray-300 hover:text-white text-sm font-medium px-3 py-2 rounded-md transition"
        >
          Entrar
        </Link>
        <Link
          href="/cadastro"
          className="border border-[#d4a853] text-[#d4a853] hover:bg-[#d4a853] hover:text-black px-4 py-2 text-sm font-semibold rounded-md transition"
        >
          Cadastrar
        </Link>
      </div>
    );
  }

  // Logado
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition"
      >
        <div className="w-8 h-8 bg-[#dc2626] rounded-full flex items-center justify-center text-white text-sm font-bold">
          {user.name.charAt(0)}
        </div>
        <span className="text-white text-sm font-medium hidden sm:block max-w-[120px] truncate">
          {user.name.split(" ")[0]}
        </span>
        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Dropdown */}
      {menuOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl shadow-xl overflow-hidden z-50">
          {/* User info */}
          <div className="px-4 py-3 border-b border-[#2a2a2a]">
            <p className="text-white text-sm font-medium truncate">{user.name}</p>
            <p className="text-gray-500 text-xs truncate">{user.email}</p>
            {user.verificationStatus === "verified" && (
              <span className="inline-block mt-1 text-[10px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded">
                Verificado ✓
              </span>
            )}
          </div>

          {/* Links */}
          <div className="py-1">
            <Link
              href="/conta"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition"
            >
              👤 Minha Conta
            </Link>
            <Link
              href="/resultados"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition"
            >
              📊 Meus Resultados
            </Link>
            <Link
              href="/observando"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition"
            >
              ☆ Observando
            </Link>
            <Link
              href="/verificar"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition"
            >
              🔒 Verificação
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-[#2a2a2a] py-1">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition"
            >
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
