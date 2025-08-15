// API-agnóstica (v2/v3): usar objetos simples ao invés de helpers
// Button base
const ButtonBase = {
  rounded: 'xl',
  fontWeight: '600',
  _focusVisible: { boxShadow: '0 0 0 2px var(--chakra-colors-ring)' },
} as const;

export const Button = {
  baseStyle: ButtonBase,
  variants: {
    solid: {
      bg: 'brand.600',
      color: 'white',
      _hover: { bg: 'brand.700' },
      _active: { bg: 'brand.700' },
    },
    subtle: {
      bg: 'bg.muted',
      color: 'text.primary',
      _hover: { bg: 'gray.200', _dark: { bg: 'gray.600' } },
    },
  },
  defaultProps: { variant: 'solid', size: 'md' },
} as const;

// Input + Select + Textarea
const fieldBase = {
  field: {
    bg: 'bg.surface',
    borderColor: 'border',
    _placeholder: { color: 'text.muted' },
    _focusVisible: {
      borderColor: 'ring',
      boxShadow: '0 0 0 1px var(--chakra-colors-ring)',
    },
  },
};

export const Input = { variants: { outline: fieldBase }, defaultProps: { variant: 'outline' } } as const;
export const Select = { variants: { outline: fieldBase }, defaultProps: { variant: 'outline' } } as const;
export const Textarea = { variants: { outline: fieldBase }, defaultProps: { variant: 'outline' } } as const;

// Card
export const Card = {
  baseStyle: {
    container: {
      bg: 'bg.surface',
      color: 'text.primary',
      rounded: '2xl',
      shadow: 'card',
      borderWidth: '1px',
      borderColor: 'border',
    },
  },
} as const;


