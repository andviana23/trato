"use client";
import { usePathname } from "next/navigation";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
export default function MainContainer({ children, isCollapsed }) {
    const pathname = usePathname();
    // Função para gerar breadcrumbs baseado na rota
    const generateBreadcrumbs = () => {
        const paths = pathname.split('/').filter(Boolean);
        const breadcrumbs = [
            { name: 'Home', href: '/dashboard', icon: HomeIcon }
        ];
        let currentPath = '';
        paths.forEach((path) => {
            if (path === 'dashboard')
                return;
            currentPath += `/${path}`;
            const name = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
            breadcrumbs.push({
                name,
                href: currentPath,
                icon: null
            });
        });
        return breadcrumbs;
    };
    const breadcrumbs = generateBreadcrumbs();
    return (<div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Breadcrumbs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-2">
        <nav className="flex items-center space-x-2 text-xs opacity-80">
          {breadcrumbs.map((breadcrumb, index) => (<div key={breadcrumb.href} className="flex items-center">
              {index > 0 && (<ChevronRightIcon className="w-4 h-4 text-gray-300 mx-2"/>)}
              <Link href={breadcrumb.href} className={`
                  flex items-center space-x-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors
                  ${index === breadcrumbs.length - 1
                ? 'text-gray-900 dark:text-white font-semibold'
                : 'text-gray-500 dark:text-gray-400'}
                `}>
                {breadcrumb.icon && (<breadcrumb.icon className="w-4 h-4"/>)}
                <span>{breadcrumb.name}</span>
              </Link>
            </div>))}
        </nav>
      </div>

      {/* Conteúdo principal com scroll e layout clean */}
      <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>);
}
