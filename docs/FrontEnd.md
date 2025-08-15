# 🖥️ Frontend - React/Next.js - Trato de Barbados

## 🎯 **Visão Geral do Frontend**

O frontend é construído com **Next.js 15** (App Router), **React 19**, **TypeScript 5** e **Chakra UI 3**, seguindo padrões modernos de desenvolvimento com componentes funcionais, hooks e TypeScript strict.

---

## 📁 **Estrutura de Pastas**

```
📁 trato/
├── 📁 app/                          # Next.js App Router
│   ├── 📄 layout.tsx               # Layout raiz
│   ├── 📄 page.tsx                 # Homepage
│   ├── 📄 globals.css              # Estilos globais
│   ├── 📄 providers.tsx            # Providers do app
│   │
│   ├── 📁 (auth)/                  # Grupo de autenticação
│   │   ├── 📁 login/
│   │   ├── 📁 sign-up/
│   │   ├── 📁 forgot-password/
│   │   └── 📁 update-password/
│   │
│   ├── 📁 agenda/                  # Sistema de agendamentos
│   │   ├── 📄 page.tsx            # Página principal
│   │   ├── 📄 layout.tsx          # Layout da agenda
│   │   ├── 📁 ui/                 # Componentes UI específicos
│   │   │   ├── 📄 AgendaGrid.tsx  # Grid principal (AppBarber style)
│   │   │   └── 📄 CalendarView.tsx
│   │   ├── 📁 utils/              # Utilitários da agenda
│   │   └── 📄 actions.ts          # Server Actions
│   │
│   ├── 📁 dashboard/              # Painéis administrativos
│   │   ├── 📁 distribuicao/       # Trato de Barbados
│   │   ├── 📁 distribuicao-bbsc/  # BarberBeer
│   │   ├── 📁 agendamentos/
│   │   └── 📁 components/
│   │
│   ├── 📁 clientes/               # Gestão de clientes
│   ├── 📁 assinaturas/            # Gestão de assinaturas
│   ├── 📁 lista-da-vez/           # Fila de atendimento
│   ├── 📁 relatorios/             # Relatórios e analytics
│   │
│   └── 📁 api/                    # API Routes
│       ├── 📁 auth/
│       ├── 📁 appointments/
│       ├── 📁 asaas/
│       └── 📁 dashboard/
│
├── 📁 components/                 # Componentes reutilizáveis
│   ├── 📁 ui/                    # Componentes base
│   ├── 📁 auth/                  # Autenticação
│   ├── 📁 layout/                # Layout e navegação
│   └── 📁 forms/                 # Formulários
│
├── 📁 hooks/                     # Custom Hooks
├── 📁 lib/                       # Bibliotecas e utilitários
│   ├── 📁 services/             # Serviços de integração
│   ├── 📁 supabase/             # Cliente Supabase
│   └── 📁 utils/                # Funções utilitárias
│
└── 📁 types/                     # Definições de tipos
```

---

## 🎨 **Design System e UI**

### **Chakra UI 3 - Sistema Base**

```typescript
// 📍 app/providers.tsx
import { ChakraProvider } from "@chakra-ui/react";
import { system } from "@/theme/system";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ChakraProvider value={system}>{children}</ChakraProvider>;
}

// 📍 theme/system.ts
import { createSystem, defaultConfig } from "@chakra-ui/react";

export const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: "#f0f9ff" },
          500: { value: "#3b82f6" },
          900: { value: "#1e3a8a" },
        },
      },
    },
  },
});
```

### **Tokens de Design**

```css
/* 📍 app/globals.css */
:root {
  /* Cores do sistema */
  --brand-primary: #22c55e;
  --brand-secondary: #ef4444;
  --background: #0f1115;
  --card: #1a1a1a;
  --border: rgba(255, 255, 255, 0.1);

  /* Espaçamentos */
  --space-1: 0.25rem;
  --space-4: 1rem;
  --space-8: 2rem;

  /* Agenda específico */
  --slot-10m: 14px; /* Altura do slot de 10min */
}
```

### **Componentes Base**

```typescript
// 📍 components/ui/Button.tsx
import { Button as ChakraButton } from "@chakra-ui/react";

interface ButtonProps {
  variant?: "solid" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = "solid",
  size = "md",
  ...props
}: ButtonProps) {
  return <ChakraButton variant={variant} size={size} {...props} />;
}

// 📍 components/ui/Card.tsx
import { Card as ChakraCard } from "@chakra-ui/react";

export function Card({ children, ...props }) {
  return (
    <ChakraCard
      bg="card"
      border="1px solid"
      borderColor="border"
      borderRadius="2xl"
      p={6}
      {...props}
    >
      {children}
    </ChakraCard>
  );
}
```

