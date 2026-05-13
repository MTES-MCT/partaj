import '@testing-library/jest-dom';

// CI workers run ~16x slower than dev machines. The default 5s per-test
// budget gets eaten by accumulated userEvent delays, tanstack notification
// microtasks and waitFor polling on slow hardware, even for tests that take
// under a second locally. 30s leaves plenty of headroom without masking a
// genuinely stuck test.
jest.setTimeout(30000);

window.__partaj_frontend_context__ = {
  assets: {
    icons: '/to/icons/sprite.svg',
  },
  csrftoken: 'the csrf token',
  environment: 'TEST',
  sentry_dsn: 'the://sentry-dsn',
  contact_email: 'test@example.com',
  token: 'the bearer token',
};
