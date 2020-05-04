import get from 'lodash-es/get';
import startCase from 'lodash-es/startCase';
import React from 'react';
import ReactDOM from 'react-dom';

import { ReferralDetailAnswer } from 'components/ReferralDetailAnswer';
import { ReferralDetailAssignment } from 'components/ReferralDetailAssignment';

// Create a component map that we'll use below to access our component classes
const componentLibrary = {
  ReferralDetailAnswer,
  ReferralDetailAssignment,
};

interface RootProps {
  partajReactSpots: Element[];
}

export const Root = ({ partajReactSpots }: RootProps) => {
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
        props.context = (window as any).__partaj_frontend_context__;
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

  return <React.Fragment>{portals}</React.Fragment>;
};
