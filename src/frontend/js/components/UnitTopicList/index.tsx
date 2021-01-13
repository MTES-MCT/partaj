import React from 'react';
import { defineMessages, FormattedDate, FormattedMessage } from 'react-intl';
import { QueryStatus } from 'react-query';

import { Spinner } from 'components/Spinner';
import { useTopics } from 'data';
import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Topic, Unit } from 'types';

const messages = defineMessages({
  createdAt: {
    defaultMessage: 'Created at',
    description:
      'Title for the column for the creation date for topics in a list of topics.',
    id: 'components.UnitTopicList.createdAt',
  },
  loading: {
    defaultMessage: 'Loading unit topics...',
    description:
      'Accessibility message for the spinner in the unit topic list.',
    id: 'components.UnitTopicList.loading',
  },
  name: {
    defaultMessage: 'Name',
    description:
      'Title for the column for the names of topics in a list of topics.',
    id: 'components.UnitTopicList.name',
  },
  title: {
    defaultMessage: 'Topics',
    description: 'Title for the list of topics for a given unit.',
    id: 'components.UnitTopicList.title',
  },
});

interface UnitTopicListProps {
  unit: Unit['id'];
}

const getDepthClass: (topic: Topic) => string = (topic) => {
  const depth = topic.path.length / 4;
  switch (depth) {
    case 0:
    case 1:
      return '';

    case 2:
      return 'pl-6';

    case 3:
      return 'pl-10';

    default:
      return 'pl-14';
  }
};

export const UnitTopicList: React.FC<UnitTopicListProps> = ({ unit }) => {
  const { data, status } = useTopics({ unit });

  switch (status) {
    case QueryStatus.Idle:
    case QueryStatus.Loading:
      return (
        <Spinner size="large">
          <FormattedMessage {...messages.loading} />
        </Spinner>
      );

    case QueryStatus.Error:
      return <GenericErrorMessage />;

    case QueryStatus.Success:
      return (
        <div>
          <h3 className="text-2xl mb-2">
            <FormattedMessage {...messages.title} />
          </h3>
          <div
            className="border-2 border-gray-200 rounded-sm inline-block"
            style={{ width: '60rem' }}
          >
            <table className="min-w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th scope="col" className="p-3">
                    <FormattedMessage {...messages.name} />
                  </th>
                  <th scope="col" className="p-3">
                    <FormattedMessage {...messages.createdAt} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {data!.results.map((topic, index) => (
                  <tr
                    key={topic.id}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}
                  >
                    <th
                      scope="row"
                      className={`font-normal ${getDepthClass(topic)}`}
                    >
                      {topic.name}
                    </th>
                    <td>
                      <FormattedDate
                        year="numeric"
                        month="long"
                        day="numeric"
                        value={topic.created_at}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
  }
};
