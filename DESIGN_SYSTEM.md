## Visão Geral

O Design System do projeto Trato de Barbados consolida tokens de design, diretrizes de acessibilidade e uma biblioteca de componentes construída com Chakra UI v3 e TypeScript. O objetivo é garantir consistência visual, acessibilidade (WCAG AA+), produtividade e escalabilidade entre times e módulos do sistema.

Principais pilares:

- Consistência: aparências e comportamentos previsíveis em todas as telas.
- Acessibilidade: foco visível, teclabilidade, semântica e contraste adequados.
- Escalabilidade: uso de tokens, variantes e componentes reutilizáveis/documentados.
- Performance: estilos centralizados em tema e componentes estáveis.

---

## Tema Global

O tema está em `src/theme/index.ts` e utiliza a API do Chakra v3 (`defineTokens`, `defineConfig`, `createSystem`).

```ts
// src/theme/index.ts
"use client";
import {
  defineConfig,
  defineTokens,
  defineGlobalStyles,
  createSystem,
  defaultConfig,
} from "@chakra-ui/react";

const tokens = defineTokens({
  colors: {
    brand: {
      50: { value: "#e6f0ff" },
      100: { value: "#bfd4ff" },
      200: { value: "#99b8ff" },
      300: { value: "#739cff" },
      400: { value: "#4d80ff" },
      500: { value: "#1f64ff" },
      600: { value: "#184fcc" },
      700: { value: "#123a99" },
      800: { value: "#0b2666" },
      900: { value: "#051333" },
      gold: { value: "#d4af37" },
    },
  },
});

const globalCss = defineGlobalStyles({
  "html, body, #__next": { height: "100%" },
  body: { bg: "white", color: "gray.900" },
});

const appConfig = defineConfig({
  theme: { tokens },
  globalCss,
});

export const theme = createSystem(defaultConfig, appConfig);
export default theme;
```

Inicialização do tema no `app/providers.tsx` com `ChakraProvider`:

```tsx
// app/providers.tsx
"use client";
import * as React from "react";
import { ChakraProvider } from "@chakra-ui/react";
import theme from "@/theme";
import { AuthProvider } from "@/lib/contexts/AuthContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={theme}>
      <AuthProvider>{children}</AuthProvider>
    </ChakraProvider>
  );
}
```

Observação: o projeto não utiliza mais `CacheProvider` (do pacote `@chakra-ui/next-js`). Essa dependência foi removida por compatibilidade e não é necessária no setup atual.

### Tokens disponíveis (Light/Dark)

Os tokens atualmente definidos no tema são os de cor da família `brand`. Abaixo está a tabela de valores por tonalidade. Em modo claro/escuro, recomenda-se escolher tonalidades com contraste adequado ao contexto de uso.

| Token      | Valor   |
| ---------- | ------- |
| brand.50   | #e6f0ff |
| brand.100  | #bfd4ff |
| brand.200  | #99b8ff |
| brand.300  | #739cff |
| brand.400  | #4d80ff |
| brand.500  | #1f64ff |
| brand.600  | #184fcc |
| brand.700  | #123a99 |
| brand.800  | #0b2666 |
| brand.900  | #051333 |
| brand.gold | #d4af37 |

Diretrizes para expansão futura (quando adicionados ao `defineTokens`):

- bg.surface, bg.muted
- border.default
- text.default, text.muted
- semantic: destructive, warning, success, info
- elevation: sombras padronizadas (elevation, elevation.sm, elevation.lg)

Enquanto esses tokens semânticos não existirem, utilize as paletas do Chakra (ex.: `gray.*`, `blackAlpha.*`, `whiteAlpha.*`) e `colorScheme="brand"` para ações primárias.

### Tipografia e Espaçamento (diretrizes)

O tema utiliza a escala padrão do Chakra v3. Recomendações:

- `fontSizes`: xs, sm, md, lg, xl
- `fontWeights`: medium, semibold, bold
- `space`: 1, 2, 3, 4, 6, 8 (use `gap`, `p`, `m`)

---

## Guia de Light/Dark Mode

- Alternância de modo pode ser implementada via `useColorMode` do Chakra v3 (quando habilitado no projeto):

```tsx
import { IconButton } from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
// import { useColorMode } from "@chakra-ui/react"; // habilite caso o projeto esteja usando Color Mode

export function ThemeToggleButton() {
  // const { colorMode, toggleColorMode } = useColorMode();
  // Exemplo neutro de toggle (substitua pela integração de Color Mode quando habilitada):
  return (
    <IconButton aria-label="Alternar tema">
      {/* {colorMode === "light" ? <MoonIcon /> : <SunIcon />} */}
      <SunIcon />
    </IconButton>
  );
}
```

