import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { useClickOutside } from '.';
import { Nullable } from 'types/utils';

describe('useClickOutside', () => {
  const TestComponent = ({ handler }: { handler: Function }) => {
    const { ref } = useClickOutside({ onClick: handler });
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

  it('calls the latest handler (make sure the stale closure problem is handled)', () => {
    const oldHandler = jest.fn();
    const newHandler = jest.fn();

    const { rerender } = render(
      <>
        <TestComponent handler={oldHandler} />
        <SiblingComponent />
      </>,
    );

    rerender(
      <>
        <TestComponent handler={newHandler} />
        <SiblingComponent />
      </>,
    );

    userEvent.click(screen.getByText('Sibling component'));
    expect(newHandler).toHaveBeenCalled();
    expect(oldHandler).not.toHaveBeenCalled();
  });
});
