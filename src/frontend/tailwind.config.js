// We don't want to rely on NODE_ENV to determine the build to generate.
// Instead, parse command line args and use a "production" flag to determine whether to enable purge.
const argv = require('minimist')(process.argv.slice(2));

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['../backend/**/*.html', './**/*.tsx'],
  safelist: [
    'bg-caution-100',
    'bg-warning-100',
    'bg-success-100',
    'bg-grey-100',
    'bg-orange-100',
    'bg-mallow-100',
    'bg-lightblue-100',
    'bg-primary-100',
    'bg-success-100',
    'bg-caution-400',
    'bg-warning-400',
    'bg-success-400',
    'bg-grey-400',
    'bg-orange-400',
    'bg-danger-400',
    'bg-mallow-400',
    'bg-lightblue-400',
    'bg-primary-400',
    'bg-success-400',
    'bg-grey-1000',
  ],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    inset: {
      0: 0,
      auto: 'auto',
      2: '0.5rem',
      1: '0.25rem',
      '1/2': '50%',
    },
    fontSize: {
      xs: '12px',
      s: '13px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
      '5xl': '48px',
      '6xl': '64px',
      '7xl': '80px',
    },
    zIndex: {
      10: 10,
      19: 19,
      20: 20,
      30: 30,
      40: 40,
      50: 50,
    },
    borderRadius: {
      none: '0',
      sm: '0.25rem',
      DEFAULT: '0.5rem',
      md: '1rem',
      lg: '2rem',
      xl: '4rem',
      full: '9999px',
    },
    // Please add also the color fill into IconColor from Icons.tsx
    fill: (theme) => ({
      current: 'currentColor',
      primary100: theme('colors.primary.100'),
      primary200: theme('colors.primary.200'),
      primary400: theme('colors.primary.400'),
      primary500: theme('colors.primary.500'),
      primary1000: theme('colors.primary.1000'),
      success600: theme('colors.success.600'),
      danger400: theme('colors.danger.400'),
      danger500: theme('colors.danger.500'),
      danger600: theme('colors.danger.600'),
      danger700: theme('colors.danger.700'),
      danger1000: theme('colors.danger.1000'),
      grey400: theme('colors.grey.400'),
      white: theme('colors.white'),
      black: theme('colors.black'),
      gray300: theme('colors.gray.300'),
      gray450: theme('colors.gray.450'),
      gray475: theme('colors.gray.475'),
      gray500: theme('colors.gray.500'),
      warning500: theme('colors.warning.500'),
    }),
    colors: {
      current: 'currentColor',
      black: '#000000',
      white: '#FFFFFF',
      danger: {
        100: '#FFF2F2',
        200: '#FFD6D9',
        300: '#FFA8B4',
        400: '#FF708D',
        500: '#FF3D71',
        600: '#DB2C66',
        700: '#B81D5B',
        800: '#94124E',
        900: '#700940',
        1000: '#FF0000',
      },
      'danger-transparent': {
        '8p': 'rgba(255, 61, 113, 0.08)',
        '16p': 'rgba(255, 61, 113, 0.16)',
        '24p': 'rgba(255, 61, 113, 0.24)',
        '32p': 'rgba(255, 61, 113, 0.32)',
        '40p': 'rgba(255, 61, 113, 0.40)',
        '48p': 'rgba(255, 61, 113, 0.48)',
      },
      info: {
        100: '#F2F8FF',
        150: '#DDEFFF',
        200: '#C7E2FF',
        300: '#94CBFF',
        400: '#42AAFF',
        500: '#0095FF',
        600: '#006FD6',
        700: '#0057C2',
        800: '#0041A8',
        900: '#002885',
      },
      'info-transparent': {
        '8p': 'rgba(0, 149, 255, 0.08)',
        '16p': 'rgba(0, 149, 255, 0.16)',
        '24p': 'rgba(0, 149, 255, 0.24)',
        '32p': 'rgba(0, 149, 255, 0.32)',
        '40p': 'rgba(0, 149, 255, 0.40)',
        '48p': 'rgba(0, 149, 255, 0.48)',
      },
      gray: {
        100: '#F8F9FB',
        200: '#E9EDF1',
        300: '#D0D5DE',
        400: '#A7B0C2',
        450: '#677694',
        475: '#5d6a85',
        500: '#535F77',
        600: '#2E3A59',
        700: '#222B45',
        800: '#192038',
        900: '#151A30',
      },
      grey: {
        100: '#EBEBEB',
        200: '#c6c6c6',
        400: '#A8A8A8',
        500: '#8a8a8a',
        1000: '#000',
      },
      'gray-transparent': {
        '8p': 'rgba(143, 155, 179, 0.08)',
        '16p': 'rgba(143, 155, 179, 0.16)',
        '24p': 'rgba(143, 155, 179, 0.24)',
        '32p': 'rgba(143, 155, 179, 0.32)',
        '40p': 'rgba(143, 155, 179, 0.40)',
        '48p': 'rgba(143, 155, 179, 0.48)',
        '70p': 'rgba(143, 155, 179, 0.80)',
      },
      primary: {
        50: '#ECECF4',
        100: '#CCD1FB',
        200: '#939EF7',
        300: '#7887FB',
        400: '#5D6CED',
        500: '#020EC9',
        600: '#000BAD',
        700: '#000790',
        800: '#000575',
        900: '#00025F',
        1000: '#000050',
      },
      mallow: {
        100: '#f4dcff',
        400: '#BF5DED',
      },
      lightblue: {
        100: '#d4faff',
        400: '#45CCDE',
      },
      orange: {
        100: '#F9DED2',
        400: '#FF9B70',
      },
      purple: {
        100: '#F9F9FF',
        200: '#EEEEFF',
        300: '#E3E3FF',
        400: '#abacff',
        500: '#8282FF',
        550: '#6060A0',
        600: '#3D3DAB',
      },
      'primary-transparent': {
        '8p': 'rgba(3, 15, 202, 0.08)',
        '16p': 'rgba(3, 15, 202, 0.16)',
        '24p': 'rgba(3, 15, 202, 0.24)',
        '32p': 'rgba(3, 15, 202, 0.32)',
        '40p': 'rgba(3, 15, 202, 0.40)',
        '48p': 'rgba(3, 15, 202, 0.48)',
      },
      badge: {
        draft: '#000000',
        received: '#d8dffc',
        assigned: '#f4d9f9',
        processing: '#dbcbff',
        answered: '#cbf79d',
        closed: '#ffb3c0',
        incomplete: '#ffda70',
        invalidation: '#c7ffe6',
      },
      success: {
        100: '#dffee6',
        110: '#8afcab',
        120: '#4efb8d',
        200: '#b8fec9',
        210: '#46fd89',
        220: '#34eb7b',
        300: '#88fdaa',
        310: '#3ee87e',
        320: '#36d070',
        400: '#3bea7e',
        410: '#2cb862',
        420: '#259e53',
        500: '#1f8d49',
        510: '#2ec166',
        520: '#36db75',
        600: '#18753c',
        610: '#27a959',
        620: '#2fc368',
      },
      transparent: 'transparent',
      gold: {
        100: '#fff1c2',
        600: '#a98400',
      },
      warning: {
        100: '#FFFDF2',
        200: '#FFF1C2',
        300: '#FFE59E',
        400: '#FFC94D',
        500: '#FFAA00',
        600: '#DB8B00',
        700: '#B86E00',
        800: '#945400',
        900: '#703C00',
      },
      caution: {
        100: '#ffe5f1',
        200: '#fac7de',
        300: '#fcb4d4',
        400: '#ff9cc8',
        500: '#ff84b9',
        600: '#ff6cab',
        700: '#fc529b',
        800: '#f63789',
        900: '#ff2382',
      },
      'warning-transparent': {
        '8p': 'rgba(255, 170, 0, 0.08)',
        '16p': 'rgba(255, 170, 0, 0.16)',
        '24p': 'rgba(255, 170, 0, 0.24)',
        '32p': 'rgba(255, 170, 0, 0.32)',
        '40p': 'rgba(255, 170, 0, 0.40)',
        '48p': 'rgba(255, 170, 0, 0.48)',
      },
      'white-transparent': {
        '8p': 'rgba(255, 255, 255, 0.08)',
        '16p': 'rgba(255, 255, 255, 0.16)',
        '24p': 'rgba(255, 255, 255, 0.24)',
        '32p': 'rgba(255, 255, 255, 0.32)',
        '40p': 'rgba(255, 255, 255, 0.40)',
        '48p': 'rgba(255, 255, 255, 0.48)',
      },
    },
    extend: {
      inset: {
        38: '38px',
      },
      height: {
        160: '40rem',
        560: '35rem',
        '9/10': '90%',
      },
      width: {
        352: '22rem',
        400: '24rem',
        fit: 'fit-content',
      },
      left: {
        '-256': '-256px',
        256: '256px',
      },
      maxHeight: {
        160: '40rem',
        640: '80rem',
        224: '14rem',
        '4/5': '80%',
        '9/10': '90%',
      },
      minHeight: {
        20: '5rem',
        28: '1.75rem',
        210: '13.125rem',
      },
      minWidth: {
        32: '8rem',
        240: '15rem',
        304: '19rem',
        640: '40rem',
      },
      maxWidth: {
        '1/1': '100%',
        128: '8rem,',
        240: '15rem',
        320: '20rem',
        384: '24rem',
        480: '30rem',
        512: '32rem',
        640: '40rem',
        800: '50rem',
        960: '60rem',
      },
    },
  },
};
