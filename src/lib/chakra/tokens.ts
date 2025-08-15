// Tokens semânticos: use estes nomes no app (bg.canvas, text.primary...)
// Assim o tema troca de cor automaticamente no dark/light.
export const semanticTokens = {
  colors: {
    'bg.canvas': { default: 'gray.50', _dark: 'gray.900' },
    'bg.surface': { default: 'white', _dark: 'gray.800' },
    'bg.muted': { default: 'gray.100', _dark: 'gray.700' },

    'text.primary': { default: 'gray.800', _dark: 'gray.100' },
    'text.secondary': { default: 'gray.600', _dark: 'gray.300' },
    'text.muted': { default: 'gray.500', _dark: 'gray.400' },

    // Marca Trato de Barbados (ajuste se quiser)
    'brand.50': { default: 'blue.50', _dark: 'blue.50' },
    'brand.100': { default: 'blue.100', _dark: 'blue.100' },
    'brand.500': { default: 'blue.500', _dark: 'blue.400' },
    'brand.600': { default: 'blue.600', _dark: 'blue.500' },
    'brand.700': { default: 'blue.700', _dark: 'blue.600' },

    'accent': { default: 'yellow.400', _dark: 'yellow.300' },
    'border': { default: 'gray.200', _dark: 'gray.700' },
    'ring': { default: 'blue.500', _dark: 'blue.400' },
  },
  radii: {
    xl: '0.9rem',
    '2xl': '1.2rem',
  },
  shadows: {
    card: { default: 'sm', _dark: 'sm' },
  },
} as const;


