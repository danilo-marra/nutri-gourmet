import type { ReactElement } from "react";
import AppShell from "@/components/AppShell";

export default function ProdutosPage() {
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-fg-3 text-sm">Em construção</p>
    </div>
  );
}

ProdutosPage.getLayout = (page: ReactElement) => <AppShell>{page}</AppShell>;
