import React, { useContext, useEffect, useState } from 'react';
import { Text, TextType } from '../../../../text/Text';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { PreliminaryWorkRadioGroup } from '../PreliminaryWorkRadioGroup';
import { TextArea } from '../../../../text/TextArea';
import { Title, TitleType } from '../../../../text/Title';
import { AddAttachmentButton } from '../../AddAttachmentButton';
import {
  Referral,
  ReferralAttachment,
  RequesterUnitType,
} from '../../../../../types';
import { useParams } from 'react-router-dom';
import { ReferralDetailRouteParams } from '../../../../ReferralDetail';
import { ReferralFormContext } from '../../../../../data/providers/ReferralFormProvider';
import { ReferralContext } from '../../../../../data/providers/ReferralProvider';
import { InputText } from '../../../../text/InputText';
import { ExternalLink } from '../../../../dsfr/ExternalLink';
import { usePatchReferralAction } from '../../../../../data/referral';
import { ErrorIcon, FileIcon } from '../../../../Icons';
import { FormSection } from '../../FormSection';

const messages = defineMessages({
  preliminaryWorkTitle: {
    defaultMessage: 'preliminary work',
    description: 'Label for the topic field in the referral form',
    id: 'components.PreliminaryWorkSection.preliminaryWorkTitle',
  },
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
});

export const PreliminaryWorkSection: React.FC = () => {
  const { setValue, errors } = useContext(ReferralFormContext);
  const { referralId } = useParams<ReferralDetailRouteParams>();
  const { referral, setReferral } = useContext(ReferralContext);
  const [hasPWEmptyError, setHasPWEmptyError] = useState<boolean>(false);
  const [hasPWNoContactError, setHasPWNoContactError] = useState<boolean>(
    false,
  );

  const intl = useIntl();
  const preliminaryWorkMutation = usePatchReferralAction();
  const patchReferralMutation = usePatchReferralAction();

  useEffect(() => {
    setHasPWEmptyError(errors.hasOwnProperty('preliminary_work_empty'));
    setHasPWNoContactError(
      errors.hasOwnProperty('preliminary_work_no_contact'),
    );
  }, [errors]);

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
        <FormSection hasError={hasPWEmptyError || hasPWNoContactError}>
          <Title
            type={TitleType.H6}
            className={
              hasPWEmptyError || hasPWNoContactError
                ? 'text-dsfr-danger-500'
                : 'text-black'
            }
          >
            <FormattedMessage {...messages.preliminaryWorkTitle} />
          </Title>
          <Text
            className={hasPWEmptyError ? 'text-dsfr-danger-500' : 'text-black'}
            type={TextType.PARAGRAPH_SMALL}
          >
            <FormattedMessage {...messages.preliminaryWorkCentralDescription} />
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
                Veuillez indiquer si vous avez effectué un travail préalable.
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
                    type={TextType.PARAGRAPH_SMALL}
                  >
                    <FormattedMessage {...messages.emailInputDescription} />
                  </Text>
                  <InputText
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
                        Veuillez renseigner le champ du courriel de votre
                        contact
                      </Text>
                    </div>
                  )}
                </>
              )}

              {/* TODO Remove if and get the text by key */}
              <Text type={TextType.PARAGRAPH_SMALL}>
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
                defaultValue={referral.prior_work}
                rows={7}
                onDebounce={(value: string) => {
                  updatePriorWork(value);
                }}
              />
              <Text type={TextType.PARAGRAPH_SMALL}>
                {/* TODO Remove if and get the text by key */}
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
                    Supprimer
                  </span>
                </div>
              ))}
            </>
          )}
        </FormSection>
      )}
    </>
  );
};
