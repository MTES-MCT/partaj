import React, { useContext, useEffect, useState } from 'react';
import { defineMessages, FormattedDate, FormattedMessage } from 'react-intl';
import {
  Referral,
  ReferralReportAppendix,
  ReferralReportVersion,
  ReferralUserLink,
} from '../../types';
import { useCurrentUser } from '../../data/useCurrentUser';
import { BaseSideModalContext } from '../../data/providers/BaseSideModalProvider';
import { TextArea, TextAreaSize } from '../text/TextArea';
import { Nullable } from '../../types/utils';
import { getUserFullname } from '../../utils/user';
import { Spinner } from '../Spinner';
import { appData } from '../../appData';
import { VersionDocument } from '../ReferralReport/VersionDocument';
import { AppendixProvider } from '../../data/providers/AppendixProvider';
import { useReferralReport } from '../../data';
import { MinAppendix } from '../ReferralAppendices/MinAppendix';
import { usePatchAppendixAction } from '../../data/appendices';
import { CheckIcon } from '../Icons';
import * as Sentry from '@sentry/react';

const messages = defineMessages({
  modalTitle: {
    defaultMessage: 'Answer to referral #{ id }',
    description: 'Title for the modal to confirm sending a referral answer.',
    id: 'components.SendVersionContent.modalTitle',
  },
  version: {
    defaultMessage: 'Version {activeVersion} created at ',
    description: 'Version title',
    id: 'components.SendVersionContent.version',
  },
  send: {
    defaultMessage: 'Send the version',
    description:
      'Button to publish a report, allowing the requester to see it, and closing the referral.',
    id: 'components.SendVersionContent.send',
  },
  sendError: {
    defaultMessage:
      'An error occurred while trying to send the report to the requester.',
    description:
      'Error message when the version publication failed in the referral detail answer view.',
    id: 'components.SendVersionModal.sendError',
  },
  addMessage: {
    defaultMessage: 'Add a message to the answer',
    description:
      'Explanation text for text input to send a comment with the a answer',
    id: 'components.SendVersionModal.addMessage',
  },
  mainTitle: {
    defaultMessage: 'Validate version',
    description: 'Modal main title',
    id: 'components.ValidateModal.mainTitle',
  },
  validate: {
    defaultMessage: 'Validate',
    description: 'CTA button text',
    id: 'components.ValidateModal.buttonText',
  },
  addComment: {
    defaultMessage: 'Add comment to your validation (optional)',
    description: 'Add comment text',
    id: 'components.ValidateModal.addComment',
  },
  addCommentDescription: {
    defaultMessage: 'It will be displayed in the private unit conversation',
    description: 'Add comment description',
    id: 'components.ValidateModal.addCommentDescription',
  },
  validateModalDescription: {
    defaultMessage:
      'Lawyers assigned to the referral will be notified by e-mail',
    description: 'Validate modal description',
    id: 'components.ValidateModal.validateModalDescription',
  },
});

