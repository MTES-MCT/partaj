import React, { useContext, useState } from 'react';

import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Spinner } from 'components/Spinner';
import {
  ReferralReport as RReport,
  ErrorResponse,
  ReferralReportAppendix,
} from 'types';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { useReferralReport } from '../../data';
import { urls } from '../../const';
import * as Sentry from '@sentry/react';
import { referralIsClosed, referralIsPublished } from '../../utils/referral';
import { AddIcon, DraftIcon } from '../Icons';
import { IconTextButton } from '../buttons/IconTextButton';
import { DropzoneFileUploader } from '../FileUploader/DropzoneFileUploader';
import { getErrorMessage } from '../../utils/errors';
import { GenericModalContext } from '../../data/providers/GenericModalProvider';
import { Appendix } from './Appendix';
import { AppendixProvider } from '../../data/providers/AppendixProvider';

const messages = defineMessages({
  loadingAppendices: {
    defaultMessage: 'Loading referral appendices...',
    description:
      'Accessibility message for the spinner in the referral detail appendices tab.',
    id: 'components.ReferralAppendices.loadingAppendices',
  },
  dropAppendix: {
    defaultMessage:
      'Drag and drop the appendix file here, or click to select it.\nOnce imported, only your unit will have access to this appendix',
    description:
      'Helper text in the file dropzone input in the attachments form field.',
    id: 'components.ReferralAppendices.dropAppendix',
  },
  addAppendix: {
    defaultMessage: 'Add a new appendix',
    description: 'Add version CTA text',
    id: 'components.ReferralAppendices.addAppendix',
  },
  emptyList: {
    defaultMessage: 'There is no appendix for this referral yet.',
    description:
      'Message for the empty state of the referral report without appendix yet.',
    id: 'components.ReferralAppendices.emptyList',
  },
});

export const ReferralAppendices: React.FC = () => {
  const { referral, refetch } = useContext(ReferralContext);
  const { openGenericModal } = useContext(GenericModalContext);
  const intl = useIntl();
  const [isAddingAppendix, setAddingAppendix] = useState(false);

  const [appendicesAreLoaded, setAppendicesAreLoaded] = useState(false);
  const [reportAppendices, setReportAppendices] = useState<
    ReferralReportAppendix[]
  >([]);
  const [report, setReport] = useState<RReport>();

  const { status: reportStatus } = useReferralReport(referral!.report!.id, {
    onSuccess: (data) => {
      setReport(data);
      setReportAppendices(data.appendices ?? []);
      setAppendicesAreLoaded(true);
    },
  });

  const onError = (error: ErrorResponse) => {
    openGenericModal({
      content: <span>{getErrorMessage(error.code, intl)}</span>,
    });
    Sentry.captureException(error.errors[0]);
  };

  const onSuccess = (newAppendix: ReferralReportAppendix) => {
    setReportAppendices((prevState) => [newAppendix, ...prevState]);
    setAddingAppendix(false);
    refetch();
  };

  if ([reportStatus].includes('error')) {
    return <GenericErrorMessage />;
  }

  if ([reportStatus].includes('idle') || [reportStatus].includes('loading')) {
    return (
      <Spinner size="large">
        <FormattedMessage {...messages.loadingAppendices} />
      </Spinner>
    );
  }

  return (
    <>
      <div
        data-testid="referral-appendices"
        className={` ${
          !referralIsPublished(referral) &&
          !referralIsClosed(referral) &&
          reportAppendices.length === 0
            ? 'border-2 border-black'
            : ''
        } overflow-hidden inline-block max-w-full font-marianne`}
      >
        {appendicesAreLoaded && (
          <>
            {!referralIsPublished(referral) &&
              !referralIsClosed(referral) &&
              reportAppendices.length === 0 && (
                <div className="flex p-2 items-center border-b-2 border-black">
                  <div className="mr-2">
                    <DraftIcon className="w-6 h-6" />
                  </div>
                  <h2 className="text-base"> Ajout d'une nouvelle annexe</h2>
                </div>
              )}
          </>
        )}

        <div className="p-6 space-y-6 min-h-210 flex flex-col items-center justify-center">
          {appendicesAreLoaded && (
            <>
              {!referralIsPublished(referral) &&
                !referralIsClosed(referral) &&
                reportAppendices.length > 0 && (
                  <>
                    {isAddingAppendix ? (
                      <DropzoneFileUploader
                        onSuccess={(result) => onSuccess(result)}
                        onError={(error) => onError(error)}
                        withButton
                        action={'POST'}
                        url={urls.appendices}
                        keyValues={[
                          ['report', referral!.report!.id],
                          [
                            'appendix_number',
                            (reportAppendices.length + 1).toString(),
                          ],
                        ]}
                        message={messages.dropAppendix}
                      />
                    ) : (
                      <div
                        key={'add-appendix'}
                        className="flex w-full items-left"
                      >
                        <IconTextButton
                          onClick={() => setAddingAppendix(true)}
                          testId="add-appendix-button"
                          otherClasses="border border-black hover:bg-dsfr-grey-100"
                          spanClasses="mb-0.5"
                          icon={<AddIcon />}
                          text={intl.formatMessage(messages.addAppendix)}
                        />
                      </div>
                    )}
                  </>
                )}

              <>
                {reportAppendices.length > 0 ? (
                  <>
                    {reportAppendices.map(
                      (appendix: ReferralReportAppendix, index: number) => (
                        <AppendixProvider
                          key={appendix.id}
                          initialAppendix={appendix}
                        >
                          <Appendix
                            index={index}
                            report={report}
                            appendicesLength={reportAppendices.length}
                          />
                        </AppendixProvider>
                      ),
                    )}
                  </>
                ) : (
                  <>
                    {isAddingAppendix ? (
                      <DropzoneFileUploader
                        onSuccess={(result) => onSuccess(result)}
                        onError={(error) => onError(error)}
                        withButton
                        action={'POST'}
                        url={urls.appendices}
                        keyValues={[
                          ['report', referral!.report!.id],
                          [
                            'appendix_number',
                            (reportAppendices.length + 1).toString(),
                          ],
                        ]}
                        message={messages.dropAppendix}
                      />
                    ) : (
                      <>
                        {!referralIsPublished(referral) &&
                        !referralIsClosed(referral) ? (
                          <div className="flex items-center flex-col">
                            <div className="pl-8 pb-8 text-center">
                              <FormattedMessage {...messages.emptyList} />
                            </div>
                            <IconTextButton
                              onClick={() => setAddingAppendix(true)}
                              testId="add-appendix-button"
                              otherClasses="border border-black text-black"
                              icon={<AddIcon className="fill-black" />}
                              text={intl.formatMessage(messages.addAppendix)}
                            />
                          </div>
                        ) : null}
                      </>
                    )}
                  </>
                )}
              </>
            </>
          )}
        </div>
      </div>
    </>
  );
};
