import React, { useContext, useState } from 'react';
import { Text, TextType } from '../../../text/Text';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { PreliminaryWorkRadioGroup } from './PreliminaryWorkRadioGroup';
import { TextArea } from '../../../text/TextArea';
import { Title, TitleType } from '../../../text/Title';
import { AddAttachmentButton } from '../AddAttachmentButton';
import { ReferralAttachment, RequesterUnitType } from '../../../../types';
import { useParams } from 'react-router-dom';
import { ReferralDetailRouteParams } from '../../../ReferralDetail';
import { ReferralFormContext } from '../../../../data/providers/ReferralFormProvider';
import { ReferralContext } from '../../../../data/providers/ReferralProvider';
import { InputText } from '../../../text/InputText';
import { ExternalLink } from '../../../dsfr/ExternalLink';
import { FileIcon } from '../../../Icons';

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
  const { setValue } = useContext(ReferralFormContext);
  const [preliminaryWork, setPreliminaryWork] = useState<string>('');
  const { referralId } = useParams<ReferralDetailRouteParams>();
  const { referral } = useContext(ReferralContext);
  const intl = useIntl();

  return (
    <>
      {referral && (
        <section className="space-y-2">
          <Title type={TitleType.H6}>
            <FormattedMessage {...messages.preliminaryWorkTitle} />
          </Title>
          <Text type={TextType.PARAGRAPH_SMALL}>
            {/* TODO Remove if and get the text by key */}
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
            onChange={(value) => setPreliminaryWork(value)}
          />

          {preliminaryWork === 'yes' && (
            <>
              {referral.requester_unit_type ===
                RequesterUnitType.DECENTRALISED_UNIT && (
                <>
                  <Text type={TextType.PARAGRAPH_SMALL}>
                    <FormattedMessage {...messages.emailInputDescription} />
                  </Text>
                  <InputText
                    placeholder={intl.formatMessage(
                      messages.emailInputPlaceholder,
                    )}
                    onChange={(value: string) => {
                      setValue('contact', value);
                    }}
                  />
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
              <TextArea rows={7} />
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
                onSuccess={(data) => console.log(data)}
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

          {preliminaryWork === 'no' && (
            <>
              {referral.requester_unit_type ===
                RequesterUnitType.DECENTRALISED_UNIT && (
                <>
                  <div className="border-l-2 border-warning-400 pl-3 leading-6">
                    <Text type={TextType.SPAN_SMALL}>
                      La saisie de votre direction métier est une démarche
                      préalable obligatoire à la saisie des services de la
                      direction des affaires juridiques.
                    </Text>
                    <ExternalLink
                      link={'https://documentation.partaj.beta.gouv.fr/'}
                      text="font-light text-sm"
                      icon="w-3 h-3"
                      className="inline-flex ml-2"
                    >
                      Voir le guide de saisine de la DAJ
                    </ExternalLink>
                    <Text
                      type={TextType.PARAGRAPH_SMALL}
                      className="text-sm font-light"
                    >
                      Si vous rencontrez des difficultés pour savoir à qui vous
                      adresser, merci de contacter l’adresse suivante
                      pcnt.daj.sg@developpement-durable.gouv.fr
                    </Text>
                  </div>
                  <div className="space-y-2">
                    <Text type={TextType.PARAGRAPH_SMALL}>
                      Si vous souhaitez continuer cette démarche, merci de bien
                      vouloir justifier l’absence exceptionnelle de saisine
                      préalable.
                    </Text>
                    <TextArea rows={5} />
                  </div>
                </>
              )}
            </>
          )}
        </section>
      )}
    </>
  );
};
