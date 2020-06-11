import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { ShowAnswerFormContext } from 'components/ReferralDetail';
import { Referral } from 'types';
import { ReferralFactory } from 'utils/test/factories';
import { getUserFullname } from 'utils/user';
import { ReferralDetailContent } from '.';

describe('<ReferralDetailContent />', () => {
  const context = {
    assets: { icons: '/example/icons.svg' },
    csrftoken: 'the csrf token',
    token: 'the auth token',
  };
  const setReferral = jest.fn();

  it('displays the referral content assignment info and a button to answer it', () => {
    const referral: Referral = ReferralFactory.generate();
    const setShowAnswerForm = jest.fn();
    render(
      <ShowAnswerFormContext.Provider
        value={{ showAnswerForm: false, setShowAnswerForm }}
      >
        <IntlProvider locale="en">
          <ReferralDetailContent {...{ context, referral, setReferral }} />
        </IntlProvider>
      </ShowAnswerFormContext.Provider>,
    );

    screen.getByRole('article', {
      name: `Referral #${referral.id}`,
    });

    screen.getByRole('heading', { name: 'Requester' });
    screen.getByText(`Official requester: ${referral.requester}`);
    screen.getByText(
      `As ${getUserFullname(referral.user)}, ${referral.user.unit_name}`,
    );
    screen.getByText(referral.user.email);
    screen.getByText(referral.user.phone_number);

    screen.getByRole('heading', { name: 'Referral topic' });
    screen.getByText(referral.topic.name);

    screen.getByRole('heading', { name: 'Referral question' });
    screen.getByText((element) =>
      element.startsWith(referral.question.substr(0, 20)),
    );

    screen.getByRole('heading', { name: 'Context' });
    screen.getByText((element) =>
      element.startsWith(referral.context.substr(0, 20)),
    );

    screen.getByRole('heading', { name: 'Prior work' });
    screen.getByText((element) =>
      element.startsWith(referral.prior_work.substr(0, 20)),
    );

    screen.getByRole('heading', { name: 'Expected response time' });
    screen.getByText(referral.urgency_human);

    screen.getByRole('heading', { name: 'Urgency explanation' });
    screen.getByText(referral.urgency_explanation);

    screen.getByRole('heading', { name: 'Attachments' });
    for (let attachment of referral.attachments) {
      screen.getByRole('link', {
        name: `${attachment.name_with_extension} — ${attachment.size_human}`,
      });
    }

    // Shows assignment information
    screen.getByText('No assignment yet');

    // Shows the answer form toggle
    const answerToggle = screen.getByRole('button', { name: 'Answer' });
    userEvent.click(answerToggle);
    expect(setShowAnswerForm).toHaveBeenCalledWith(true);
  });
});
