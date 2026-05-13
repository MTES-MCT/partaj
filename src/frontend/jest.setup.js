import '@testing-library/jest-dom';
import { act } from '@testing-library/react';
import { notifyManager } from '@tanstack/react-query';

// React 18: opt every render into the act() machinery so state updates that
// resolve outside an explicit act() boundary (e.g. tanstack-query's
// microtask-scheduled notifications) are still flushed deterministically
// instead of being deferred past `waitFor`'s timeout on slow CI workers.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// @tanstack/react-query schedules subscriber notifications via a microtask
// that fires after user-event@14's act() boundary has closed. Wrapping both
// the per-callback notify function AND the batch notify function in act()
// keeps the whole flush — outer batch + individual rerenders — inside a
// proper test boundary, removing the "not wrapped in act()" warning and the
// CI-only flake where `mutation.isLoading=true` never reached the DOM in time.
notifyManager.setNotifyFunction((cb) => {
  act(() => cb());
});
notifyManager.setBatchNotifyFunction((cb) => {
  act(() => cb());
});

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