---

## 📱 **Roteamento e Navegação**

### **App Router Structure**

```typescript
// 📍 app/layout.tsx - Layout raiz
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          <AuthProvider>
            <Sidebar />
            <main className="ml-64">{children}</main>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}

// 📍 app/(auth)/layout.tsx - Layout de autenticação
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card maxW="md" w="full">
        {children}
      </Card>
    </div>
  );
}
```

### **Navegação Principal**

```typescript
// 📍 components/layout/Sidebar.tsx
const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: HomeIcon,
    current: pathname === "/dashboard",
  },
  {
    name: "Agenda",
    href: "/agenda",
    icon: CalendarIcon,
    current: pathname.startsWith("/agenda"),
  },
  {
    name: "Clientes",
    href: "/clientes",
    icon: UsersIcon,
    current: pathname.startsWith("/clientes"),
  },
  {
    name: "Lista da Vez",
    href: "/lista-da-vez",
    icon: QueueListIcon,
    current: pathname === "/lista-da-vez",
  },
  {
    name: "Relatórios",
    href: "/relatorios",
    icon: ChartBarIcon,
    current: pathname.startsWith("/relatorios"),
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-card border-r border-border">
      <nav className="mt-8">
        {navigationItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`group flex items-center px-4 py-2 text-sm ${
              item.current
                ? "bg-brand-primary/10 text-brand-primary"
                : "text-gray-300"
            }`}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
```

---

## ⚛️ **Componentes Principais**

### **1. AgendaGrid - Sistema de Agenda**

```typescript
// 📍 app/agenda/ui/AgendaGrid.tsx
export interface GridEvent {
  id: string;
  resourceId?: string | number;
  start: string; // ISO timestamp
  end: string;
  title?: string;
  status?: "agendado" | "confirmado" | "atendido" | "cancelado";
  clientName?: string;
  serviceName?: string;
  isNewClient?: boolean;
}

export interface GridResource {
  resourceId: string | number;
  resourceTitle: string;
  color?: string;
}

export interface BlockedRange {
  id: string;
  resourceId?: string | number;
  startISO: string;
  endISO: string;
  reason?: string;
}

export default function AgendaGrid({
  date,
  view,
  events,
  resources,
  blockedRanges = [],
  startHour = 8,
  endHour = 21,
  slotMinutes = 10,
  onEventClick,
  onMove,
  onResize,
  onSelectRange,
}: Props) {
  // Implementação do grid estilo AppBarber
  // ✅ Slots de 10min com quantização
  // ✅ Drag & drop com DnD Kit
  // ✅ Validação de conflitos
  // ✅ Períodos bloqueados
  // ✅ Linha do "agora"
  // ✅ Background com zebra de 30min
}
```

### **2. BarberQueue - Fila de Atendimento**

```typescript
// 📍 components/BarberQueueTest.tsx
interface QueueItem {
  id: string;
  cliente_nome: string;
  chegada: string;
  atendimento?: string;
  barbeiro_id?: string;
  passou_vez: boolean;
  posicao: number;
}

export function BarberQueue() {
  const {
    filaOrdenada,
    handleAtendimento,
    handlePassarVez,
    reorganizarPorAtendimentos,
  } = useBarberQueue();

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <SortableContext
        items={filaOrdenada}
        strategy={verticalListSortingStrategy}
      >
        {filaOrdenada.map((item) => (
          <SortableQueueItem
            key={item.id}
            item={item}
            onAtender={() => handleAtendimento(item.id)}
            onPassarVez={() => handlePassarVez(item.id)}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

### **3. Dashboard Components**

```typescript
// 📍 app/dashboard/components/MetricsCard.tsx
interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType;
  variant?: "default" | "success" | "warning" | "danger";
}

export function MetricsCard({
  title,
  value,
  change,
  icon: Icon,
  variant = "default",
}: MetricsCardProps) {
  return (
    <Card>
      <Flex justify="between" align="start">
        <Box>
          <Text fontSize="sm" color="gray.500">
            {title}
          </Text>
          <Text fontSize="3xl" fontWeight="bold">
            {value}
          </Text>
          {change && (
            <Flex align="center" mt={2}>
              <Icon size={16} />
              <Text fontSize="sm" color={change > 0 ? "green.500" : "red.500"}>
                {change > 0 ? "+" : ""}
                {change}%
              </Text>
            </Flex>
          )}
        </Box>
        <Icon size={24} />
      </Flex>
    </Card>
  );
}

