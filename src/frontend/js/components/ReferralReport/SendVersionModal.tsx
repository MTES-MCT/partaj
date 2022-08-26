import React, { useContext, useState } from 'react';
import { defineMessages, FormattedDate, FormattedMessage } from 'react-intl';
import ReactModal from 'react-modal';
import { appData } from 'appData';
import { Spinner } from 'components/Spinner';
import {
  ReferralReport,
  ReferralReportAttachment,
  ReferralReportVersion,
} from 'types';
import { urls } from '../../const';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import filesize from 'filesize';
import { DropzoneFileUploader } from '../DropzoneFileUploader';
import { RichTextField } from '../RichText/field';
import { useUIDSeed } from 'react-uid';
import { AttachmentItem } from '../Attachment/AttachmentItem';

const size = filesize.partial({
  locale: document.querySelector('html')?.getAttribute('lang') || 'en-US',
});

const messages = defineMessages({
  cancel: {
    defaultMessage: 'Cancel',
    description:
      'Button to cancel sending a referral answer and close the modal.',
    id: 'components.SendVersionModal.cancel',
  },
  version: {
    defaultMessage: 'Version {activeVersion} created at ',
    description: 'Version title',
    id: 'components.SendVersionModal.version',
  },
  addMessage: {
    defaultMessage: 'Add a message to the answer',
    description:
      'Explanation text for text input to send a comment with the a answer',
    id: 'components.SendVersionModal.addMessage',
  },
  attachments: {
    defaultMessage: 'Attachment files',
    description:
      'Explanation text for answer attachment dropzone in the send modal',
    id: 'components.SendVersionModal.attachments',
  },
  modalTitle: {
    defaultMessage: 'Referral #{ id }',
    description: 'Title for the modal to confirm sending a referral answer.',
    id: 'components.SendVersionModal.modalTitle',
  },
  send: {
    defaultMessage: 'Send the version',
    description:
      'Button to publish a report, allowing the requester to see it, and closing the referral.',
    id: 'components.SendVersionModal.send',
  },
  sendError: {
    defaultMessage:
      'An error occurred while trying to send the report to the requester.',
    description:
      'Error message when the version publication failed in the referral detail answer view.',
    id: 'components.SendVersionModal.sendError',
  },
  dropAttachment: {
    defaultMessage:
      'Drag and drop the attachment file here, or click to select it',
    description:
      'Helper text in the file dropzone input in the attachments form field.',
    id: 'components.SendVersionModal.dropAttachment',
  },
});

// The `setAppElement` needs to happen in proper code but breaks our testing environment.
// This workaround is not satisfactory but it allows us to both test <SendVersionModal />
// and avoid compromising accessibility in real-world use.
const isTestEnv = typeof jest !== 'undefined';
if (!isTestEnv) {
  ReactModal.setAppElement('#app-root');
}

interface SendVersionModalProps {
  report: ReferralReport | undefined;
  version: ReferralReportVersion;
  isModalOpen: boolean;
  setModalOpen: (isOpen: boolean) => void;
  activeVersion: number;
}