Diretrizes de contraste:

- Seguir WCAG AA+ (4.5:1 para texto normal; 3:1 para títulos grandes).
- Não sobrepor `brand` sobre `brand` sem contraste suficiente.

---

## Componentes Padrão

### useAppToast

- Arquivo: `src/hooks/useAppToast.ts`
- Descrição: API de toast tipada e desacoplada (emite evento `app:toast` para um listener global de toasts).

| Prop        | Tipo      | Obrigatório | Descrição                   |
| ----------- | --------- | ----------- | --------------------------- | --------- | --- | ----- |
| title       | string    | sim         | Título do toast             |
| description | string    | não         | Mensagem opcional           |
| durationMs  | number    | não         | Duração em ms (padrão 4000) |
| isClosable  | boolean   | não         | Exibir botão fechar         |
| status      | "success" | "error"     | "info"                      | "warning" | não | Nível |
| id          | string    | não         | Identificador opcional      |

Exemplo:

```ts
import { useAppToast } from "@/hooks/useAppToast";

export function ExampleToast() {
  const toast = useAppToast();
  function onSave() {
    toast.success({ title: "Salvo", description: "Alterações persistidas." });
  }
  return null;
}
```

### ConfirmDialog + useConfirm

- Arquivos: `src/components/ui/ConfirmDialog.tsx` e `src/hooks/useConfirm.tsx`
- Descrição: diálogo de confirmação acessível para ações críticas.

Props principais de `ConfirmDialog`:

| Prop        | Tipo          | Obrigatório |
| ----------- | ------------- | ----------- | --------- | --- |
| isOpen      | boolean       | sim         |
| title       | string        | sim         |
| message     | string        | não         |
| tone        | "destructive" | "warning"   | "neutral" | não |
| confirmText | string        | não         |
| cancelText  | string        | não         |
| onConfirm   | () => void    | sim         |
| onCancel    | () => void    | sim         |

Exemplo com hook:

```tsx
import { useConfirm } from "@/hooks/useConfirm";
import { Button } from "@chakra-ui/react";

export function DeleteAction() {
  const { confirm, DialogPortal } = useConfirm();

  async function handleDelete() {
    const ok = await confirm({
      title: "Excluir registro",
      message: "Esta ação não pode ser desfeita.",
      tone: "destructive",
      confirmText: "Excluir",
      cancelText: "Cancelar",
    });
    if (ok) {
      // efetivar exclusão
    }
  }

  return (
    <>
      <Button colorScheme="red" onClick={handleDelete}>
        Excluir
      </Button>
      <DialogPortal />
    </>
  );
}
```

### AppDrawer

- Arquivo: `src/components/ui/AppDrawer.tsx`
- Uso recomendado para fluxos longos de edição e formulários multi-etapas.
- Siga as props do Drawer do Chakra v3; mantenha título, conteúdo e ações consistentes.

### Botões

- Origem: `@chakra-ui/react` (v3). Variantes comuns: `solid`, `outline`, `subtle`, `ghost`, `plain`.

```tsx
import { Button, HStack } from "@chakra-ui/react";

export function ButtonsShowcase() {
  return (
    <HStack gap={3}>
      <Button variant="solid" colorScheme="brand">
        Primário
      </Button>
      <Button variant="outline">Secundário</Button>
      <Button variant="ghost">Fantasma</Button>
    </HStack>
  );
}
```

### Inputs e Select

- Origem: `@chakra-ui/react`. Sempre incluir `aria-label`/`id`/`name` quando aplicável.

```tsx
import { Input, Select, VStack } from "@chakra-ui/react";

export function FormFields() {
  return (
    <VStack gap={3}>
      <Input placeholder="Seu nome" aria-label="Nome" />
      <Select.Root aria-label="Função">
        <Select.Trigger />
        <Select.Positioner>
          <Select.Content>
            <Select.ItemGroup id="roles">
              <Select.Item item="client">Cliente</Select.Item>
              <Select.Item item="professional">Profissional</Select.Item>
              <Select.Item item="barbershop_owner">Proprietário</Select.Item>
            </Select.ItemGroup>
          </Select.Content>
        </Select.Positioner>
      </Select.Root>
    </VStack>
  );
}
```

### Tabelas

- Preferir a API por slots do Chakra v3 (`TableRoot`, `TableHeader`, `TableBody`, etc.).

