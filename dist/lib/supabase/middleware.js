import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { hasEnvVars } from "../utils";
export async function updateSession(request) {
    let supabaseResponse = NextResponse.next({
        request,
    });
    // Se as variáveis de ambiente não estiverem configuradas, pular verificação do middleware
    if (!hasEnvVars) {
        return supabaseResponse;
    }
    try {
        const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
                },
            },
        });
        const { data: { user }, } = await supabase.auth.getUser();
        // Lista de rotas públicas que não requerem autenticação
        const publicRoutes = [
            '/',
            '/auth/login',
            '/auth/sign-up',
            '/auth/forgot-password',
            '/auth/confirm',
            '/auth/update-password'
        ];
        const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));
        // Se não for rota pública e não tiver usuário, redirecionar para login
        if (!isPublicRoute && !user) {
            console.log('[Middleware] Redirecionando para login - Rota protegida sem usuário:', request.nextUrl.pathname);
            const url = request.nextUrl.clone();
            url.pathname = "/auth/login";
            return NextResponse.redirect(url);
        }
        // Se for página de login/registro e tiver usuário, redirecionar para dashboard
        if ((request.nextUrl.pathname.startsWith('/auth/login') || request.nextUrl.pathname.startsWith('/auth/sign-up')) && user) {
            console.log('[Middleware] Redirecionando para dashboard - Usuário já autenticado');
            const url = request.nextUrl.clone();
            url.pathname = "/dashboard";
            return NextResponse.redirect(url);
        }
        return supabaseResponse;
    }
    catch (error) {
        console.error('[Middleware] Erro ao processar autenticação:', error);
        // Em caso de erro, permitir a requisição continuar para que o cliente possa lidar com o erro
        return supabaseResponse;
    }
}
