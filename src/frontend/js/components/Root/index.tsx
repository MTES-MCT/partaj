import * as Sentry from '@sentry/react';
import get from 'lodash-es/get';
import startCase from 'lodash-es/startCase';
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

import { appData } from 'appData';
import { Dashboard } from 'components/Dashboard';
import { ReferralDetail } from 'components/ReferralDetail';
import { ReferralForm } from 'components/ReferralForm';
import { CurrentUserProvider } from 'data/useCurrentUser';

// Create a component map that we'll use below to access our component classes
const componentLibrary = {
  Dashboard,
  ReferralDetail,
  ReferralForm,
};

interface RootProps {
  partajReactSpots: Element[];
}

export const Root = ({ partajReactSpots }: RootProps) => {
  useEffect(() => {
    Sentry.init({ dsn: appData.sentry_dsn, environment: appData.environment });
  }, []);

  const portals = partajReactSpots.map((element: Element) => {
    // Generate a component name. It should be a key of the componentLibrary object / ComponentLibrary interface
    const componentName = startCase(
      get(element.className.match(/partaj-react--([a-zA-Z-]*)/), '[1]') || '',
    )
      .split(' ')
      .join('') as keyof typeof componentLibrary;
    // Get the component dynamically from the library of available components
    const Component = componentLibrary[componentName];
    // Sanity check: only attempt to render existing components
    if (Component) {
      // Get the incoming props to pass our component from the `data-props` attribute
      const dataProps = element.getAttribute('data-props');
      const props = dataProps ? JSON.parse(dataProps) : {};

      return ReactDOM.createPortal(<Component {...props} />, element);
    } else {
      // Emit a warning at runtime when we fail to find a matching component for an element that required one
      Sentry.captureException(
        new Error(
          `Failed to load React component: no such component in Library ${componentName}`,
        ),
      );
      return null;
    }
  });

  return (
    <Sentry.ErrorBoundary>
      <CurrentUserProvider>{portals}</CurrentUserProvider>
    </Sentry.ErrorBoundary>
  );
};
