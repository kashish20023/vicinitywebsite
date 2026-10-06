export interface GuestReplyDraftRequestDto {
  propertyId: string;
  guestUserId: string;
  instruction?: string;
  tone?: 'FRIENDLY' | 'FORMAL' | 'CONCISE';
  language?: 'ENGLISH' | 'HINGLISH';
}

export interface GuestReplyDraftResponseDto {
  draftReply: string;
  groundedPoints: string[];
  caveats: string[];
  requiresHumanReview: boolean;
  generatedAt: string;
}