// 📍 app/dashboard/components/RevenueChart.tsx
export function RevenueChart({ data }: { data: RevenueData[] }) {
  return (
    <Card>
      <CardHeader>
        <Heading size="md">Faturamento Mensal</Heading>
      </CardHeader>
      <CardBody>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#22c55e" />
          </LineChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
```

---

## 🔗 **State Management**

### **React Context + Custom Hooks**

```typescript
// 📍 lib/contexts/UnidadeContext.tsx
interface UnidadeContextType {
  unidadeAtual: "trato" | "barberbeer";
  setUnidadeAtual: (unidade: "trato" | "barberbeer") => void;
  unidadeId: string;
  config: UnidadeConfig;
}

export const UnidadeContext = createContext<UnidadeContextType | null>(null);

export function UnidadeProvider({ children }: { children: React.ReactNode }) {
  const [unidadeAtual, setUnidadeAtual] = useState<"trato" | "barberbeer">(
    "trato"
  );

  const unidadeId =
    unidadeAtual === "trato"
      ? process.env.NEXT_PUBLIC_TRATO_UNIDADE_ID!
      : process.env.NEXT_PUBLIC_BBSC_UNIDADE_ID!;

  const config =
    unidadeAtual === "trato"
      ? { name: "Trato de Barbados", color: "#22c55e" }
      : { name: "BarberBeer", color: "#ef4444" };

  return (
    <UnidadeContext.Provider
      value={{ unidadeAtual, setUnidadeAtual, unidadeId, config }}
    >
      {children}
    </UnidadeContext.Provider>
  );
}

// Hook customizado
export function useUnidade() {
  const context = useContext(UnidadeContext);
  if (!context) {
    throw new Error("useUnidade must be used within UnidadeProvider");
  }
  return context;
}
```

### **Custom Hooks para Data Fetching**

```typescript
// 📍 hooks/useBarberQueue.ts
export function useBarberQueue() {
  const [fila, setFila] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { unidadeId } = useUnidade();

  const buscarFila = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("barber_queue")
        .select("*")
        .eq("unidade_id", unidadeId)
        .order("posicao");

      if (error) throw error;
      setFila(data || []);
    } catch (error) {
      console.error("Erro ao buscar fila:", error);
    } finally {
      setLoading(false);
    }
  }, [unidadeId]);

  const handleAtendimento = useCallback(
    async (id: string) => {
      const supabase = createClient();
      await supabase
        .from("barber_queue")
        .update({ atendimento: new Date().toISOString() })
        .eq("id", id);

      await buscarFila(); // Refresh
    },
    [buscarFila]
  );

  const reorganizarPorAtendimentos = useCallback(async () => {
    // Lógica de reorganização automática
    const supabase = createClient();

    // Buscar fila atual
    const { data: filaAtual } = await supabase
      .from("barber_queue")
      .select("*")
      .eq("unidade_id", unidadeId)
      .order("atendimento_count", { ascending: false });

    // Reorganizar posições
    for (let i = 0; i < filaAtual.length; i++) {
      await supabase
        .from("barber_queue")
        .update({ posicao: i + 1 })
        .eq("id", filaAtual[i].id);
    }

    await buscarFila();
  }, [unidadeId, buscarFila]);

  return {
    fila: fila.sort((a, b) => a.posicao - b.posicao),
    loading,
    handleAtendimento,
    reorganizarPorAtendimentos,
    refetch: buscarFila,
  };
}

