import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Rotas públicas que não requerem autenticação
const publicRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/update-password',
  '/auth/verify',
];

// Rotas que requerem autenticação
const protectedRoutes = [
  '/dashboard',
  '/assinaturas',
  '/clientes',
  '/agenda',
  '/configuracoes',
  '/perfil',
];

export async function middleware(request: NextRequest) {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    console.log('[Middleware] Verificando rota:', request.nextUrl.pathname);

    // Criar cliente Supabase
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: any) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    // Verificar sessão
    const { data: { session }, error } = await supabase.auth.getSession();

    console.log('[Middleware] Status da sessão:', {
      hasSession: !!session,
      error: error?.message,
      path: request.nextUrl.pathname,
    });

    // Se houver erro na verificação da sessão
    if (error) {
      console.error('[Middleware] Erro ao verificar sessão:', error);
      // Redirecionar para login se tentar acessar rota protegida
      if (protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
        const redirectUrl = new URL('/auth/login', request.url);
        redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }
      return response;
    }

    // Se não estiver autenticado
    if (!session) {
      // Se tentar acessar rota protegida, redirecionar para login
      if (protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
        console.log('[Middleware] Usuário não autenticado tentando acessar rota protegida');
        const redirectUrl = new URL('/auth/login', request.url);
        redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }
      // Se tentar acessar rota pública, permitir
      if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
        console.log('[Middleware] Permitindo acesso a rota pública');
        return response;
      }
    }

    // Se estiver autenticado
    if (session) {
      // Se tentar acessar rota de autenticação, redirecionar para dashboard
      if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
        console.log('[Middleware] Usuário autenticado tentando acessar rota de auth');
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      // Se tentar acessar rota protegida, permitir
      if (protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
        console.log('[Middleware] Permitindo acesso a rota protegida');
        return response;
      }
    }

    // Para outras rotas, permitir acesso
    console.log('[Middleware] Permitindo acesso a rota não protegida');
    return response;
  } catch (error) {
    console.error('[Middleware] Erro inesperado:', error);
    // Em caso de erro, redirecionar para login se tentar acessar rota protegida
    if (protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
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
