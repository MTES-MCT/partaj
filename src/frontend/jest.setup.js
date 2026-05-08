import '@testing-library/jest-dom';
import { act } from '@testing-library/react';
import { notifyManager } from 'react-query';

// react-query@3 schedules subscriber notifications via a microtask that
// fires after user-event@14's act() boundary has closed. Under React 18
// this triggers "not wrapped in act()" warnings and lets React defer the
// update past `waitFor`'s timeout on slow CI workers. Routing every
// notification through act() puts the resulting render back inside a
// proper test boundary so it flushes deterministically.
notifyManager.setNotifyFunction((cb) => {
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
