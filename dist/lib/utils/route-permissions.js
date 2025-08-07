// Lista de rotas públicas que não requerem autenticação
export const publicRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/update-password',
    '/auth/verify',
];
// Lista de rotas protegidas com suas permissões
export const protectedRoutes = [
    // Rotas acessíveis por todos os usuários autenticados
    { path: '/dashboard', roles: ['admin', 'recepcionista', 'barbershop_owner', 'professional', 'client', undefined] },
    // Rotas de clientes
    { path: '/clientes', roles: ['admin', 'recepcionista', 'barbershop_owner', 'professional'] },
    // Rotas de assinaturas
    { path: '/assinaturas', roles: ['admin', 'recepcionista', 'barbershop_owner'] },
    { path: '/assinaturas/dashboard', roles: ['admin', 'recepcionista', 'barbershop_owner'] },
    { path: '/assinaturas/planos', roles: ['admin', 'recepcionista', 'barbershop_owner'] },
    { path: '/assinaturas/assinantes', roles: ['admin', 'recepcionista', 'barbershop_owner'] },
    // Rotas de agenda
    { path: '/agenda', roles: ['admin', 'recepcionista', 'barbershop_owner', 'professional'] },
    // Rotas de configurações
    { path: '/configuracoes', roles: ['admin', 'barbershop_owner'] },
    // Rotas de perfil
    { path: '/perfil', roles: ['admin', 'recepcionista', 'barbershop_owner', 'professional', 'client', undefined] },
];
// --- INÍCIO: Regra especial para recepcionista ---
// O perfil 'recepcionista' só pode acessar as rotas abaixo:
const recepcionistaAllowed = [
    '/assinaturas/assinantes',
    '/assinaturas/planos',
    '/lista-da-vez',
];
// Função para verificar se um usuário tem permissão para acessar uma rota
export function hasPermission(userRole, path) {
    // Se a rota for pública, permite o acesso
    if (publicRoutes.some(route => path.startsWith(route))) {
        return true;
    }
    // Regra especial para recepcionista
    if (userRole === 'recepcionista') {
        return recepcionistaAllowed.some(route => path.startsWith(route));
    }
    // Se não tiver role definida, só permitir acesso às rotas básicas
    if (!userRole) {
        return path === '/dashboard' || path === '/perfil';
    }
    // Encontra a rota protegida que corresponde ao caminho
    const route = protectedRoutes.find(route => path.startsWith(route.path));
    // Se não encontrou a rota nas protegidas, permitir acesso (pode ser uma rota pública não listada)
    if (!route) {
        return true;
    }
    // Verificar se o papel do usuário está na lista de papéis permitidos
    return route.roles.includes(userRole);
}
// --- FIM: Regra especial para recepcionista --- 
