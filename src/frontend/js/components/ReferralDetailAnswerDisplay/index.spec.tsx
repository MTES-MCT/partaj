import { render, screen } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { Answer, Referral, ReferralState } from 'types';
import { AnswerFactory, ReferralFactory } from 'utils/test/factories';
import { ReferralDetailAnswerDisplay } from '.';

describe('<ReferralDetailAnswerDisplay />', () => {
  it('shows the answer to the referral', () => {
    // Create a referral and force a unit member's name
    const referral: Referral = ReferralFactory.generate();
    referral.topic.unit.members[0].first_name = 'Wang';
    referral.topic.unit.members[0].last_name = 'Miao';
    // Add an answer authored by our chosen unit member
    const answer: Answer = AnswerFactory.generate();
    answer.created_by = referral.topic.unit.members[0].id;
    answer.content = 'The answer content';

    render(
      <IntlProvider locale="en">
        <ReferralDetailAnswerDisplay
          referral={{
            ...referral,
            answers: [answer],
            state: ReferralState.ANSWERED,
          }}
        />
      </IntlProvider>,
    );

    screen.getByRole('region', { name: 'Referral answer' });
    screen.getByText(`By Wang Miao, ${referral.topic.unit.name}`);
    screen.getByText('The answer content');
  });
});
