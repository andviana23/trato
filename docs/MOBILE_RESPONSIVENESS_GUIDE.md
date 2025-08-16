# Guia de Responsividade Mobile - Trato Barbados

## 📱 Componentes Implementados

### 1. Navigation Drawer Mobile

- **Localização**: `components/mobile/MobileNavigationDrawer.tsx`
- **Funcionalidades**:
  - Menu lateral deslizante com animações Framer Motion
  - Navegação hierárquica com seções expansíveis
  - Indicador de unidade atual
  - Informações do usuário
  - Botão de logout
  - Auto-fechamento ao navegar
  - Suporte a gestos (Escape para fechar)

### 2. AppShell Responsivo

- **Localização**: `components/layout/ResponsiveAppShell.tsx`
- **Funcionalidades**:
  - Sidebar desktop (≥768px)
  - Navigation drawer mobile (<768px)
  - Header adaptativo com botão de menu mobile
  - Search bar responsivo
  - User menu consistente

### 3. Dashboard Responsivo

- **Localização**: `app/dashboard/components/ResponsiveDashboard.tsx`
- **Funcionalidades**:
  - Grid de estatísticas adaptativo (1 col → 2 cols → 4 cols)
  - Cards de ação rápida responsivos
  - Layout flexível para informações do usuário
  - Estados de loading otimizados
  - Badges de função do usuário

### 4. Agenda Mobile com Swipe

- **Localização**: `app/agenda/ui/AgendaGridMobile.tsx`
- **Funcionalidades**:
  - Navegação por swipe entre dias
  - Cards de eventos otimizados para touch
  - Seções por profissional
  - Slots de tempo rápido
  - Animações de transição suaves
  - Indicadores de navegação

### 5. Hook de Media Query

- **Localização**: `hooks/useMediaQuery.ts`
- **Funcionalidades**:
  - Detecção de breakpoints customizáveis
  - Hooks pré-definidos (mobile, tablet, desktop)
  - SSR-safe

## 🎯 Breakpoints Utilizados

```css
/* Mobile */
max-width: 640px (sm)
max-width: 768px (md)

/* Tablet */
min-width: 769px and max-width: 1024px

/* Desktop */
min-width: 1025px
```

## 📋 Checklist de Teste

### Testes de Responsividade

#### Mobile (320px - 768px)

- [ ] Navigation drawer abre/fecha corretamente
- [ ] Menu hamburger visível e funcional
- [ ] Dashboard cards empilham verticalmente
- [ ] Agenda móvel com swipe funciona
- [ ] Search bar se adapta ao tamanho
- [ ] Texto permanece legível
- [ ] Botões têm tamanho adequado para touch (44px+)

#### Tablet (769px - 1024px)

- [ ] Layout híbrido funciona corretamente
- [ ] Dashboard usa 2-3 colunas
- [ ] Navegação permanece acessível
- [ ] Espaçamento adequado

#### Desktop (1025px+)

- [ ] Sidebar fixa visível
- [ ] Dashboard usa 4 colunas
- [ ] Agenda desktop carrega corretamente
- [ ] Todas as funcionalidades preservadas

### Testes de Funcionalidade Mobile

#### Navigation Drawer

- [ ] Abre com botão hamburger
- [ ] Fecha com botão X
- [ ] Fecha ao clicar fora
- [ ] Fecha com tecla Escape
- [ ] Fecha ao navegar para nova página
- [ ] Seções expandem/contraem corretamente
- [ ] Links funcionam corretamente
- [ ] Logout funciona
- [ ] Animações são suaves

#### Agenda Mobile

- [ ] Swipe para esquerda = próximo dia
- [ ] Swipe para direita = dia anterior
- [ ] Botões de navegação funcionam
- [ ] Eventos são clicáveis
- [ ] Slots de tempo funcionam
- [ ] Animações de transição são suaves
- [ ] Indicadores visuais corretos

#### Dashboard Mobile

- [ ] Cards de estatísticas são clicáveis
- [ ] Ações rápidas funcionam
- [ ] Atividade recente carrega
- [ ] Informações do usuário visíveis
- [ ] Todos os botões funcionais

## 🛠 Como Testar

### 1. DevTools do Browser

```bash
# Chrome/Firefox DevTools
1. F12 para abrir DevTools
2. Clique no ícone de device/responsivo
3. Teste diferentes tamanhos:
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - iPad (768px)
   - iPad Pro (1024px)
```

### 2. Dispositivos Reais

Teste em dispositivos físicos quando possível:

- Smartphones (Android/iOS)
- Tablets
- Desktop/Laptop

### 3. Orientação

- [ ] Portrait (retrato)
- [ ] Landscape (paisagem)

## 🔧 Configuração de Desenvolvimento

### Dependências Adicionadas

```json
{
  "framer-motion": "^latest",
  "@use-gesture/react": "^latest"
}
```

### CSS/Tailwind Classes Importantes

```css
/* Breakpoints Tailwind */
sm: 640px    /* Small devices */
md: 768px    /* Medium devices */
lg: 1024px   /* Large devices */
xl: 1280px   /* Extra large devices */

/* Classes de responsividade frequentes */
.hidden md:block     /* Esconder no mobile, mostrar no desktop */
.md:hidden           /* Mostrar no mobile, esconder no desktop */
.grid-cols-1 md:grid-cols-2 lg:grid-cols-4  /* Grid responsivo */
```

## 🎨 Padrões de Design Mobile

### Touch Targets

- Mínimo 44px x 44px para elementos tocáveis
- Espaçamento adequado entre elementos

### Tipografia

- Tamanhos de fonte legíveis (≥16px para body text)
- Contraste adequado
- Texto responsivo

### Navegação

- Breadcrumbs em desktop
- Bottom navigation em mobile (quando apropriado)
- Drawer navigation para menu principal

### Cards e Layouts

- Cards com espaçamento adequado
- Margens/padding responsivos
- Evitar overflow horizontal

## 🐛 Problemas Conhecidos e Soluções

### 1. Flicker de SSR

```tsx
// Usar dynamic import para componentes com media queries
const ResponsiveComponent = dynamic(() => import("./Component"), {
  ssr: false,
});
```

### 2. Gesture Conflicts

```tsx
// Prevenir conflitos de swipe com scroll
const bind = useDrag(
  ({ movement: [mx], direction: [dx], velocity: [vx], last }) => {
    // Lógica de swipe
  },
  {
    axis: "x", // Apenas horizontal
    threshold: 50, // Threshold mínimo
  }
);
```

### 3. Performance em Mobile

- Usar `React.memo` para componentes pesados
- Lazy loading para imagens
- Debounce para input handlers

## 📈 Próximos Passos

1. [ ] Adicionar testes automatizados de responsividade
2. [ ] Implementar PWA features
3. [ ] Otimizar performance para conexões lentas
4. [ ] Adicionar suporte a dark mode melhorado
5. [ ] Implementar gestos avançados (pinch-to-zoom, etc.)

## 📞 Suporte

Para problemas de responsividade:

1. Verificar console do browser para erros
2. Testar em diferentes browsers
3. Validar breakpoints CSS
4. Verificar conflitos de z-index
5. Testar performance em dispositivos mais lentos
