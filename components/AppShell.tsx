import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { useUser } from "@/hooks/useUser";
import type { Feature, UserRole } from "@/types/index";

interface NavItem {
  label: string;
  href: string;
  feature?: Feature;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/app" },
  { label: "Vendas", href: "/app/vendas" },
  { label: "Créditos", href: "/app/creditos" },
  { label: "Fechamento", href: "/app/fechamento" },
  {
    label: "Relatórios",
    href: "/app/relatorios",
    feature: "read:report:financial",
  },
  { label: "Alunos", href: "/app/alunos" },
  { label: "Produtos", href: "/app/produtos" },
  { label: "Usuários", href: "/app/usuarios", feature: "create:user" },
];

const PAGE_TITLES: Record<string, string> = {
  "/app": "Dashboard",
  "/app/vendas": "Vendas",
  "/app/creditos": "Créditos",
  "/app/fechamento": "Fechamento de Caixa",
  "/app/relatorios": "Relatórios",
  "/app/alunos": "Alunos",
  "/app/produtos": "Produtos",
  "/app/usuarios": "Usuários",
};

interface RoleConfig {
  label: string;
  badge: string;
}

const ROLE_CONFIG: Partial<Record<UserRole, RoleConfig>> = {
  operador: {
    label: "Operador",
    badge: "bg-brand-teal-subtle text-brand-teal",
  },
  supervisor: {
    label: "Supervisor",
    badge: "bg-brand-orange-subtle text-brand-orange",
  },
  admin: {
    label: "Admin",
    badge: "bg-danger-subtle text-danger",
  },
};

export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useUser();

  async function handleLogout() {
    await fetch("/api/v1/sessions", { method: "DELETE" });
    router.push("/login");
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-bg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const features = user.features ?? [];
  const visibleNav = NAV_ITEMS.filter(
    (item) => !item.feature || features.includes(item.feature),
  );
  const role = ROLE_CONFIG[user.role] ?? {
    label: user.role,
    badge: "bg-gray-bg text-fg-2",
  };
  const pageTitle = PAGE_TITLES[router.pathname] ?? "Sistema";

  return (
    <div
      className="flex min-h-screen bg-gray-bg"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Sidebar */}
      <aside className="w-52 min-h-screen bg-bg-card border-r border-border flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-border">
          <div className="rounded-lg overflow-hidden flex items-center justify-center">
            <Image src="/logo.png" alt="Nutrigourmet" width={120} height={68} />
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {visibleNav.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-green-subtle text-brand-green"
                    : "text-fg-2 hover:bg-gray-bg hover:text-fg-1"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="px-2 pb-3 pt-3 border-t border-border space-y-1">
          <div className="px-3 py-2 rounded-md bg-gray-bg">
            <p className="text-xs font-semibold text-fg-1 truncate">
              {user.username}
            </p>
            <span
              className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${role.badge}`}
            >
              {role.label}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-md text-sm text-danger hover:bg-danger-subtle transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 bg-bg-card border-b border-border flex items-center px-6 flex-shrink-0">
          <h1
            className="flex-1 text-lg font-semibold text-fg-1"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            {pageTitle}
          </h1>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${role.badge}`}
          >
            {role.label}
          </span>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
