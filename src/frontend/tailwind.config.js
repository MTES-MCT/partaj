// We don't want to rely on NODE_ENV to determine the build to generate.
// Instead, parse command line args and use a "production" flag to determine whether to enable purge.
const argv = require('minimist')(process.argv.slice(2));

module.exports = {
  future: {
    removeDeprecatedGapUtilities: true,
    purgeLayersByDefault: true,
  },
  purge: {
    content: ['../backend/**/*.html', './**/*.tsx'],
    enabled: argv.production || false,
  },
  theme: {
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
      default: '0.5rem',
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
      success700: theme('colors.success.700'),
      primary1000: theme('colors.primary.1000'),
      danger500: theme('colors.danger.500'),
      danger700: theme('colors.danger.700'),
      white: theme('colors.white'),
      black: theme('colors.black'),
      gray300: theme('colors.gray.300'),
      gray500: theme('colors.gray.500'),
    }),
    colors: {
      black: '#000000',
      selectHover: '#E9EDF1',
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
        500: '#535F77',
        600: '#2E3A59',
        700: '#222B45',
        800: '#192038',
        900: '#151A30',
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
      purple: {
        100: '#F9F9FF',
        200: '#EEEEFF',
        300: '#E3E3FF',
        400: '#abacff',
        500: '#8282FF',
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
      success: {
        100: '#F0FFF5',
        200: '#CCFCE3',
        300: '#8CFAC7',
        400: '#2CE59B',
        500: '#00D68F',
        600: '#00B887',
        700: '#00997A',
        800: '#007D6C',
        900: '#004A45',
      },
      'success-transparent': {
        '8p': 'rgba(0, 214, 143, 0.08)',
        '16p': 'rgba(0, 214, 143, 0.16)',
        '24p': 'rgba(0, 214, 143, 0.24)',
        '32p': 'rgba(0, 214, 143, 0.32)',
        '40p': 'rgba(0, 214, 143, 0.40)',
        '48p': 'rgba(0, 214, 143, 0.48)',
      },
      transparent: 'transparent',
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
      'warning-transparent': {
        '8p': 'rgba(255, 170, 0, 0.08)',
        '16p': 'rgba(255, 170, 0, 0.16)',
        '24p': 'rgba(255, 170, 0, 0.24)',
        '32p': 'rgba(255, 170, 0, 0.32)',
        '40p': 'rgba(255, 170, 0, 0.40)',
        '48p': 'rgba(255, 170, 0, 0.48)',
      },
      white: '#FFFFFF',
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
      },
      width: {
        352: '22rem',
      },
      left: {
        '-256': '-256px',
        256: '256px',
      },
      maxHeight: {
        160: '40rem',
        '4/5': '80%',
        '9/10': '90%',
      },
      minHeight: {
        20: '5rem',
        210: '13.125rem',
      },
      minWidth: {
        240: '15rem',
        304: '19rem',
      },
      maxWidth: {
        384: '24rem',
        480: '30rem',
        512: '32rem',
        800: '50rem',
        960: '60rem',
      },
    },
  },
};
