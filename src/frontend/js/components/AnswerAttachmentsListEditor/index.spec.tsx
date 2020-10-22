import * as Sentry from '@sentry/react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { ReferralAnswerAttachment } from 'types';
import { Deferred } from 'utils/test/Deferred';
import { ReferralAnswerAttachmentFactory } from 'utils/test/factories';
import { AnswerAttachmentsListEditor } from '.';

jest.mock('@sentry/react', () => ({
  captureException: jest.fn(),
}));

describe('<AnswerAttachmentsListEditor />', () => {
  const context = {
    assets: { icons: '/example/icons.svg' },
    csrftoken: 'the csrf token',
    environment: 'test',
    sentry_dsn: 'https://sentry.dsn/0',
    token: 'the auth token',
  };

  afterEach(() => fetchMock.restore());

  it('shows the list of attachments it is passed, and a button to remove each attachment from the answer', async () => {
    const answerId = '4b6a9db1-f5b0-41d6-90ee-71457ee995be';
    const attachments: ReferralAnswerAttachment[] = ReferralAnswerAttachmentFactory.generate(
      2,
    );
    // Manually set attachments sizes so we can check them in the list
    attachments[0].size = 95338;
    attachments[1].size = 64256;

    const deferred = new Deferred();
    fetchMock.post(
      `/api/referralanswers/${answerId}/remove_attachment/`,
      deferred.promise,
    );

    render(
      <IntlProvider locale="en">
        <label id="the-label-id">Label text</label>
        <AnswerAttachmentsListEditor
          {...{ answerId, attachments, context, labelId: 'the-label-id' }}
        />
      </IntlProvider>,
    );

    screen.getByRole('group', { name: 'Label text' });
    screen.getByText(`${attachments[0].name_with_extension} — 93.1 KB`);
    screen.getByText(`${attachments[1].name_with_extension} — 62.75 KB`);

    const deleteAttn1Btn = screen.getByRole('button', {
      name: `Remove ${attachments[0].name_with_extension}`,
    });
    screen.getByRole('button', {
      name: `Remove ${attachments[1].name_with_extension}`,
    });

    userEvent.click(deleteAttn1Btn);
    expect(deleteAttn1Btn).toHaveAttribute('aria-busy', 'true');
    expect(deleteAttn1Btn).toHaveAttribute('aria-disabled', 'true');
    expect(deleteAttn1Btn).toContainHTML('spinner');
    expect(
      fetchMock.calls(`/api/referralanswers/${answerId}/remove_attachment/`, {
        body: { attachment: attachments[0].id },
        headers: { Authorization: 'Token the auth token' },
        method: 'POST',
      }).length,
    ).toEqual(1);

    await act(async () => deferred.resolve({}));
    expect(deleteAttn1Btn).toHaveAttribute('aria-busy', 'false');
    expect(deleteAttn1Btn).toHaveAttribute('aria-disabled', 'false');
    expect(deleteAttn1Btn).not.toContainHTML('spinner');
  });

  it('reports the error when it fails to remove the attachment', async () => {
    const answerId = '4b6a9db1-f5b0-41d6-90ee-71457ee995be';
    const attachments: ReferralAnswerAttachment[] = ReferralAnswerAttachmentFactory.generate(
      2,
    );

    const deferred = new Deferred();
    fetchMock.post(
      `/api/referralanswers/${answerId}/remove_attachment/`,
      deferred.promise,
    );

    render(
      <IntlProvider locale="en">
        <label id="the-label-id">Label text</label>
        <AnswerAttachmentsListEditor
          {...{ answerId, attachments, context, labelId: 'the-label-id' }}
        />
      </IntlProvider>,
    );

    const button = screen.getByRole('button', {
      name: `Remove ${attachments[0].name_with_extension}`,
    });

    userEvent.click(button);
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toContainHTML('spinner');
    expect(
      fetchMock.calls(`/api/referralanswers/${answerId}/remove_attachment/`, {
        body: { attachment: attachments[0].id },
        headers: { Authorization: 'Token the auth token' },
        method: 'POST',
      }).length,
    ).toEqual(1);

    await act(async () => deferred.resolve(400));
    expect(button).toHaveAttribute('aria-busy', 'false');
    expect(button).toHaveAttribute('aria-disabled', 'false');
    expect(button).not.toContainHTML('spinner');
    expect(Sentry.captureException).toHaveBeenCalledWith(
      new Error(
        `Failed to get remove attachment ${attachments[0].id} from ${answerId} in <AnswerAttachmentsListEditor />.`,
      ),
    );
  });
});
