import { defineMessages } from '@formatjs/intl';
import React from 'react';
import { FormattedMessage } from 'react-intl';

const messages = defineMessages({
  title: {
    defaultMessage: 'Metrics',
    description: 'Title for the metrics view.',
    id: 'components.Metrics.title',
  },
});

export const Metrics = () => {
  return (
    <section className="container mx-auto flex-grow flex flex-col">
      <h1 className=" float-left text-4xl my-4">
        <FormattedMessage {...messages.title} />
      </h1>
      <iframe
        src="https://metabase.partaj.incubateur.net/public/dashboard/4eea24ec-acb1-4dec-a283-e74377d8faae"
        frameBorder="0"
        width="1000"
        height="2300"
        allowTransparency
      ></iframe>
    </section>
  );
};
