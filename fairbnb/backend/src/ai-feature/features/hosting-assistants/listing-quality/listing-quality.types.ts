export interface ListingQualityRequestDto {
  propertyId: string;
  generateDescriptionDraft?: boolean;
  targetAudience?: 'FAMILIES' | 'REMOTE_WORKERS' | 'COUPLES' | 'GENERAL';
}

export interface ListingQualityFindingDto {
  category: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  message: string;
  suggestion: string;
}

export interface ListingDescriptionDraftDto {
  titleSuggestion?: string;
  shortDescriptionSuggestion?: string;
  fullDescriptionDraft: string;
  highlightedFacts: string[];
}

export interface ListingQualityResponseDto {
  overallScore: number; // 0 - 100
  completenessStatus: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT';
  findings: ListingQualityFindingDto[];
  descriptionDraft?: ListingDescriptionDraftDto | null;
  requiresHumanReview: boolean;
  evaluatedAt: string;
}
