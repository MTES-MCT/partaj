/**
 * Interoperate with the outside world (aka Django)
 * ---
 * Detect elements in the current page that are expecting a React component to be started up. Find the relevant
 * one in our library and actually do render it in the appropriate element.
 */

// Currently, @babel/preset-env is unaware that using import() with Webpack relies on Promise internally.
// Environments which do not have builtin support for Promise, like Internet Explorer, will require both
// the promise and iterator polyfills be added manually.
import 'core-js/modules/es.array.iterator';
import 'core-js/modules/es.promise';

import React from 'react';
import ReactDOM from 'react-dom';
import { IntlProvider } from 'react-intl';

import { Root } from 'components/Root';
import { handle } from 'utils/errors';

// Wait for the DOM to load before we scour it for an element that requires React to be rendered
document.addEventListener('DOMContentLoaded', async (event) => {
  // Find all the elements that need React to render a component
  const partajReactSpots = Array.prototype.slice.call(
    document.querySelectorAll('.partaj-react'),
  );

  // Only move on with anything if there are actually components to render
  if (partajReactSpots.length) {
    // Determine the BCP47/RFC5646 locale to use
    const locale = document.querySelector('html')!.getAttribute('lang');

    if (!locale) {
      throw new Error(
        '<html> lang attribute is required to be set with a BCP47/RFC5646 locale.',
      );
    }

    // Polyfill outdated browsers who do not have Node.prototype.append
    if (
      !Element.prototype.hasOwnProperty('append') &&
      !Document.prototype.hasOwnProperty('append') &&
      !DocumentFragment.prototype.hasOwnProperty('append')
    ) {
      await import('mdn-polyfills/Node.prototype.append');
    }

    // Polyfill outdated browsers who do not have fetch
    if (typeof fetch === 'undefined') {
      await import('whatwg-fetch');
    }

    // Only load Intl polyfills & pre-built locale data for browsers that need it
    try {
      if (!Intl.PluralRules) {
        await import('intl-pluralrules');
      }
      // TODO: remove type assertion when typescript libs include RelativeTimeFormat
      if (!(Intl as any).RelativeTimeFormat) {
        await import('@formatjs/intl-relativetimeformat');
        // Polyfilled locale data is keyed by 2-letter language code
        let languageCode = locale;
        if (languageCode.match(/^.*_.*$/)) {
          languageCode = locale.split('_')[0];
        }
        // Get `react-intl`/`formatjs` lang specific parameters and data
        await import(
          `@formatjs/intl-relativetimeformat/locale-data/${languageCode}`
        );
      }
    } catch (e) {
      handle(e);
    }

    // Load our own strings for the given lang
    let translatedMessages: any = null;
    try {
      translatedMessages = await import(`./translations/${locale}.json`);
    } catch (e) {
      handle(e);
    }

    // Create a react root element we'll render into. Note that this is just used to anchor our React tree in an
    // arbitraty place since all our actual UI components will be rendered into their own containers through portals.
    const reactRoot = document.createElement('div');
    reactRoot.setAttribute('class', 'partaj-react partaj-react--root');
    document.body.append(reactRoot);

    // Render the tree inside a shared `IntlProvider` so all components are able to access translated strings.
    ReactDOM.render(
      <IntlProvider locale={locale} messages={translatedMessages}>
        <Root partajReactSpots={partajReactSpots} />
      </IntlProvider>,
      reactRoot,
    );
  }
});
