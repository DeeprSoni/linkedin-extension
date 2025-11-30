export interface LinkedInProspect {
  id: string;
  name: string;
  headline: string;
  profileUrl: string;
  currentCompany?: string;
  location?: string;
  mutualConnections?: number;
  scannedAt: number;
  notes?: string;
  status: 'new' | 'reviewed' | 'connected' | 'skipped';
  tags?: string[];
  priorityScore?: number;
}

export interface PrioritySettings {
  keywordScores: { [keyword: string]: number };
  locationScores: { [location: string]: number };
  companyScores: { [company: string]: number };
  mutualConnectionWeight: number;
  minMutualConnections: number;
}

export interface ScanStats {
  totalScanned: number;
  lastScanDate: number;
  newProspectsCount: number;
}

export interface StorageData {
  prospects: LinkedInProspect[];
  stats: ScanStats;
}

export interface ScanMessage {
  type: 'SCAN_START' | 'SCAN_PROGRESS' | 'SCAN_COMPLETE' | 'SCAN_ERROR';
  data?: any;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  createdAt: number;
}

export interface CampaignContact {
  prospectId: string;
  status: 'pending' | 'opened' | 'messaged' | 'skipped';
  openedAt?: number;
  messagedAt?: number;
}

export interface MessageCampaign {
  id: string;
  name: string;
  templateId?: string;
  customMessage?: string;
  contacts: CampaignContact[];
  createdAt: number;
  stats: {
    total: number;
    pending: number;
    opened: number;
    messaged: number;
    skipped: number;
  };
}