// 📍 hooks/useAppointments.ts
export function useAppointments(date: Date) {
  const [appointments, setAppointments] = useState<GridEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { unidadeId } = useUnidade();

  const fetchAppointments = useCallback(async () => {
    const supabase = createClient();
    const startOfDay = dayjs(date).startOf("day").toISOString();
    const endOfDay = dayjs(date).endOf("day").toISOString();

    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
        *,
        professional:barbeiro_id(nome),
        client:cliente_id(nome)
      `
      )
      .eq("unidade_id", unidadeId)
      .gte("start_at", startOfDay)
      .lte("start_at", endOfDay);

    if (!error && data) {
      setAppointments(data.map(mapDbToGridEvent));
    }
    setLoading(false);
  }, [date, unidadeId]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return { appointments, loading, refetch: fetchAppointments };
}
```

---

## 📋 **Formulários e Validação**

### **React Hook Form + Zod**

```typescript
// 📍 lib/schemas/appointment.ts
import { z } from "zod";

export const appointmentSchema = z
  .object({
    barbeiro_id: z.string().uuid("Barbeiro é obrigatório"),
    cliente_id: z.string().uuid("Cliente é obrigatório"),
    start_at: z.string().datetime("Data/hora inválida"),
    end_at: z.string().datetime("Data/hora inválida"),
    servicos: z
      .array(
        z.object({
          id: z.string(),
          nome: z.string(),
          duracao_minutos: z.number().optional(),
        })
      )
      .min(1, "Pelo menos um serviço é obrigatório"),
    observacoes: z.string().optional(),
  })
  .refine((data) => new Date(data.end_at) > new Date(data.start_at), {
    message: "Hora de fim deve ser posterior à hora de início",
    path: ["end_at"],
  });

export type AppointmentFormData = z.infer<typeof appointmentSchema>;

// 📍 components/forms/AppointmentForm.tsx
export function AppointmentForm({
  onSubmit,
  defaultValues,
}: AppointmentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues,
  });

  const startAt = watch("start_at");

  // Auto-calcular end_at baseado nos serviços selecionados
  useEffect(() => {
    const servicos = watch("servicos");
    if (startAt && servicos?.length) {
      const totalMinutos = servicos.reduce(
        (acc, s) => acc + (s.duracao_minutos || 30),
        0
      );
      const endAt = dayjs(startAt)
        .add(totalMinutos, "minute")
        .format("YYYY-MM-DDTHH:mm");
      setValue("end_at", endAt);
    }
  }, [startAt, watch("servicos")]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <VStack spacing={4}>
        <FormControl isInvalid={!!errors.barbeiro_id}>
          <FormLabel>Barbeiro</FormLabel>
          <Select {...register("barbeiro_id")}>
            <option value="">Selecione um barbeiro</option>
            {barbeiros.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nome}
              </option>
            ))}
          </Select>
          <FormErrorMessage>{errors.barbeiro_id?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.start_at}>
          <FormLabel>Data e Hora</FormLabel>
          <Input type="datetime-local" {...register("start_at")} />
          <FormErrorMessage>{errors.start_at?.message}</FormErrorMessage>
        </FormControl>

        <Button type="submit" isLoading={isSubmitting} colorScheme="brand">
          Agendar
        </Button>
      </VStack>
    </form>
  );
}
```

---

## 🎭 **Autenticação e Proteção**

### **Auth Context**

```typescript
// 📍 components/auth/AuthProvider.tsx
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: string) => boolean;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Buscar usuário atual
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchProfile(user.id);
      }
      setLoading(false);
    });

    // Listener para mudanças de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    setProfile(data);
  };

  const hasRole = (role: string) => {
    return profile?.role === role || profile?.role === "admin";
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### **Proteção de Rotas**

```typescript
// 📍 components/auth/ProtectedRoute.tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = "/auth/login",
}: ProtectedRouteProps) {
  const { user, profile, loading, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(redirectTo);
        return;
      }

      if (requiredRole && !hasRole(requiredRole)) {
        router.push("/unauthorized");
        return;
      }
    }
  }, [user, profile, loading, requiredRole]);

  if (loading) {
    return <Spinner />;
  }

  if (!user || (requiredRole && !hasRole(requiredRole))) {
    return null;
  }

  return <>{children}</>;
}

// Uso em páginas
export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminDashboard />
    </ProtectedRoute>
  );
}
```

---

## ⚠️ **Pontos de Atenção Frontend**

### **Performance**

- **Bundle Size**: Chakra UI pode aumentar bundle (⚠️ monitorar)
- **Re-renders**: Contexts podem causar re-renders desnecessários
- **Images**: Não há otimização de imagens implementada
- **Code Splitting**: Apenas básico implementado

### **UX/UI**

- **Mobile**: Interface não totalmente responsiva (📱 débito técnico)
- **Loading States**: Nem todos os componentes têm loading adequado
- **Error Boundaries**: Implementação básica, pode melhorar
- **Accessibility**: ARIA labels faltando em alguns componentes

### **SEO**

- **Meta Tags**: Básico implementado, pode ser expandido
- **Structured Data**: Não implementado
- **Sitemap**: Não configurado automaticamente

### **Melhorias Recomendadas**

1. **Implementar React Query** para cache de dados
2. **Adicionar Storybook** para documentação de componentes
3. **Configurar PWA** para offline functionality
4. **Implementar E2E tests** com Playwright/Cypress

---

**Última atualização**: Dezembro 2024  
**Versão**: 1.0  
**Stack**: Next.js 15 + React 19 + Chakra UI 3
