import { LinkedInProspect, StorageData, ScanStats, PrioritySettings, MessageCampaign, MessageTemplate } from '../types';

export class StorageManager {
  private static PROSPECTS_KEY = 'linkedin_prospects';
  private static STATS_KEY = 'scan_stats';
  private static PRIORITY_SETTINGS_KEY = 'priority_settings';
  private static CAMPAIGNS_KEY = 'message_campaigns';
  private static TEMPLATES_KEY = 'message_templates';

  static async getProspects(): Promise<LinkedInProspect[]> {
    const result = await chrome.storage.local.get(this.PROSPECTS_KEY);
    return result[this.PROSPECTS_KEY] || [];
  }

  static async saveProspects(prospects: LinkedInProspect[]): Promise<void> {
    await chrome.storage.local.set({ [this.PROSPECTS_KEY]: prospects });
  }

  static async addProspects(newProspects: LinkedInProspect[]): Promise<void> {
    const existing = await this.getProspects();
    const existingIds = new Set(existing.map(p => p.id));

    // Only add truly new prospects
    const uniqueNew = newProspects.filter(p => !existingIds.has(p.id));

    if (uniqueNew.length > 0) {
      const updated = [...existing, ...uniqueNew];
      await this.saveProspects(updated);

      // Update stats
      const stats = await this.getStats();
      stats.totalScanned = updated.length;
      stats.newProspectsCount += uniqueNew.length;
      stats.lastScanDate = Date.now();
      await this.saveStats(stats);
    }
  }

  static async updateProspect(id: string, updates: Partial<LinkedInProspect>): Promise<void> {
    const prospects = await this.getProspects();
    const index = prospects.findIndex(p => p.id === id);

    if (index !== -1) {
      prospects[index] = { ...prospects[index], ...updates };
      await this.saveProspects(prospects);
    }
  }

  static async deleteProspect(id: string): Promise<void> {
    const prospects = await this.getProspects();
    const filtered = prospects.filter(p => p.id !== id);
    await this.saveProspects(filtered);
  }

  static async getStats(): Promise<ScanStats> {
    const result = await chrome.storage.local.get(this.STATS_KEY);
    return result[this.STATS_KEY] || {
      totalScanned: 0,
      lastScanDate: 0,
      newProspectsCount: 0
    };
  }

  static async saveStats(stats: ScanStats): Promise<void> {
    await chrome.storage.local.set({ [this.STATS_KEY]: stats });
  }

  static async clearAll(): Promise<void> {
    await chrome.storage.local.clear();
  }

  static async exportToCSV(): Promise<string> {
    const prospects = await this.getProspects();

    const headers = ['Name', 'Headline', 'Company', 'Location', 'Mutual Connections', 'Profile URL', 'Status', 'Notes', 'Tags'];
    const rows = prospects.map(p => [
      p.name,
      p.headline,
      p.currentCompany || '',
      p.location || '',
      p.mutualConnections?.toString() || '0',
      p.profileUrl,
      p.status,
      p.notes || '',
      p.tags?.join('; ') || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  static async getPrioritySettings(): Promise<PrioritySettings | null> {
    const result = await chrome.storage.local.get(this.PRIORITY_SETTINGS_KEY);
    return result[this.PRIORITY_SETTINGS_KEY] || null;
  }

  static async savePrioritySettings(settings: PrioritySettings): Promise<void> {
    await chrome.storage.local.set({ [this.PRIORITY_SETTINGS_KEY]: settings });
  }

  // Message Templates
  static async getTemplates(): Promise<MessageTemplate[]> {
    const result = await chrome.storage.local.get(this.TEMPLATES_KEY);
    return result[this.TEMPLATES_KEY] || [];
  }

  static async saveTemplates(templates: MessageTemplate[]): Promise<void> {
    await chrome.storage.local.set({ [this.TEMPLATES_KEY]: templates });
  }

  static async addTemplate(template: MessageTemplate): Promise<void> {
    const templates = await this.getTemplates();
    templates.push(template);
    await this.saveTemplates(templates);
  }

  static async deleteTemplate(id: string): Promise<void> {
    const templates = await this.getTemplates();
    const filtered = templates.filter(t => t.id !== id);
    await this.saveTemplates(filtered);
  }

  // Message Campaigns
  static async getCampaigns(): Promise<MessageCampaign[]> {
    const result = await chrome.storage.local.get(this.CAMPAIGNS_KEY);
    return result[this.CAMPAIGNS_KEY] || [];
  }

  static async saveCampaigns(campaigns: MessageCampaign[]): Promise<void> {
    await chrome.storage.local.set({ [this.CAMPAIGNS_KEY]: campaigns });
  }

  static async addCampaign(campaign: MessageCampaign): Promise<void> {
    const campaigns = await this.getCampaigns();
    campaigns.push(campaign);
    await this.saveCampaigns(campaigns);
  }

  static async updateCampaign(id: string, updates: Partial<MessageCampaign>): Promise<void> {
    const campaigns = await this.getCampaigns();
    const index = campaigns.findIndex(c => c.id === id);
    if (index !== -1) {
      campaigns[index] = { ...campaigns[index], ...updates };
      await this.saveCampaigns(campaigns);
    }
  }

  static async deleteCampaign(id: string): Promise<void> {
    const campaigns = await this.getCampaigns();
    const filtered = campaigns.filter(c => c.id !== id);
    await this.saveCampaigns(filtered);
  }
}
