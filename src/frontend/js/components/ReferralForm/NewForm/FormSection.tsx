import React from 'react';

export const FormSection: React.FC<React.PropsWithChildren<{
  hasError: boolean;
}>> = ({ children, hasError }) => {
  return (
    <section
      className={`relative space-y-2 ${hasError ? 'dsfr-section-error' : ''}`}
    >
      {children}
    </section>
  );
};
