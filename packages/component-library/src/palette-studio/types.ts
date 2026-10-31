export interface CtaTokens {
  readonly background: string;
  readonly foreground: string;
  readonly hover: string;
  readonly border: string;
}

export interface StatusTokens {
  readonly success: string;
  readonly successBg: string;
  readonly warning: string;
  readonly warningBg: string;
  readonly danger: string;
  readonly dangerBg: string;
  readonly info: string;
  readonly infoBg: string;
}

export interface DisabledTokens {
  readonly bg: string;
  readonly fg: string;
}

export interface PaletteTokenSet {
  readonly canvas: string;
  readonly panel: string;
  readonly raised: string;
  readonly rail: string;
  readonly borderSubtle: string;
  readonly borderStrong: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly hover: string;
  readonly brand: string;
  readonly brandText: string;
  readonly brandWash: string;
  readonly selection: string;
  readonly selectionEdge: string;
  readonly soft: string;
  readonly focus: string;
  readonly focusGap: string;
  readonly link: string;
  readonly onBrand: string;
  readonly cta: CtaTokens;
  readonly statuses: StatusTokens;
  readonly disabled: DisabledTokens;
}

export type PaletteCategory =
  | 'approved'
  | 'new-direction'
  | 'historical-regional'
  | 'historical-brand'
  | 'historical-orange-brand'
  | 'historical-complete'
  | 'historical-orange'
  | 'historical-study';

export type PaletteTag =
  | 'Approved baseline'
  | 'New design-studio proposal'
  | 'Historical candidate'
  | 'Previously rejected'
  | 'Derived/reconstructed';

export type ReviewStatus =
  | 'Approved'
  | 'Shortlist'
  | 'Conditional'
  | 'Challenge'
  | 'Rejected'
  | 'Archived';

export interface PaletteScores {
  readonly identity: number;
  readonly legibility: number;
  readonly coherence: number;
  readonly states: number;
  readonly accessibility: number;
  readonly weighted: number;
}

export interface PaletteDefinition {
  readonly id: string;
  readonly name: string;
  readonly category: PaletteCategory;
  readonly tag: PaletteTag;
  readonly reviewStatus: ReviewStatus;
  readonly thesis: string;
  readonly distinctiveFeature: string;
  readonly bestCase: string;
  readonly adversarialRisk: string;
  readonly rejectionReason?: string;
  readonly provenance: string;
  readonly scores: PaletteScores;
  readonly light: PaletteTokenSet;
  readonly dark: PaletteTokenSet;
}
