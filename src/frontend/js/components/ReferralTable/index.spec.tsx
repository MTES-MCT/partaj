import { render, screen } from '@testing-library/react';
import { DateTime } from 'luxon';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';

import { Referral } from 'types';
import * as factories from 'utils/test/factories';
import { ReferralTable } from '.';

describe('<ReferralTable />', () => {
  it('shows the list of referrals with the relevant data', () => {
    const referral1 = factories.ReferralFactory.generate();
    referral1.due_date = DateTime.local().plus({ days: 7 }).toString();
    const referral2 = factories.ReferralFactory.generate();
    referral2.due_date = DateTime.local().plus({ days: 10 }).toString();
    const referrals: Referral[] = [referral1, referral2];

    render(
      <IntlProvider locale="en">
        <MemoryRouter>
          <ReferralTable
            getReferralUrl={(referral) => `/ref-url/${referral.id}`}
            referrals={referrals}
          />
        </MemoryRouter>
      </IntlProvider>,
    );

    screen.getByRole('columnheader', { name: 'Due date' });
    screen.getByRole('columnheader', { name: 'Object' });
    screen.getByRole('columnheader', { name: 'Requester' });
    screen.getByRole('columnheader', { name: 'Assignment(s)' });
    screen.getByRole('columnheader', { name: 'Status' });

    for (let referral of [referral1, referral2]) {
      screen.getByRole('rowheader', { name: referral.object });
      const link = screen.getByRole('link', { name: referral.object });
      expect(link.getAttribute('href')).toEqual(`/ref-url/${referral.id}`);
      screen.getByRole('cell', {
        name: DateTime.fromISO(referral.due_date).toLocaleString(
          DateTime.DATE_FULL,
        ),
      });
    }
  });
});
