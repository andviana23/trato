import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { publicRoutes, hasPermission } from '@/lib/utils/route-permissions';
export async function middleware(request) {
    try {
        let response = NextResponse.next({
            request: {
                headers: request.headers,
            },
        });
        console.log('[Middleware] Verificando rota:', request.nextUrl.pathname);
        // Criar cliente Supabase
        const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
            cookies: {
                get(name) {
                    var _a;
                    return (_a = request.cookies.get(name)) === null || _a === void 0 ? void 0 : _a.value;
                },
                set(name, value, options) {
                    request.cookies.set(Object.assign({ name,
                        value }, options));
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set(Object.assign({ name,
                        value }, options));
                },
                remove(name, options) {
                    request.cookies.set(Object.assign({ name, value: '' }, options));
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set(Object.assign({ name, value: '' }, options));
                },
            },
        });
        // Verificar usuário autenticado
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log('[Middleware] Status do usuário:', {
            hasUser: !!user,
            error: userError === null || userError === void 0 ? void 0 : userError.message,
            path: request.nextUrl.pathname,
        });
        // Se houver erro na verificação do usuário
        if (userError) {
            console.error('[Middleware] Erro ao verificar usuário:', userError);
            // Redirecionar para login se não for rota pública
            if (!publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
                const redirectUrl = new URL('/auth/login', request.url);
                redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
                return NextResponse.redirect(redirectUrl);
            }
            return response;
        }
        // Se não estiver autenticado
        if (!user) {
            // Se tentar acessar rota que não é pública, redirecionar para login
            if (!publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
                console.log('[Middleware] Usuário não autenticado tentando acessar rota protegida');
                const redirectUrl = new URL('/auth/login', request.url);
                redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
                return NextResponse.redirect(redirectUrl);
            }
            return response;
        }
        // Se estiver autenticado
        if (user) {
            // Se tentar acessar rota de autenticação, redirecionar para dashboard
            if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
                console.log('[Middleware] Usuário autenticado tentando acessar rota de auth');
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }
            // Buscar o perfil do usuário para verificar a role
            const { data: profissionalData } = await supabase
                .from('profissionais')
                .select('funcao')
                .eq('id', user.id)
                .single();
            console.log('[Middleware] Dados do profissional:', profissionalData);
            // Se não encontrou na tabela profissionais, permitir acesso básico
            if (!profissionalData) {
                console.log('[Middleware] Profissional não encontrado, permitindo acesso básico');
                return response;
            }
            const userRole = profissionalData.funcao;
            console.log('[Middleware] Role do usuário:', userRole);
            // Verificar se o usuário tem permissão para acessar a rota
            if (!hasPermission(userRole, request.nextUrl.pathname)) {
                console.log('[Middleware] Usuário sem permissão para acessar a rota');
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }
            // --- INÍCIO: Checagem de permissão para recepcionista ---
            if (userRole === 'recepcionista' && !hasPermission(userRole, request.nextUrl.pathname)) {
                console.log('[Middleware] Recepcionista tentando acessar rota não permitida. Redirecionando para /lista-da-vez');
                return NextResponse.redirect(new URL('/lista-da-vez', request.url));
            }
            // --- FIM: Checagem de permissão para recepcionista ---
        }
        // Para outras rotas, permitir acesso
        console.log('[Middleware] Permitindo acesso a rota');
        return response;
    }
    catch (error) {
        console.error('[Middleware] Erro inesperado:', error);
        // Em caso de erro, redirecionar para login se não for rota pública
        if (!publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
            return NextResponse.redirect(new URL('/auth/login', request.url));
        }
        return NextResponse.next();
    }
}
// Configurar quais rotas o middleware deve interceptar
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
