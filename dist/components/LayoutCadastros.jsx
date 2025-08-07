export default function LayoutCadastros({ children, titulo }) {
    return (<div className="min-h-screen bg-gray-50">
      {/* Remover header visual duplicado */}
      <main>
        <div className="container mx-auto px-4 py-6 pl-0 md:pl-[70px]">
          {children}
        </div>
      </main>
    </div>);
}
