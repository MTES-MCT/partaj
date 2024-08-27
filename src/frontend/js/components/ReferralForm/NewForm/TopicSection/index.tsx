import React, { useContext, useEffect, useState } from 'react';;
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';

import {useReferralAction} from '../../../../data';
import * as types from '../../../../types';

import { UserLite} from '../../../../types';
import { DescriptionText } from '../../../styled/text/DescriptionText';
import { SearchUniqueSelect } from '../../../select/SearchUniqueSelect';
import { useTopicList } from '../../../../data/topics';
import { ReferralContext } from '../../../../data/providers/ReferralProvider';
import {Title, TitleType} from "../../../text/Title";
import {Text, TextType} from "../../../text/Text";

const messages = defineMessages({
  description: {
    defaultMessage:
      'Broad topic to help direct the referral to the appropriate office',
    description: 'Description for the topic field in the referral form',
    id: 'components.ReferralForm.TopicField.description',
  },
  label: {
    defaultMessage: 'Referral topic',
    description: 'Label for the topic field in the referral form',
    id: 'components.ReferralForm.TopicField.label',
  },
  loadingTopics: {
    defaultMessage: 'Loading topics...',
    description:
      'Accessible text for the spinner while loading topics in the referral form',
    id: 'components.ReferralForm.TopicField.loadingTopics',
  },
  noItemsfound: {
    defaultMessage: 'There are no topics matching your search.',
    description: 'Error message when no items found on topics list',
    id: 'components.ReferralForm.TopicFields.noItemsfound',
  },
  invalid: {
    defaultMessage: 'The topic chosen is not valid. choose one from the list.',
    description:
      'Error message showed when topic field has an invalid value in the referral form',
    id: 'components.ReferralForm.TopicFields.invalid',
  },
  mandatory: {
    defaultMessage:
      'This field is mandatory. Please select a topic in the list.',
    description:
      'Error message showed when topic field has an invalid value in the referral form',
    id: 'components.ReferralForm.ReferralForm.mandatory',
  },
  UnitOwnerInformations: {
    defaultMessage:
      '{unitOwnerCount, plural, one { {name} will be notifed of this referral.} other { {restNames} and {lastName} will be notifed of this referral.} }',
    description: 'Unit owner information.',
    id: 'components.ReferralForm.TopicFields.UnitOwnerInformations',
  },
});

export const TopicSection: React.FC = () => {
  const { referral, setReferral } = useContext(ReferralContext);
  const [query, setQuery] = useState<string>('');
  const [options, setOptions] = useState<types.Topic[]>([]);
  const mutation = useTopicList({
    onSuccess: (data, variables, context) => {
      setOptions(data.results);
    },
  });

  const referralMutation = useReferralAction(
      { onSuccess: (data) => setReferral(data)}
  );

  useEffect(() => {
    mutation.mutate(
      {
        query,
      },
      {
        onSuccess: (results) => setOptions(results.results),
      },
    );
  }, [query]);

  useEffect(() => {
    if (options.length === 0 && mutation.isIdle) {
      mutation.mutate({ query });
    }
  });

  return (
    <section>
      <Title type={TitleType.H5}>
        <FormattedMessage {...messages.label} />
      </Title>
      <Text type={TextType.PARAGRAPH_SMALL}>
        <FormattedMessage {...messages.description} />
      </Text>
      {referral && (
        <>
          <SearchUniqueSelect
            identifier="topic"
            onSearchChange={(value: string) => {
              setQuery(value);
            }}
            onOptionClick={(topicId: string) => {
              referralMutation.mutate(
                  {
                    action: 'update_topic',
                    payload: {
                      topic: topicId,
                    },
                    referral,
                  }
                )
            }}
            options={options}
            activeOption={referral.topic}
          />
          <>
            {referral.topic && referral.topic.owners.map((user: UserLite) => (
              <span>{user.first_name} {user.last_name}</span>
            ))}
          </>
        </>
      )}
    </section>
  );
};
