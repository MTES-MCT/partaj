import React from 'react';
import { defineMessages, FormattedDate, FormattedMessage } from 'react-intl';
import { QueryStatus } from 'react-query';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Spinner } from 'components/Spinner';
import { useUnitMemberships } from 'data';
import { Unit } from 'types';
import { getUserFullname } from 'utils/user';
import { humanMemberRoles } from 'utils/unit';

const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading unit members...',
    description:
      'Accessible message for the spinner while loading the unit members.',
    id: 'components.UnitMemberList.loading',
  },
  memberSince: {
    defaultMessage: 'Member since',
    description:
      'Title for the column for the creation date for the membership for a user in a list of unit members.',
    id: 'components.UnitMemberList.memberSince',
  },
  name: {
    defaultMessage: 'Name',
    description:
      'Title for the column for the names of members in a list of unit members.',
    id: 'components.UnitMemberList.name',
  },
  role: {
    defaultMessage: 'Role',
    description:
      'Title for the column for the roles of members in a list of unit members.',
    id: 'components.UnitMemberList.role',
  },
  title: {
    defaultMessage: 'Members',
    description: 'Title for the list of members for a given unit.',
    id: 'components.UnitMemberList.title',
  },
});

interface UnitMemberListProps {
  unit: Unit['id'];
}

export const UnitMemberList: React.FC<UnitMemberListProps> = ({ unit }) => {
  const { data, status } = useUnitMemberships({ unit });

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
                    <FormattedMessage {...messages.role} />
                  </th>
                  <th scope="col" className="p-3">
                    <FormattedMessage {...messages.memberSince} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {data!.results.map((membership, index) => (
                  <tr
                    key={membership.id}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}
                  >
                    <th scope="row" className="font-normal">
                      {getUserFullname(membership.user)}
                    </th>
                    <td>
                      <FormattedMessage
                        {...humanMemberRoles[membership.role]}
                      />
                    </td>
                    <td>
                      <FormattedDate
                        year="numeric"
                        month="long"
                        day="numeric"
                        value={membership.created_at}
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
