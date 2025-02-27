import React from 'react';
import { defineMessages, FormattedDate, FormattedMessage } from 'react-intl';

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
    case 'error':
      return <GenericErrorMessage />;

    case 'idle':
    case 'loading':
      return (
        <Spinner size="large">
          <FormattedMessage {...messages.loading} />
        </Spinner>
      );

    case 'success':
      return (
        <>
          {data!.results.length > 0 ? (
            <table className="referral-users-table">
              <thead>
                <tr>
                  <th>
                    <FormattedMessage {...messages.name} />
                  </th>
                  <th>
                    <FormattedMessage {...messages.role} />
                  </th>
                  <th>
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
                    <td>{getUserFullname(membership.user)}</td>
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
          ) : (
            <span>
              Il n y'a pas de thème configuré actuellement pour ce bureau, pour
              en ajouter veuillez contacter un administrateur
            </span>
          )}{' '}
        </>
      );
  }
};
