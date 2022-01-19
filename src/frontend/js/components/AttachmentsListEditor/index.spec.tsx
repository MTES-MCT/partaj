import * as Sentry from '@sentry/react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';

import { Attachment } from 'types';
import { Deferred } from 'utils/test/Deferred';
import { AttachmentFactory } from 'utils/test/factories';
import { AttachmentsListEditor } from '.';

jest.mock('@sentry/react', () => ({
  captureException: jest.fn(),
}));

describe('<AttachmentsListEditor />', () => {
  afterEach(() => fetchMock.restore());

  it('shows the list of attachments it is passed, and a button to remove each attachment', async () => {
    const queryClient = new QueryClient();
    const ObjetAttachmentId = '1';
    const attachments: Attachment[] = AttachmentFactory.generate(2);

    // Manually set attachments sizes so we can check them in the list
    attachments[0].size = 95338;
    attachments[1].size = 64256;
    const objectName = 'referrals';

    const deferred = new Deferred();
    fetchMock.post(
      `/api/${objectName}/${ObjetAttachmentId}/remove_attachment/`,
      deferred.promise,
    );

    render(
      <IntlProvider locale="en">
        <QueryClientProvider client={queryClient}>
          <label id="the-label-id">Label text</label>
          <AttachmentsListEditor
            {...{
              ObjetAttachmentId,
              attachments,
              labelId: 'the-label-id',
              objectName,
            }}
          />
        </QueryClientProvider>
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
      fetchMock.calls(
        `/api/${objectName}/${ObjetAttachmentId}/remove_attachment/`,
        {
          body: { attachment: attachments[0].id },
          headers: { Authorization: 'Token the bearer token' },
          method: 'POST',
        },
      ).length,
    ).toEqual(1);

    await act(async () => deferred.resolve({}));
    expect(deleteAttn1Btn).toHaveAttribute('aria-busy', 'false');
    expect(deleteAttn1Btn).toHaveAttribute('aria-disabled', 'false');
    expect(deleteAttn1Btn).not.toContainHTML('spinner');
  });

  it('reports the error when it fails to remove the attachment', async () => {
    const queryClient = new QueryClient();
    const ObjetAttachmentId = '1';
    const attachments: Attachment[] = AttachmentFactory.generate(2);
    const objectName = 'referrals';

    const deferred = new Deferred();
    fetchMock.post(
      `/api/${objectName}/${ObjetAttachmentId}/remove_attachment/`,
      deferred.promise,
    );

    render(
      <IntlProvider locale="en">
        <QueryClientProvider client={queryClient}>
          <label id="the-label-id">Label text</label>
          <AttachmentsListEditor
            {...{
              ObjetAttachmentId,
              attachments,
              labelId: 'the-label-id',
              objectName,
            }}
          />
        </QueryClientProvider>
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
      fetchMock.calls(
        `/api/${objectName}/${ObjetAttachmentId}/remove_attachment/`,
        {
          body: { attachment: attachments[0].id },
          headers: { Authorization: 'Token the bearer token' },
          method: 'POST',
        },
      ).length,
    ).toEqual(1);

    await act(async () => deferred.resolve(400));
    expect(button).toHaveAttribute('aria-busy', 'false');
    expect(button).toHaveAttribute('aria-disabled', 'false');
    expect(button).not.toContainHTML('spinner');
    expect(Sentry.captureException).toHaveBeenCalledWith(
      new Error(
        `Failed to get remove attachment ${attachments[0].id} from ${ObjetAttachmentId} in <AttachmentsListEditor />.`,
      ),
    );
  });
});
