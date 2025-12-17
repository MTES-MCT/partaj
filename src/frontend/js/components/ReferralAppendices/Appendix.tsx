import React, { useContext, useEffect, useState } from 'react';
import {
  defineMessages,
  FormattedDate,
  FormattedMessage,
  useIntl,
} from 'react-intl';
import {
  ReferralReport,
  ReferralReportAppendix,
  ReferralState,
  ReportAppendixEventVerb,
  ReportEvent,
  ReportEventVerb,
  User,
} from '../../types';
import { urls } from '../../const';
import { useCurrentUser } from '../../data/useCurrentUser';
import { isAuthor } from '../../utils/version';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { referralIsClosed, referralIsPublished } from '../../utils/referral';
import { EditFileIcon } from '../Icons';
import { AppendixEventIndicator } from './AppendixEventIndicator';
import { ValidationSelect } from '../select/ValidationSelect';
import * as Sentry from '@sentry/react';
import { isGranted, isSuperAdmin } from '../../utils/user';
import { Nullable } from '../../types/utils';
import { SelectOption } from '../select/BaseSelect';
import { ScanVerified } from '../Attachment/ScanVerified';
import { getErrorMessage } from '../../utils/errors';
import { FileLoadingState } from '../FileUploader/FileLoadingState';
import { GenericModalContext } from '../../data/providers/GenericModalProvider';
import { AppendixDocument } from './AppendixDocument';
import { ValidateAppendixModal } from '../modals/ValidateAppendixModal';
import { RequestChangeAppendixModal } from '../modals/RequestChangeAppendixModal';
import { ValidationAppendixModal } from '../modals/ValidationAppendixModal';
import { AppendixContext } from '../../data/providers/AppendixProvider';
import { AppendixUpdateButton } from '../FileUploader/AppendixUpdateButton';

interface AppendixProps {
  report: ReferralReport | undefined;
  index: number;
  appendicesLength: number;
}

const messages = defineMessages({
  publicationDate: {
    defaultMessage: 'Publication date { date }',
    description: 'Title for the version publication date.',
    id: 'components.Appendix.publicationDate',
  },
  send: {
    defaultMessage: 'Send to requester(s)',
    description: 'Title for the appendix send button.',
    id: 'components.Appendix.send',
  },
  replace: {
    defaultMessage: 'Replace',
    description: 'Title for the appendix replace button.',
    id: 'components.Appendix.replace',
  },
  requestValidation: {
    defaultMessage: 'Request validation',
    description: 'Request validation button text',
    id: 'components.Appendix.requestValidation',
  },
  requestChange: {
    defaultMessage: 'Request change',
    description: 'Request change button text',
    id: 'components.Appendix.requestChange',
  },
  validateAppendix: {
    defaultMessage: 'Validate appendix',
    description: 'Validate appendix text',
    id: 'components.Appendix.validateAppendix',
  },
  requestChangeDescription: {
    defaultMessage:
      'Request a change from the author of the appendix, who will be notified of your request by email.',
    description: 'Request change button text',
    id: 'components.Appendix.requestChangeDescription',
  },
  requestValidationDescription: {
    defaultMessage:
      'Request validation from your hierarchy with comments and notify by email the persons concerned by this request',
    description: 'Request change button text',
    id: 'components.Appendix.requestValidationDescription',
  },
  validateAppendixDescription: {
    defaultMessage:
      'Validates the appendix and notifies all persons assigned to this referral',
    description: 'Validate description',
    id: 'components.Appendix.validateAppendixDescription',
  },
  validationRequested: {
    defaultMessage: 'Validation requested',
    description: 'Validation requested button text',
    id: 'components.Appendix.validationRequested',
  },
  updateButtonDisabledText: {
    defaultMessage:
      'File replacement is not allowed when a revision is requested, please publish a new appendix',
    description: 'Update button disabled text',
    id: 'components.Appendix.updateButtonDisabledText',
  },
});

