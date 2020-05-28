import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { useClickOutside } from '.';
import { Nullable } from 'types/utils';

describe('useClickOutside', () => {
  const TestComponent = ({ handler }: { handler: Function }) => {
    const { ref } = useClickOutside(handler);
    return (
      <div ref={ref as React.MutableRefObject<Nullable<HTMLDivElement>>}>
        Test component
        <span>Nested test component</span>
      </div>
    );
  };

  const SiblingComponent = () => {
    return <div>Sibling component</div>;
  };

  it('calls the handler when there is a click in another part of the document', () => {
    const handler = jest.fn();
    render(
      <>
        <TestComponent handler={handler} />
        <SiblingComponent />
      </>,
    );
    expect(handler).not.toHaveBeenCalled();

    userEvent.click(screen.getByText('Test component'));
    expect(handler).not.toHaveBeenCalled();

    userEvent.click(screen.getByText('Nested test component'));
    expect(handler).not.toHaveBeenCalled();

    userEvent.click(screen.getByText('Sibling component'));
    expect(handler).toHaveBeenCalled();
  });
});