export const SendVersionContent = ({
  referral,
  version,
}: {
  referral: Nullable<Referral>;
  version: Nullable<ReferralReportVersion>;
}) => {
  const { closeBaseSideModal } = useContext(BaseSideModalContext);
  const [messageContent, setMessageContent] = useState('');
  const [hasError, setError] = useState(false);
  const { currentUser } = useCurrentUser();
  const [isSending, setSending] = useState(false);
  const { data: report } = useReferralReport(referral?.report?.id ?? '', {
    enabled: !!referral?.report?.id,
  });

  const closeModal = () => {
    setMessageContent('');
    closeBaseSideModal();
  };

  const [selectedOptions, setSelectedOptions] = useState<Array<SelectedOption>>(
    [],
  );

  interface SelectedOption {
    id: string;
  }

  useEffect(() => {
    if (report?.appendices) {
      setSelectedOptions(
        report.appendices
          .filter(
            (appendix: ReferralReportAppendix) =>
              appendix.include_to_publishment,
          )
          .map((appendix: ReferralReportAppendix) => ({ id: appendix.id })),
      );
    }
  }, [report]);

  const patchAppendixMutation = usePatchAppendixAction();

  const isOptionSelected = (id: string) => {
    return selectedOptions.filter((option) => option.id === id).length === 1;
  };

  const submitForm = async () => {
    if (version) {
      const response = await fetch(
        `/api/referralreports/${referral!.report!.id}/publish_report/`,
        {
          body: JSON.stringify({
            version: version.id,
            comment: messageContent,
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
      closeModal();
      setSending(false);
      return await response.json();
    }
  };

  const toggleOption = ({ id }: SelectedOption) => {
    if (!isOptionSelected(id)) {
      setSelectedOptions((prevState) => [...prevState, { id }]);
    } else {
      setSelectedOptions((prevState) => {
        return prevState.filter((option) => option.id !== id);
      });
    }
  };

  return (
    <>
      {referral && currentUser && version && (
        <div className={'flex flex-col space-y-8'}>
          <div className="flex flex-col flex-grow space-y-8">
            <h3 className="text-dsfr-primary-500 text-lg font-medium">
              <FormattedMessage
                {...messages.modalTitle}
                values={{ id: referral!.id }}
              />
            </h3>

            <div className="flex justify-between space-x-10">
              <div>
                <p className="text-left font-semibold">Par :</p>
                <p className="text-left font-medium text-sm">
                  {version.created_by.first_name} {version.created_by.last_name}
                </p>
                <p className="text-left text-sm text-dsfr-grey-700 font-medium">
                  {version.created_by.unit_name}
                </p>
                <p className="text-left text-sm text-dsfr-grey-700">
                  {version.created_by.phone_number}
                </p>
                <p className="text-left text-sm text-dsfr-grey-700">
                  {version.created_by.email}
                </p>
              </div>

              <div>
                <p className="text-right font-semibold"> À destination de :</p>
                {referral &&
                  referral.users.map((user: ReferralUserLink) => {
                    return (
                      <p
                        key={`send-version-user-${user.id}`}
                        className="text-right text-sm font-medium"
                      >
                        {getUserFullname(user)}
                      </p>
                    );
                  })}
              </div>
            </div>
            <div className="flex w-full flex-col relative bg-white p-3 border-2 border-dsfr-primary-500">
              <div className={`flex justify-between text-lg font-medium`}>
                <span>Version {version.version_number}</span>
              </div>
              <span className="flex justify-between text-sm text-gray-500">
                <FormattedMessage
                  {...messages.version}
                  values={{
                    activeVersion: version.version_number,
                  }}
                />{' '}
                <FormattedDate
                  value={version.updated_at}
                  year="2-digit"
                  month="2-digit"
                  day="2-digit"
                />
              </span>
              <VersionDocument version={version} />
            </div>
            {report && report.appendices && report.appendices.length > 0 && (
              <ul>
                {report.appendices.map(
                  (appendix: ReferralReportAppendix, index: number) => (
                    <AppendixProvider
                      key={appendix.id}
                      initialAppendix={appendix}
                    >
                      <li
                        id={appendix.id}
                        key={appendix.id}
                        role="option"
                        className={`flex cursor-pointer text-s p-2 space-x-2 items-start`}
                        aria-selected={isOptionSelected(appendix.id)}
                        tabIndex={0}
                      >
                        <div
                          role="checkbox"
                          aria-checked={isOptionSelected(appendix.id)}
                          className={`dsfr-checkbox`}
                          onClick={() => {
                            toggleOption({
                              id: appendix.id,
                            });

                            patchAppendixMutation.mutate(
                              {
                                id: appendix.id,
                                include_to_publishment: !isOptionSelected(
                                  appendix.id,
                                ),
                              },
                              {
                                onError: (error) => {
                                  Sentry.captureException(error);
                                },
                              },
                            );
                          }}
                        >
                          <CheckIcon className="fill-black" />
                        </div>
                        <MinAppendix
                          index={index}
                          report={report}
                          appendicesLength={report.appendices.length}
                        />
                      </li>
                    </AppendixProvider>
                  ),
                )}
              </ul>
            )}
            <div className="flex flex-col">
              <h3 className="font-normal mb-4">
                <FormattedMessage {...messages.addMessage} />
              </h3>
              <TextArea
                size={TextAreaSize.L}
                id="validate-appendix-content-textarea"
                value={messageContent}
                onChange={(value: string) => setMessageContent(value)}
              />
            </div>
          </div>
          <div className="flex w-full z-20 flex-col">
            <div className="flex w-full justify-end mb-4">
              <button
                className={`relative btn btn-primary`}
                onClick={() => {
                  setSending(true);
                  return submitForm();
                }}
                aria-busy={isSending}
                aria-disabled={isSending}
              >
                {isSending ? (
                  <span aria-hidden="true">
                    <span className="opacity-0">
                      <FormattedMessage {...messages.send} />
                    </span>
                    <Spinner
                      size="small"
                      color="white"
                      className="absolute inset-0"
                    >
                      {/* No children with loading text as the spinner is aria-hidden (handled by aria-busy) */}
                    </Spinner>
                  </span>
                ) : (
                  <FormattedMessage {...messages.send} />
                )}
              </button>
            </div>
            <div className="flex-col">
              <div className="flex justify-center space-x-4">
                {hasError ? (
                  <div className="text-center text-danger-600">
                    <FormattedMessage {...messages.sendError} />
                  </div>
                ) : null}
              </div>
              <p className="w-full text-sm text-dsfr-expert-500 ">
                Vous êtes sur le point d’envoyer la réponse aux services métiers
                et de marquer cette saisine comme ayant reçu une réponse
                définitive. Il ne sera alors plus possible de modifier la
                réponse ou de créer de nouveaux projets de réponse.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