export const Appendix: React.FC<AppendixProps> = ({
  index,
  appendicesLength,
}) => {
  const { referral } = useContext(ReferralContext);
  const { appendix, setAppendix } = useContext(AppendixContext);
  const { openGenericModal } = useContext(GenericModalContext);
  const { currentUser } = useCurrentUser();
  const intl = useIntl();
  const [options, setOptions] = useState<Array<SelectOption>>([]);
  const [isValidationModalOpen, setValidationModalOpen] = useState(false);
  const [isValidateModalOpen, setValidateModalOpen] = useState(false);
  const [isRequestChangeModalOpen, setRequestChangeModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const appendixNumber = appendix?.appendix_number ?? appendicesLength - index;

  const hasValidated = (
    currentUser: Nullable<User>,
    appendix: Nullable<ReferralReportAppendix>,
  ) => {
    if (!currentUser || !appendix) {
      return false;
    }

    return (
      appendix.events.filter(
        (event: ReportEvent) =>
          event.verb === ReportAppendixEventVerb.APPENDIX_VALIDATED &&
          event.user.id === currentUser.id,
      ).length > 0
    );
  };

  const hasRequestedChange = (
    currentUser: Nullable<User>,
    appendix: Nullable<ReferralReportAppendix>,
  ) => {
    if (!currentUser || !appendix) {
      return false;
    }

    return (
      appendix.events.filter(
        (event: ReportEvent) =>
          event.verb === ReportAppendixEventVerb.APPENDIX_REQUEST_CHANGE &&
          event.user.id === currentUser.id,
      ).length > 0
    );
  };

  const isChangeRequested = (appendix: Nullable<ReferralReportAppendix>) => {
    if (!appendix) {
      return false;
    }

    return (
      appendix.events.filter(
        (event: ReportEvent) =>
          event.verb === ReportAppendixEventVerb.APPENDIX_REQUEST_CHANGE,
      ).length > 0
    );
  };

  const hasRequestedValidation = (
    currentUser: Nullable<User>,
    appendix: Nullable<ReferralReportAppendix>,
  ) => {
    if (!currentUser || !appendix) {
      return false;
    }

    return (
      appendix.events.filter(
        (event: ReportEvent) =>
          event.verb === ReportAppendixEventVerb.APPENDIX_REQUEST_VALIDATION &&
          event.user.id === currentUser.id,
      ).length > 0
    );
  };

  useEffect(() => {
    setOptions([
      {
        id: 'request_validation',
        value: intl.formatMessage(messages.requestValidation),
        description: intl.formatMessage(messages.requestValidationDescription),
        display: !isSuperAdmin(currentUser),
        active: {
          isActive: hasRequestedValidation(currentUser, appendix),
          text: 'demande envoyée',
          css: 'text-warning-600 italic text-sm',
        },
        onClick: () => {
          setValidationModalOpen(true);
        },
        css: 'text-black hover:bg-warning-200',
        cssSelected: 'bg-warning-200',
      },
      {
        id: 'validate',
        value: intl.formatMessage(messages.validateAppendix),
        description: intl.formatMessage(messages.validateAppendixDescription),
        display: isGranted(currentUser, referral),
        active: {
          isActive: hasValidated(currentUser, appendix),
          text: 'validée',
          css: 'text-success-600 italic text-sm',
        },
        onClick: () => {
          setValidateModalOpen(true);
        },
        css: 'text-black hover:bg-success-200',
        cssSelected: 'bg-success-200',
      },
      {
        id: 'request_change',
        value: intl.formatMessage(messages.requestChange),
        description: intl.formatMessage(messages.requestChangeDescription),
        display: isGranted(currentUser, referral),
        onClick: () => {
          setRequestChangeModalOpen(true);
        },
        active: {
          isActive: hasRequestedChange(currentUser, appendix),
          text: 'demande envoyée',
          css: 'text-caution-500 italic text-sm',
        },
        css: 'text-black hover:bg-caution-200',
        cssSelected: 'bg-caution-200',
      },
    ]);
  }, [currentUser, appendix]);

  return (
    <>
      {referral && appendix && (
        <>
          <div
            data-testid="appendix"
            key={appendix.id}
            className={`flex w-full flex-col relative bg-white border border-black`}
          >
            {isLoading && <FileLoadingState />}
            <div className={`flex w-full flex-col space-y-4`}>
              <div className="space-y-1">
                <div className="w-full border-b border-black font-medium flex items-center px-3 py-2">
                  <span>Annexe {appendixNumber}</span>
                </div>

                <div className="flex justify-between px-3 py-2">
                  <div className={`flex flex-col`}>
                    <span className="font-medium text-sm">
                      {appendix.created_by.first_name}{' '}
                      {appendix.created_by.last_name}
                    </span>
                    <p className="text-xs text-grey-700">
                      {appendix.created_by.unit_name}
                    </p>
                  </div>
                  <div className={`flex justify-between text-grey-700 text-sm`}>
                    <FormattedMessage
                      {...messages.publicationDate}
                      values={{
                        date: (
                          <FormattedDate
                            year="numeric"
                            month="long"
                            day="numeric"
                            value={appendix.updated_at}
                          />
                        ),
                      }}
                    />
                  </div>
                </div>

                <div className="px-3">
                  {appendix.events.length > 0 &&
                    referral.validation_state === 1 && (
                      <div
                        className="space-y-1"
                        style={{ marginTop: '16px', marginBottom: '16px' }}
                      >
                        {appendix.events.map((event: any) => (
                          <AppendixEventIndicator
                            key={event.id}
                            event={event}
                          />
                        ))}
                      </div>
                    )}
                  <div className="w-full relative mb-5">
                    <AppendixDocument appendix={appendix} />
                    <div
                      className={`${
                        referral.state != ReferralState.ANSWERED && 'absolute'
                      } top-8`}
                    >
                      <ScanVerified file={appendix.document} />
                    </div>
                  </div>
                </div>
              </div>

              {!referralIsPublished(referral) && !referralIsClosed(referral) && (
                <div className="flex w-full items-center justify-between px-3 pb-4">
                  <div>
                    {isAuthor(currentUser, appendix) && (
                      <div
                        className="flex space-x-2"
                        data-testid="update-appendix-button"
                      >
                        <AppendixUpdateButton
                          disabled={isChangeRequested(appendix)}
                          disabledText={intl.formatMessage(
                            messages.updateButtonDisabledText,
                          )}
                          setIsLoading={setIsLoading}
                          icon={
                            <EditFileIcon
                              className={
                                isChangeRequested(appendix)
                                  ? 'fill-grey400'
                                  : 'fill-black'
                              }
                            />
                          }
                          cssClass="btn-outline"
                          onSuccess={(result) => {
                            setAppendix(result);
                          }}
                          onError={(error) => {
                            openGenericModal({
                              content: (
                                <span>
                                  {' '}
                                  {getErrorMessage(error.code, intl)}
                                </span>
                              ),
                            });
                            Sentry.captureException(error.errors[0]);
                          }}
                          action={'PUT'}
                          url={urls.appendices + appendix.id + '/'}
                        >
                          <FormattedMessage {...messages.replace} />
                        </AppendixUpdateButton>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {!referralIsPublished(referral) &&
                      !referralIsClosed(referral) && (
                        <>
                          <ValidationSelect options={options} />
                          <ValidateAppendixModal
                            appendixNumber={appendixNumber}
                            setModalOpen={setValidateModalOpen}
                            isModalOpen={isValidateModalOpen}
                          />
                          <RequestChangeAppendixModal
                            appendixNumber={appendixNumber}
                            setModalOpen={setRequestChangeModalOpen}
                            isModalOpen={isRequestChangeModalOpen}
                          />
                          <ValidationAppendixModal
                            setValidationModalOpen={setValidationModalOpen}
                            isValidationModalOpen={isValidationModalOpen}
                          />
                        </>
                      )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};
