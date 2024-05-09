/** @type {import('tailwindcss').Config} */
module.exports = {
  important: true,
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/assets/icons/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    colors: {
      neutral: {
        10: 'rgb(var(--color-neutral-10) / <alpha-value>)',
        40: 'rgb(var(--color-neutral-40) / <alpha-value>)',
        50: 'rgb(var(--color-neutral-50) / <alpha-value>)',
        60: 'rgb(var(--color-neutral-60) / <alpha-value>)',
        70: 'rgb(var(--color-neutral-70) / <alpha-value>)',
        80: 'rgb(var(--color-neutral-80) / <alpha-value>)',
        90: 'rgb(var(--color-neutral-90) / <alpha-value>)',
        100: 'rgb(var(--color-neutral-100) / <alpha-value>)',
      },
      primary: {
        DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
        light: 'rgb(var(--color-primary) / 0.25)',
      },
      danger: {
        DEFAULT: 'rgb(var(--color-danger) / <alpha-value>)',
        light: 'rgb(var(--color-danger) / 0.5)',
      },
      warning: {
        DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)',
        light: 'rgb(var(--color-warning) / 0.5)',
      },
      success: {
        DEFAULT: 'rgb(var(--color-success) / <alpha-value>)',
        light: 'rgb(var(--color-success) / 0.5)',
      },
      info: {
        DEFAULT: 'rgb(var(--color-info) / <alpha-value>)',
        light: 'rgb(var(--color-info) / 0.5)',
      },
    },
    fontSize: {
      xs: ['.75rem', '16px'],
      sm: ['0.875rem', '16px'],
      base: ['1rem', '24px'],
      lg: ['1.125rem', '26px'],
      xl: ['1.25rem', '24px'],
      '2xl': ['1.5rem', '28px'],
      '3xl': ['2rem', '36px'],
      '4xl': ['3rem', '52px'],
      '5xl': ['3.5rem', '64px'],
    },
    extend: {},
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
}
