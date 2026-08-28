export type Metrics = {
  reach?: number;          // alcance
  impressions?: number;    // impressões
  views?: number;          // visualizações (reels/tiktok/shorts)
  likes?: number;
  comments?: number;
  saves?: number;
  shares?: number;
  linkClicks?: number;
};

export type CreatorStatus = 'pendente' | 'comprovado' | 'atrasado';

export type PlanId = 'free' | 'solo' | 'agencia' | 'studio';

export type Agency = {
  id: string;
  email: string;
  name: string;
  color: string;
  plan: PlanId;
  createdAt: string;
};

export type Campaign = {
  id: string;
  agencyId: string;
  slug: string;
  agencyName: string;
  agencyColor: string;
  client: string;
  brand: string;
  briefing: string;
  postDeadline: string;   // YYYY-MM-DD
  proofDeadline: string;  // YYYY-MM-DD
  createdAt: string;
};

export type Creator = {
  id: string;
  campaignId: string;
  name: string;
  handle: string;
  email: string;
  whatsapp: string;
  deliverables: string;
  fee: number;            // cachê em BRL
  token: string;          // link mágico
  createdAt: string;
};

export type Submission = {
  id: string;
  creatorId: string;
  postUrl: string;
  screenshotUrl: string | null;
  metrics: Metrics;
  submittedAt: string;
  extractedByAi: boolean;
};

export type NudgeLog = {
  id: string;
  creatorId: string;
  kind: string;           // 'D-2' | 'D0' | 'D+1' | ...
  sentAt: string;
};

export type CreatorWithState = Creator & {
  submission: Submission | null;
  status: CreatorStatus;
  daysLate: number;
};
