import React from 'react';
import { NoteListContent } from './NoteListContent';
import { ReferralLite } from '../../types';

interface AssociatedReferralsModalContentProps {
  associatedReferrals?: ReferralLite[];
  referralId?: string;
}

export const AssociatedReferralsModalContent: React.FC<AssociatedReferralsModalContentProps> = ({
  associatedReferrals = [],
  referralId,
}) => {
  // This component wraps NoteListContent for modal display
  // associatedReferrals and referralId are available for future filtering if needed
  // Currently, the modal shows the full knowledge base without filtering

  return <NoteListContent />;
};
