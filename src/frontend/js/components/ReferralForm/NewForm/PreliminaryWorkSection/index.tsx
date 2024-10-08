import React, { useContext, useEffect, useState } from 'react';
import { Text, TextType } from '../../../text/Text';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { PreliminaryWorkRadioGroup } from './PreliminaryWorkRadioGroup';
import { TextArea } from '../../../text/TextArea';
import { Title, TitleType } from '../../../text/Title';
import { AddAttachmentButton } from '../AddAttachmentButton';
import {
  Referral,
  ReferralAttachment,
  RequesterUnitType,
} from '../../../../types';
import { useParams } from 'react-router-dom';
import { ReferralDetailRouteParams } from '../../../ReferralDetail';
import { ReferralFormContext } from '../../../../data/providers/ReferralFormProvider';
import { ReferralContext } from '../../../../data/providers/ReferralProvider';
import { InputText } from '../../../text/InputText';
import { ExternalLink } from '../../../dsfr/ExternalLink';
import { usePatchReferralAction } from '../../../../data/referral';
import { ErrorIcon, FileIcon } from '../../../Icons';
import { FormSection } from '../FormSection';

const messages = defineMessages({
  preliminaryWorkCentralDescription: {
    defaultMessage: 'Have you carried out any research on the subject?',
    description: 'Description for centralized unit preliminary work',
    id: 'components.PreliminaryWorkSection.preliminaryWorkCentralDescription',
  },
  preliminaryWorkDecentralDescription: {
    defaultMessage:
      'Have you referred the matter to the relevant business unit beforehand?',
    description: 'Description for centralized unit preliminary work',
    id: 'components.PreliminaryWorkSection.preliminaryWorkDecentralDescription',
  },
  preliminaryWorkOKCentralText: {
    defaultMessage:
      "How do your departments interpret the question posed? What is your department's position on this question?",
    description: 'Text for centralized unit preliminary work second block',
    id: 'components.PreliminaryWorkSection.preliminaryWorkOKCentralText',
  },
  preliminaryWorkOKDecentralisedText: {
    defaultMessage:
      'Following this exchange, what are the first answers you have?',
    description: 'Text for decentralized unit preliminary work second block',
    id: 'components.PreliminaryWorkSection.preliminaryWorkOKDecentralisedText',
  },
  centralAttachmentsText: {
    defaultMessage: 'Please attach the file(s) containing your answers.',
    description: 'Text for preliminary work central attachments',
    id: 'components.PreliminaryWorkSection.centralAttachmentsText',
  },
  decentralisedAttachmentsText: {
    defaultMessage:
      'Please attach the file(s) containing the answers provided by business management.',
    description: 'Text for preliminary work decentralized attachments',
    id: 'components.PreliminaryWorkSection.decentralisedAttachmentsText',
  },
  emailInputPlaceholder: {
    defaultMessage: 'Enter your contact email',
    description:
      'Placeholder text for the email input field for a decentralised unit contact',
    id: 'components.PreliminaryWorkSection.emailInputPlaceholder',
  },
  emailInputDescription: {
    defaultMessage:
      'Please provide the email of your contact in your business unit',
    description:
      'Description for the email input field for a decentralised contact',
    id: 'components.PreliminaryWorkSection.emailInputDescription',
  },
  preliminaryWorkError: {
    defaultMessage: 'Please indicate if you have done any preliminary work.',
    description: 'Text for error if preliminary work is not selected',
    id: 'components.PreliminaryWorkSection.preliminaryWorkError',
  },
  preliminaryWorkNoContactError: {
    defaultMessage: 'Please fill in the email field of your contact',
    description: 'Text for error if preliminary work is not selected',
    id: 'components.PreliminaryWorkSection.preliminaryWorkNoContactError',
  },
  delete: {
    defaultMessage: 'Delete',
    description: 'Text for delete button',
    id: 'components.PreliminaryWorkSection.delete',
  },
  preliminaryWorkNotFillError: {
    defaultMessage:
      'Please attach a file or fill in the text field above to inform your contact person of the work previously carried out on the subject.',
    description: 'Text for error if preliminary work is not filled',
    id: 'components.PreliminaryWorkSection.preliminaryWorkNotFillError',
  },
  noPreliminaryWorkDecentralizedWarning: {
    defaultMessage:
      'Entering your business department is a prerequisite for entering the services of the Legal Affairs Department.',
    description: 'Text for error if preliminary work is not filled',
    id:
      'components.PreliminaryWorkSection.noPreliminaryWorkDecentralizedWarning',
  },
  guidelink: {
    defaultMessage: 'See the DAJ referral guide',
    description: 'Guide link text',
    id: 'components.PreliminaryWorkSection.guidelink',
  },
  orientation: {
    defaultMessage:
      'If you have any difficulty in knowing who to contact, please contact pcnt.daj.sg@developpement-durable.gouv.fr.',
    description: 'Text for user orientation',
    id: 'components.PreliminaryWorkSection.orientation',
  },
  noPreliminaryWorkJustification: {
    defaultMessage:
      'If you wish to continue this procedure, please justify the exceptional absence of prior referral.',
    description: 'Label for justification text area',
    id: 'components.PreliminaryWorkSection.noPreliminaryWorkJustification',
  },
  noPreliminaryWorkNoJustificationError: {
    defaultMessage:
      'Please justify the exceptional absence of prior referral for this request.',
    description:
      'Text for error if preliminary work is not filled and no justification either',
    id:
      'components.PreliminaryWorkSection.noPreliminaryWorkNoJustificationError',
  },
});

