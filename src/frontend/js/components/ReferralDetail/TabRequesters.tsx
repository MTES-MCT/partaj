import { defineMessages } from '@formatjs/intl';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import * as types from 'types';
import { getUserFullname } from 'utils/user';

const messages = defineMessages({
  listTitle: {
    defaultMessage: 'Users linked to this referral',
    description:
      'Title for the list of users linked to a referral as requesters.',
    id: 'components.ReferralDetail.TabRequesters.listTitle',
  },
});

interface TabRequestersProps {
  referral: types.Referral;
}

export const TabRequesters: React.FC<TabRequestersProps> = ({ referral }) => {
  return (
    <div className="max-w-xl space-y-8">
      <div className="space-y-4">
        <div className="font-semibold">
          <FormattedMessage {...messages.listTitle} />
        </div>
        <ul className="list-group">
          {referral.users.map((user) => (
            <li className="list-group-item block">
              <div className="flex flex-row space-x-32 items-center justify-between">
                <div>
                  <div>{getUserFullname(user)}</div>
                  <div className="text-gray-500">{user.unit_name}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
