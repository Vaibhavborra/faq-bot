import { createTheme } from '@aws-amplify/ui-react'

/** Amplify UI theme: forest greens, warm sand and an ember accent. */
export const theme = createTheme({
  name: 'trailhead',
  tokens: {
    colors: {
      brand: {
        primary: {
          10: '#eef4ef', 20: '#d7e6da', 40: '#9fc1a7', 60: '#4f7d5f',
          80: '#2f5d46', 90: '#24493a', 100: '#1b3a2b',
        },
        secondary: {
          10: '#fdf3e8', 20: '#fbe9d6', 40: '#f2c08c', 60: '#e59b4c',
          80: '#d9822b', 90: '#c4711f', 100: '#9a5414',
        },
      },
      background: { primary: '#fffdf8', secondary: '#f6f2e9', tertiary: '#ece5d6' },
      font: { primary: '#1f2a24', secondary: '#66705f', tertiary: '#8a8a7d' },
      border: { primary: '#e2dccd', secondary: '#ece5d6' },
    },
    fonts: {
      default: {
        variable: { value: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif' },
        static: { value: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif' },
      },
    },
    radii: { small: '8px', medium: '12px', large: '18px', xl: '24px' },
    components: {
      button: {
        borderRadius: { value: '999px' },
        fontWeight: { value: '600' },
        primary: {
          backgroundColor: { value: '{colors.brand.primary.80}' },
          _hover: { backgroundColor: { value: '{colors.brand.primary.100}' } },
          _focus: { backgroundColor: { value: '{colors.brand.primary.100}' } },
          _active: { backgroundColor: { value: '{colors.brand.primary.100}' } },
        },
      },
      card: {
        backgroundColor: { value: '{colors.background.primary}' },
        borderRadius: { value: '{radii.large}' },
        outlined: { borderColor: { value: '{colors.border.primary}' } },
      },
      fieldcontrol: {
        borderRadius: { value: '12px' },
        _focus: { borderColor: { value: '{colors.brand.primary.60}' } },
      },
      tabs: {
        item: {
          _active: { color: { value: '{colors.brand.primary.80}' }, borderColor: { value: '{colors.brand.primary.80}' } },
          _hover: { color: { value: '{colors.brand.primary.60}' } },
        },
      },
      authenticator: {
        router: {
          borderWidth: { value: '1px' },
          borderColor: { value: '{colors.border.primary}' },
          boxShadow: { value: '0 1px 2px rgba(27,58,43,.06), 0 18px 40px -16px rgba(27,58,43,.28)' },
        },
      },
    },
  },
})
