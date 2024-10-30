import React, { useContext, useEffect, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { useReferralAction } from '../../../../data';
import * as types from '../../../../types';
import { SearchUniqueSelect } from '../../../select/SearchUniqueSelect';
import { useTopicList } from '../../../../data/topics';
import { ReferralContext } from '../../../../data/providers/ReferralProvider';
import { Title, TitleType } from '../../../text/Title';
import { Text, TextType } from '../../../text/Text';
import { getUserFullname } from '../../../../utils/user';
import {
  calcTopicItemDepth,
  getTopicItemAttributes,
} from '../../../../utils/topics';
import { Topic } from '../../../../types';
import { FormSection } from '../FormSection';
import { ReferralFormContext } from '../../../../data/providers/ReferralFormProvider';
import { ErrorIcon } from '../../../Icons';

const messages = defineMessages({
  description: {
    defaultMessage:
      'Broad topic to help direct the referral to the appropriate office',
    description: 'Description for the topic field in the referral form',
    id: 'components.TopicSection.description',
  },
  mandatory: {
    defaultMessage:
      'This field is mandatory. Please select a topic in the list.',
    description:
      'Error message showed when topic field has an invalid value in the referral form',
    id: 'components.TopicSection.mandatory',
  },
  unitOwnerInformations: {
    defaultMessage:
      '{unitOwnerCount, plural, one { {name} will be notified of this referral.} other { {restNames} and {lastName} will be notified of this referral.} }',
    description: 'Unit owner information.',
    id: 'components.TopicSection.unitOwnerInformations',
  },
});

export const TopicSection: React.FC<{ title: string }> = ({ title }) => {
  const { referral, setReferral } = useContext(ReferralContext);
  const [options, setOptions] = useState<types.Topic[]>([]);
  const topicListMutation = useTopicList({
    onSuccess: (data: any) => {
      setOptions(data.results);
    },
  });

  const { errors } = useContext(ReferralFormContext);
  const [hasError, setHasError] = useState<boolean>(false);

  const referralMutation = useReferralAction({
    onSuccess: (data) => {
      setReferral(data);
    },
  });

  useEffect(() => {
    if (options.length === 0 && topicListMutation.isIdle) {
      topicListMutation.mutate({ query: '' });
    }
  });

  useEffect(() => {
    setHasError(errors.hasOwnProperty('topic'));
  }, [errors]);

  return (
    <FormSection hasError={hasError}>
      <Title
        type={TitleType.H6}
        className={hasError ? 'text-dsfr-danger-500' : 'text-black'}
      >
        {title}
      </Title>
      <Text
        type={TextType.PARAGRAPH_SMALL}
        className={hasError ? 'text-dsfr-danger-500' : 'text-black'}
      >
        <FormattedMessage {...messages.description} />
      </Text>
      {referral && (
        <>
          <SearchUniqueSelect
            identifier="topic"
            getItemAttributes={(option: Topic) =>
              option.path && getTopicItemAttributes(option.path.length / 4)
            }
            onOptionClick={(topicId: string) => {
              referralMutation.mutate({
                action: 'update_topic',
                payload: {
                  topic: topicId,
                },
                referral,
              });
            }}
            options={options}
            activeOption={referral.topic}
            hasError={hasError}
          />
          {hasError && (
            <div className="flex items-center space-x-1">
              <ErrorIcon className="fill-dsfr-danger-500" />
              <Text
                type={TextType.SPAN_SUPER_SMALL}
                className="text-dsfr-danger-500 font-normal"
              >
                <FormattedMessage {...messages.mandatory} />
              </Text>
            </div>
          )}
          {referral.topic?.owners.length > 0 && (
            <Text type={TextType.PARAGRAPH_SMALL}>
              <FormattedMessage
                {...messages.unitOwnerInformations}
                values={{
                  unitOwnerCount: referral.topic.owners.length,
                  lastName: (
                    <b>
                      {getUserFullname(
                        referral.topic.owners[referral.topic.owners.length - 1],
                      )}
                    </b>
                  ),
                  restNames: (
                    <b>
                      {referral.topic.owners
                        .slice(0, -1)
                        .map((membership) => getUserFullname(membership))
                        .join(', ')}
                    </b>
                  ),
                  name: <b>{getUserFullname(referral.topic.owners[0])}</b>,
                }}
              />
            </Text>
          )}
        </>
      )}
    </FormSection>
  );
};
