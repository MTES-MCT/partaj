import get from 'lodash-es/get';
import startCase from 'lodash-es/startCase';
import React from 'react';
import ReactDOM from 'react-dom';

import { ReferralDetail } from 'components/ReferralDetail';
import { ReferralDetailAssignment } from 'components/ReferralDetailAssignment';
import { CurrentUserProvider } from 'data/useCurrentUser';
import { Context } from 'types/context';

// Create a component map that we'll use below to access our component classes
const componentLibrary = {
  ReferralDetail,
  ReferralDetailAssignment,
};

interface RootProps {
  partajReactSpots: Element[];
}

export const Root = ({ partajReactSpots }: RootProps) => {
  const context: Context = (window as any).__partaj_frontend_context__;

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

      // Add context to props if they do not already include it
      if (!props.context) {
        props.context = context;
      }

      return ReactDOM.createPortal(<Component {...props} />, element);
    } else {
      // Emit a warning at runtime when we fail to find a matching component for an element that required one
      console.warn(
        'Failed to load React component: no such component in Library ' +
          componentName,
      );
      return null;
    }
  });

  return <CurrentUserProvider context={context}>{portals}</CurrentUserProvider>;
};