```tsx
import {
  TableRoot,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableColumnHeader,
} from "@chakra-ui/react";

interface Row {
  id: string;
  name: string;
  status: string;
}

export function SimpleTable({ rows }: { rows: Row[] }) {
  return (
    <TableRoot>
      <TableHeader>
        <TableRow>
          <TableColumnHeader>Nome</TableColumnHeader>
          <TableColumnHeader>Status</TableColumnHeader>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell>{r.name}</TableCell>
            <TableCell>{r.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableRoot>
  );
}
```

---

## Diretrizes de Uso

- Preferir tokens/variantes do tema em vez de cores fixas.
- Acessibilidade:
  - Sempre usar `aria-label` em ações com ícones.
  - Não remover foco visível.
  - Diálogos com botão de cancelar e foco gerenciado.
- Responsividade:
  - Utilizar breakpoints (`base`, `sm`, `md`, `lg`, `xl`).
  - Preferir `gap` (Stacks) e `SimpleGrid` com colunas responsivas.
- Quando usar:
  - Ações destrutivas: `ConfirmDialog`/`useConfirm`.
  - Edições longas: `AppDrawer`.
  - Notificações: `useAppToast`.

---

## Boas Práticas

- Espaçamento consistente: `gap`, `p`, `m` conforme escala do tema.
- Hierarquia visual: use `fontSizes`/`fontWeights` do tema.
- Variantes (`variant`) e tamanhos (`size`) para comunicar importância.
- Sempre confirmar ações destrutivas.
- Conteúdo extenso em Drawer/Modal com rolagem.

---

## Exemplos Reais

### Card com tokens do tema

```tsx
import { Box, Heading, Text } from "@chakra-ui/react";

export function ThemedCard() {
  return (
    <Box
      borderWidth="1px"
      borderColor="gray.200"
      rounded="xl"
      boxShadow="md"
      p={4}
    >
      <Heading size="md" mb={2}>
        Título
      </Heading>
      <Text color="gray.600">
        Descrição do conteúdo com contraste adequado.
      </Text>
    </Box>
  );
}
```

### Página com Light/Dark toggle (exemplo neutro)

```tsx
import { HStack, Text, IconButton } from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";

export function HeaderWithToggle() {
  return (
    <HStack
      justify="space-between"
      p={4}
      borderBottomWidth="1px"
      borderColor="gray.200"
    >
      <Text>Trato de Barbados</Text>
      <IconButton aria-label="Alternar tema">
        {/* Use useColorMode quando habilitar Color Mode */}
        <MoonIcon />
      </IconButton>
    </HStack>
  );
}
```

### Tabela responsiva

```tsx
import {
  TableRoot,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableColumnHeader,
} from "@chakra-ui/react";

interface Row {
  id: string;
  name: string;
  status: string;
}

export function ResponsiveTable({ rows }: { rows: Row[] }) {
  return (
    <TableRoot borderWidth="1px" borderColor="gray.200">
      <TableHeader>
        <TableRow>
          <TableColumnHeader>Nome</TableColumnHeader>
          <TableColumnHeader>Status</TableColumnHeader>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell>{r.name}</TableCell>
            <TableCell>{r.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableRoot>
  );
}
```

---

## Manutenção

### Adicionar novos tokens

1. Edite `src/theme/index.ts` dentro de `defineTokens`.
2. Use nomes semânticos e documente neste arquivo a inclusão.
3. Rode `npx tsc --noEmit` para validar tipagem.

### Criar novos componentes padronizados

1. Crie dentro de `src/components/ui/` com tipos explícitos (sem `any`).
2. Use tokens/variantes do tema e respeite acessibilidade (aria, foco, semântica).
3. Inclua exemplo no `DESIGN_SYSTEM.md` (esta página).

### Atualizar o tema global

1. Ajuste `tokens`/`globalCss` em `src/theme/index.ts`.
2. Valide Light/Dark e contraste.
3. Evite breaking changes; se necessário, faça migração gradual.

### Fluxo de PR para mudanças no Design System

1. Abra PR com descrição do problema e a proposta de solução.
2. Inclua screenshots antes/depois e links para specs de acessibilidade quando aplicável.
3. Garanta exemplos de uso e atualização desta documentação.

---

## Checklist

- [x] README criado na raiz (`DESIGN_SYSTEM.md`).
- [x] Todas as seções documentadas.
- [x] Componentes padronizados descritos (toast, confirm, drawer, botões, inputs, tabelas).
- [x] Tokens disponíveis listados (brand.\*) e diretrizes para expansão.
- [x] Exemplos de código tipados (TS/TSX) e prontos para copiar/colar.
- [x] Diretrizes de Light/Dark e contraste.
- [x] Guia de manutenção e fluxo de PR.
