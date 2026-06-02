import AppShell from "@/components/AppShell";

export default function AlunosPage() {
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-fg-3 text-sm">Em construção</p>
    </div>
  );
}

AlunosPage.getLayout = (page) => <AppShell>{page}</AppShell>;
