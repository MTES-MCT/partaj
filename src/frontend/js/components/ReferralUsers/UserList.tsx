import React from 'react';
import { FormattedMessage } from 'react-intl';
import { DescriptionText } from '../styled/text/DescriptionText';
import { Message } from '../../types';

interface UsersBlockProps {
  title: Message;
  description: Message;
  showList: boolean;
  children: any;
}

export const UserList: React.FC<UsersBlockProps> = ({
  title,
  description,
  children,
  showList,
}) => {
  return (
    <>
      <div className="space-y-2">
        <div>
          <div className="font-semibold">
            <FormattedMessage {...title} />
          </div>
          <DescriptionText>
            <FormattedMessage {...description} />
          </DescriptionText>
        </div>
        {showList && <ul className="list-group">{children}</ul>}
      </div>
    </>
  );
};
