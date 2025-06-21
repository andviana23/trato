import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/react";

export default function LayoutCadastros({ children, titulo }: { children: React.ReactNode, titulo: string }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Breadcrumbs>
              <BreadcrumbItem>Dashboard</BreadcrumbItem>
              <BreadcrumbItem>Cadastros</BreadcrumbItem>
              <BreadcrumbItem>{titulo}</BreadcrumbItem>
            </Breadcrumbs>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">{titulo}</h1>
          </div>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
} 