export const SendVersionModal: React.FC<SendVersionModalProps> = ({
  report,
  version,
  isModalOpen,
  setModalOpen,
  activeVersion,
}) => {
  const seed = useUIDSeed();
  const { referral, refetch } = useContext(ReferralContext);
  const [attachments, setAttachments] = useState(report?.attachments ?? []);
  const [isSending, setSending] = useState(false);
  const [hasError, setError] = useState(false);
  const [comment, setComment] = useState('');

  const publishVersion = async () => {
    const response = await fetch(
      `/api/referralreports/${referral!.report!.id}/publish_report/`,
      {
        body: JSON.stringify({
          version: version.id,
          comment: comment,
        }),
        headers: {
          Authorization: `Token ${appData.token}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
    );
    if (!response.ok) {
      setError(true);
      throw new Error('Failed to publish version in SendVersionModal.');
    }
    setModalOpen(false);
    refetch();
    return await response.json();
  };

  return (
    <ReactModal
      ariaHideApp={!isTestEnv}
      isOpen={isModalOpen}
      onRequestClose={() => setModalOpen(false)}
      style={{
        content: {
          maxWidth: '50rem',
          minWidth: '42rem',
          padding: '0',
          position: 'static',
        },
        overlay: {
          backgroundColor: 'rgba(0,0,0,0.75)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
    >
      <div className="p-8 space-y-4">
        <div className="flex justify-between space-x-10">
          <h2 className="text-xl">
            <FormattedMessage
              {...messages.modalTitle}
              values={{ id: referral!.id }}
            />
          </h2>
          <div>
            <p className="text-m">
              {version.created_by.first_name} {version.created_by.last_name}
            </p>
            <p className="text-m">{version.created_by.unit_name}</p>
            <p className="text-m">{version.created_by.phone_number}</p>
            <p className="text-m">{version.created_by.email}</p>
          </div>
        </div>
        <div>
          <div className="list-group-item justify-between">
            <span>
              <FormattedMessage
                {...messages.version}
                values={{
                  activeVersion,
                }}
              />{' '}
              <FormattedDate
                value={version.created_at}
                year="2-digit"
                month="2-digit"
                day="2-digit"
              />
            </span>
            <a
              className="text-primary-500 hover:underline focus:underline"
              href={version.document.file}
              key={version.document.id}
            >
              {version.document.name_with_extension}
              {version.document.size
                ? ` — ${size(version.document.size)}`
                : null}
            </a>
          </div>
        </div>
      </div>
      <div className="p-8">
        <h3 className="mb-2">
          <FormattedMessage {...messages.attachments} />
        </h3>
        <div>
          {attachments.map(
            (attachment: ReferralReportAttachment, index: number) => (
              <AttachmentItem
                key={attachment.id}
                parentId={referral!.report!.id}
                onDeleteSuccess={(result) => {
                  setAttachments(result.attachments);
                }}
                attachment={attachment}
              />
            ),
          )}
        </div>
        <div>
          <DropzoneFileUploader
            onSuccess={(results) => {
              setAttachments((prevState) => {
                return [...prevState, ...results];
              });
            }}
            onError={(error) => {}}
            action={'POST'}
            url={urls.reports + referral!.report!.id + '/add_attachment/'}
            message={messages.dropAttachment}
          />
        </div>
      </div>
      <div className="p-8">
        <h3 className="mb-2">
          <FormattedMessage {...messages.addMessage} />
        </h3>
        <RichTextField
          aria-labelledby={seed('content-input-label')}
          enableHeadings={true}
          onChange={(e) => {
            switch (e.cause) {
              case 'CHANGE':
                setComment(e.data.textContent);
                break;
            }
          }}
        />
      </div>
      <div className="flex justify-end bg-gray-300 p-8 space-x-4">
        <button className="btn btn-outline" onClick={() => setModalOpen(false)}>
          <FormattedMessage {...messages.cancel} />
        </button>

        <button
          className={`relative btn btn-primary`}
          onClick={() => {
            setSending(true);
            return publishVersion();
          }}
          aria-busy={isSending}
          aria-disabled={isSending}
        >
          {isSending ? (
            <span aria-hidden="true">
              <span className="opacity-0">
                <FormattedMessage {...messages.send} />
              </span>
              <Spinner size="small" color="white" className="absolute inset-0">
                {/* No children with loading text as the spinner is aria-hidden (handled by aria-busy) */}
              </Spinner>
            </span>
          ) : (
            <FormattedMessage {...messages.send} />
          )}
        </button>
        {hasError ? (
          <div className="text-center text-danger-600">
            <FormattedMessage {...messages.sendError} />
          </div>
        ) : null}
      </div>
    </ReactModal>
  );
};
