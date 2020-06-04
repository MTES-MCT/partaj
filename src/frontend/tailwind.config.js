// We don't want to rely on NODE_ENV to determine the build to generate.
// Instead, parse command line args and use a "production" flag to determine whether to enable purge.
var argv = require('minimist')(process.argv.slice(2));

module.exports = {
  purge: {
    content: ['../backend/**/*.html', './**/*.tsx'],
    enabled: argv.production || false,
  },
  theme: {
    borderRadius: {
      none: '0',
      sm: '0.25rem',
      default: '0.5rem',
      md: '1rem',
      lg: '2rem',
      xl: '4rem',
      full: '9999px',
    },
  },
};
