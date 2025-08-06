module.exports = {
  apps: [
    {
      name: "saas-barbearia",
      script: "npm",
      args: "start",
      cwd: "/var/www/saas-barbearia",
      env: {
        NODE_ENV: "production",
        NEXT_PUBLIC_SUPABASE_URL: "SUA_URL_SUPABASE",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "SUA_CHAVE_ANON",
        SUPABASE_SERVICE_ROLE_KEY: "SUA_CHAVE_SERVICE",
        ASAAS_TRATO_API_KEY: "SUA_CHAVE_TRATO",
        NEXT_PUBLIC_API_URL: "https://sistema.tratodebarbados.com",
      },
    },
  ],
};