export const PreliminaryWorkSection: React.FC<{ title: string }> = ({
  title,
}) => {
  const { errors } = useContext(ReferralFormContext);
  const { referralId } = useParams<ReferralDetailRouteParams>();
  const { referral, setReferral } = useContext(ReferralContext);
  const [hasPWEmptyError, setHasPWEmptyError] = useState<boolean>(false);
  const [hasPWNoContactError, setHasPWNoContactError] = useState<boolean>(
    false,
  );
  const [hasPWCentralNotFill, setHasPWCentralNotFill] = useState<boolean>(
    false,
  );
  const [hasPWDecentralNotFill, setHasPWDecentralNotFill] = useState<boolean>(
    false,
  );
  const [
    hasPWDecentralizedNoJustificationError,
    setHasPWDecentralizedNoJustificationError,
  ] = useState<boolean>(false);
  const [hasSectionError, setHasSectionError] = useState<boolean>(false);
  const [hasPWFillError, setHasPWFillError] = useState<boolean>(false);

  const intl = useIntl();
  const preliminaryWorkMutation = usePatchReferralAction();
  const patchReferralMutation = usePatchReferralAction();

  useEffect(() => {
    setHasPWEmptyError(errors.hasOwnProperty('preliminary_work_empty'));
    setHasPWNoContactError(
      errors.hasOwnProperty('preliminary_work_no_contact'),
    );
    setHasPWCentralNotFill(
      errors.hasOwnProperty('preliminary_work_central_not_fill'),
    );
    setHasPWDecentralNotFill(
      errors.hasOwnProperty('preliminary_work_decentralized_not_fill'),
    );
    setHasPWDecentralizedNoJustificationError(
      errors.hasOwnProperty('preliminary_work_no_prior_work_justification'),
    );
    setHasSectionError(getSectionError());
    setHasPWFillError(getPWFillError());
  }, [errors]);

  useEffect(() => {
    setHasSectionError(getSectionError());
    setHasPWFillError(getPWFillError());
  }, [referral]);
  const getSectionError = () => {
    if (errors.hasOwnProperty('preliminary_work_empty')) {
      return true;
    }

    if (
      referral &&
      referral?.requester_unit_type === RequesterUnitType.DECENTRALISED_UNIT
    ) {
      if (
        referral.has_prior_work === 'yes' &&
        (errors.hasOwnProperty('preliminary_work_no_contact') ||
          errors.hasOwnProperty('preliminary_work_decentralized_not_fill'))
      ) {
        return true;
      }
      if (
        referral.has_prior_work === 'no' &&
        errors.hasOwnProperty('preliminary_work_no_prior_work_justification')
      ) {
        return true;
      }
    }

    if (
      referral &&
      referral?.requester_unit_type === RequesterUnitType.CENTRAL_UNIT
    ) {
      if (
        referral.has_prior_work === 'yes' &&
        errors.hasOwnProperty('preliminary_work_central_not_fill')
      ) {
        return true;
      }
    }

    return false;
  };

  const getPWFillError = () => {
    console.log('PW FIll ERROR');
    if (
      referral &&
      referral?.requester_unit_type === RequesterUnitType.DECENTRALISED_UNIT
    ) {
      if (errors.hasOwnProperty('preliminary_work_decentralized_not_fill')) {
        return true;
      }
    }

    if (
      referral &&
      referral?.requester_unit_type === RequesterUnitType.CENTRAL_UNIT
    ) {
      if (errors.hasOwnProperty('preliminary_work_central_not_fill')) {
        return true;
      }
    }

    return false;
  };

  const updatePreliminaryWork = (value: 'yes' | 'no') => {
    preliminaryWorkMutation.mutate(
      {
        id: referralId,
        has_prior_work: value,
      },
      {
        onSuccess: (referral: Referral) => {
          setReferral(referral);
        },
      },
    );
  };

  const updatePriorWork = (value: string) => {
    patchReferralMutation.mutate(
      {
        id: referralId,
        prior_work: value,
      },
      {
        onSuccess: (referral: Referral) => {
          setReferral(referral);
        },
      },
    );
  };

  const updateNoPriorWorkJustification = (value: string) => {
    patchReferralMutation.mutate(
      {
        id: referralId,
        no_prior_work_justification: value,
      },
      {
        onSuccess: (referral: Referral) => {
          setReferral(referral);
        },
      },
    );
  };

  return (
    <>
      {referral && (
        <FormSection hasError={hasSectionError}>
          <Title
            type={TitleType.H6}
            className={hasSectionError ? 'text-dsfr-danger-500' : 'text-black'}
          >
            {title}
          </Title>
          <Text
            className={hasPWEmptyError ? 'text-dsfr-danger-500' : 'text-black'}
            type={TextType.PARAGRAPH_SMALL}
          >
            {referral.requester_unit_type ===
              RequesterUnitType.CENTRAL_UNIT && (
              <FormattedMessage
                {...messages.preliminaryWorkCentralDescription}
              />
            )}
            {referral.requester_unit_type ===
              RequesterUnitType.DECENTRALISED_UNIT && (
              <FormattedMessage
                {...messages.preliminaryWorkDecentralDescription}
              />
            )}
          </Text>
          <PreliminaryWorkRadioGroup
            onChange={(value) => updatePreliminaryWork(value as 'yes' | 'no')}
            defaultValue={referral.has_prior_work}
          />
          {hasPWEmptyError && (
            <div className="flex items-center space-x-1">
              <ErrorIcon className="fill-dsfr-danger-500" />
              <Text
                type={TextType.SPAN_SUPER_SMALL}
                className="text-dsfr-danger-500 font-normal"
              >
                <FormattedMessage {...messages.preliminaryWorkError} />
              </Text>
            </div>
          )}

          {referral.has_prior_work === 'yes' && (
            <>
              {referral.requester_unit_type ===
                RequesterUnitType.DECENTRALISED_UNIT && (
                <>
                  <Text
                    className={
                      hasPWNoContactError
                        ? 'text-dsfr-danger-500'
                        : 'text-black'
                    }
                    type={TextType.LABEL_SMALL}
                    htmlFor="contact_email"
                  >
                    <FormattedMessage {...messages.emailInputDescription} />
                  </Text>
                  <InputText
                    id="contact_email"
                    placeholder={intl.formatMessage(
                      messages.emailInputPlaceholder,
                    )}
                    hasError={hasPWNoContactError}
                  />
                  {hasPWNoContactError && (
                    <div className="flex items-center space-x-1">
                      <ErrorIcon className="fill-dsfr-danger-500" />
                      <Text
                        type={TextType.SPAN_SUPER_SMALL}
                        className="text-dsfr-danger-500 font-normal"
                      >
                        <FormattedMessage
                          {...messages.preliminaryWorkNoContactError}
                        />
                      </Text>
                    </div>
                  )}
                </>
              )}
              <Text
                type={TextType.LABEL_SMALL}
                htmlFor="prior_work"
                className={hasPWFillError ? 'text-dsfr-danger-500' : ''}
              >
                {referral.requester_unit_type ===
                  RequesterUnitType.CENTRAL_UNIT && (
                  <FormattedMessage
                    {...messages.preliminaryWorkOKCentralText}
                  />
                )}
                {referral.requester_unit_type ===
                  RequesterUnitType.DECENTRALISED_UNIT && (
                  <FormattedMessage
                    {...messages.preliminaryWorkOKDecentralisedText}
                  />
                )}
              </Text>

              <TextArea
                id="prior_work"
                defaultValue={referral.prior_work}
                rows={7}
                onDebounce={(value: string) => {
                  updatePriorWork(value);
                }}
                hasError={hasPWFillError}
              />
              <Text
                type={TextType.PARAGRAPH_SMALL}
                className={hasPWFillError ? 'text-dsfr-danger-500' : ''}
              >
                {referral.requester_unit_type ===
                  RequesterUnitType.CENTRAL_UNIT && (
                  <FormattedMessage {...messages.centralAttachmentsText} />
                )}
                {referral.requester_unit_type ===
                  RequesterUnitType.DECENTRALISED_UNIT && (
                  <FormattedMessage
                    {...messages.decentralisedAttachmentsText}
                  />
                )}
              </Text>
              <AddAttachmentButton
                className={hasPWFillError ? 'border-red' : ''}
                referralId={referralId}
                onSuccess={(data) => {
                  setReferral((prevState: Referral) => {
                    prevState.attachments = [...prevState.attachments, data];

                    return { ...prevState };
                  });
                }}
                onError={(e) => console.log(e)}
              >
                <span>Ajouter un fichier</span>
              </AddAttachmentButton>
              {referral.attachments.map((attachment: ReferralAttachment) => (
                <div className="flex space-x-2 items-center">
                  <div className="flex w-fit space-x-1 items-center">
                    <FileIcon />
                    <span className="font-light text-sm pb-0.5">
                      {attachment.name_with_extension}
                    </span>
                  </div>
                  <span className="font-light text-xs text-grey-600">
                    <FormattedMessage {...messages.delete} />
                  </span>
                </div>
              ))}
              {hasPWFillError && (
                <div className="flex items-center space-x-1">
                  <ErrorIcon className="fill-dsfr-danger-500" />
                  <Text
                    type={TextType.SPAN_SUPER_SMALL}
                    className="text-dsfr-danger-500 font-normal"
                  >
                    <FormattedMessage
                      {...messages.preliminaryWorkNotFillError}
                    />
                  </Text>
                </div>
              )}
            </>
          )}

          {referral.has_prior_work === 'no' && (
            <>
              {referral.requester_unit_type ===
                RequesterUnitType.DECENTRALISED_UNIT && (
                <>
                  <div className="border-l-2 border-warning-400 pl-3 leading-6">
                    <Text type={TextType.SPAN_SMALL}>
                      <FormattedMessage
                        {...messages.noPreliminaryWorkDecentralizedWarning}
                      />
                    </Text>
                    <ExternalLink
                      link={'https://documentation.partaj.beta.gouv.fr/'}
                      text="font-light text-sm"
                      icon="w-3 h-3"
                      className="inline-flex ml-2"
                    >
                      <FormattedMessage {...messages.guidelink} />
                    </ExternalLink>
                    <Text type={TextType.PARAGRAPH_SMALL}>
                      <FormattedMessage {...messages.orientation} />
                    </Text>
                  </div>
                  <div className="space-y-2">
                    <Text
                      htmlFor="no_prior_work_justification"
                      type={TextType.LABEL_SMALL}
                      className={
                        hasPWDecentralizedNoJustificationError
                          ? 'text-dsfr-danger-500'
                          : ''
                      }
                    >
                      <FormattedMessage
                        {...messages.noPreliminaryWorkJustification}
                      />
                    </Text>
                    <TextArea
                      id="no_prior_work_justification"
                      defaultValue={referral.no_prior_work_justification}
                      rows={5}
                      onDebounce={(value: string) => {
                        updateNoPriorWorkJustification(value);
                      }}
                      hasError={hasPWDecentralizedNoJustificationError}
                    />
                    {hasPWDecentralizedNoJustificationError && (
                      <div className="flex items-center space-x-1">
                        <ErrorIcon className="fill-dsfr-danger-500" />
                        <Text
                          type={TextType.SPAN_SUPER_SMALL}
                          className="text-dsfr-danger-500 font-normal"
                        >
                          <FormattedMessage
                            {...messages.noPreliminaryWorkNoJustificationError}
                          />
                        </Text>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </FormSection>
      )}
    </>
  );
};
