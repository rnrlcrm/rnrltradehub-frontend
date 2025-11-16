/**
 * Delay Monitoring and Red Flag Service
 * Monitors all trade activities for delays and triggers red flags
 */

import NotificationService from './notificationService';

export interface TradeActivity {
  id: string;
  type: 'invoice_upload' | 'payment_due' | 'delivery' | 'lorry_loading' | 'emd_payment' | 'document_submission' | 'quality_check' | 'contract_execution';
  contractId: string;
  contractNo: string;
  partyId: string;
  partyName: string;
  partyType: 'buyer' | 'seller' | 'controller' | 'transporter';
  expectedDate: string;
  actualDate?: string;
  status: 'pending' | 'completed' | 'delayed' | 'severely_delayed';
  sla: number; // SLA in days
  currentDelay: number; // Days delayed
  description: string;
}

export interface RedFlag {
  id: string;
  activityId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'delay' | 'payment_overdue' | 'document_missing' | 'quality_issue' | 'compliance_breach';
  title: string;
  description: string;
  affectedParties: string[];
  raisedAt: string;
  resolvedAt?: string;
  status: 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'escalated';
  actionTaken?: string;
  escalationLevel: number; // 0 = not escalated, 1 = first reminder, 2 = second reminder, etc.
}

export interface DailyProgressReport {
  date: string;
  totalActivities: number;
  pendingActivities: number;
  completedActivities: number;
  delayedActivities: number;
  severelyDelayedActivities: number;
  redFlagsRaised: number;
  criticalRedFlags: number;
  activities: TradeActivity[];
  redFlags: RedFlag[];
  summary: string;
}

/**
 * Delay Monitoring Service Class
 */
export class DelayMonitoringService {
  /**
   * Check activity for delays and generate red flags
   */
  static checkActivityDelay(activity: TradeActivity): RedFlag | null {
    const expectedDate = new Date(activity.expectedDate);
    const currentDate = activity.actualDate ? new Date(activity.actualDate) : new Date();
    
    const daysElapsed = Math.floor(
      (currentDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    activity.currentDelay = Math.max(0, daysElapsed);

    // Determine status and severity
    if (activity.currentDelay === 0) {
      activity.status = activity.actualDate ? 'completed' : 'pending';
      return null; // No red flag
    }

    let severity: RedFlag['severity'];
    let escalationLevel = 0;

    if (activity.currentDelay > activity.sla * 2) {
      activity.status = 'severely_delayed';
      severity = 'critical';
      escalationLevel = Math.floor(activity.currentDelay / activity.sla);
    } else if (activity.currentDelay > activity.sla) {
      activity.status = 'delayed';
      severity = 'high';
      escalationLevel = 1;
    } else if (activity.currentDelay > activity.sla * 0.5) {
      activity.status = 'delayed';
      severity = 'medium';
    } else {
      activity.status = 'delayed';
      severity = 'low';
    }

    // Generate red flag
    const redFlag: RedFlag = {
      id: `RF-${Date.now()}-${activity.id}`,
      activityId: activity.id,
      severity,
      type: 'delay',
      title: `Delay in ${activity.type.replace('_', ' ')} for ${activity.contractNo}`,
      description: `${activity.description} is delayed by ${activity.currentDelay} days (SLA: ${activity.sla} days). Expected: ${activity.expectedDate}, Current: ${currentDate.toISOString().split('T')[0]}`,
      affectedParties: [activity.partyId],
      raisedAt: new Date().toISOString(),
      status: 'open',
      escalationLevel,
    };

    return redFlag;
  }

  /**
   * Monitor all trade activities and generate daily progress report
   */
  static async generateDailyProgressReport(
    activities: TradeActivity[]
  ): Promise<DailyProgressReport> {
    const redFlags: RedFlag[] = [];
    
    // Check each activity for delays
    for (const activity of activities) {
      const flag = this.checkActivityDelay(activity);
      if (flag) {
        redFlags.push(flag);
      }
    }

    const pending = activities.filter(a => a.status === 'pending').length;
    const completed = activities.filter(a => a.status === 'completed').length;
    const delayed = activities.filter(a => a.status === 'delayed').length;
    const severelyDelayed = activities.filter(a => a.status === 'severely_delayed').length;
    const critical = redFlags.filter(f => f.severity === 'critical').length;

    const summary = this.generateSummaryText(activities, redFlags);

    const report: DailyProgressReport = {
      date: new Date().toISOString().split('T')[0],
      totalActivities: activities.length,
      pendingActivities: pending,
      completedActivities: completed,
      delayedActivities: delayed,
      severelyDelayedActivities: severelyDelayed,
      redFlagsRaised: redFlags.length,
      criticalRedFlags: critical,
      activities,
      redFlags,
      summary,
    };

    // Send notifications for critical red flags
    await this.sendRedFlagNotifications(redFlags);

    return report;
  }

  /**
   * Generate summary text for daily report
   */
  private static generateSummaryText(
    activities: TradeActivity[],
    redFlags: RedFlag[]
  ): string {
    const delayed = activities.filter(a => a.status === 'delayed' || a.status === 'severely_delayed');
    const critical = redFlags.filter(f => f.severity === 'critical');

    let summary = `Daily Trade Progress Summary:\n\n`;
    
    if (critical.length > 0) {
      summary += `🚨 CRITICAL ALERTS: ${critical.length} severe delays requiring immediate attention\n\n`;
      critical.forEach(flag => {
        summary += `  • ${flag.title}\n`;
      });
      summary += `\n`;
    }

    if (delayed.length > 0) {
      summary += `⚠️ DELAYED ACTIVITIES: ${delayed.length} activities behind schedule\n\n`;
      delayed.slice(0, 5).forEach(activity => {
        summary += `  • ${activity.description} - ${activity.currentDelay} days overdue\n`;
      });
      if (delayed.length > 5) {
        summary += `  ... and ${delayed.length - 5} more\n`;
      }
    } else {
      summary += `✅ All activities are on track!\n`;
    }

    return summary;
  }

  /**
   * Send notifications for red flags
   */
  private static async sendRedFlagNotifications(redFlags: RedFlag[]): Promise<void> {
    for (const flag of redFlags) {
      if (flag.severity === 'critical' || flag.escalationLevel >= 2) {
        // Send to all affected parties and admins
        await NotificationService.sendOverdueAlert(
          {
            type: flag.type,
            id: flag.activityId,
          },
          {
            email: 'admin@rnrltradehub.com',
            type: 'admin',
          }
        );

        console.log(`🚨 RED FLAG: ${flag.title} - Escalation Level ${flag.escalationLevel}`);
      }
    }
  }

  /**
   * Check specific trade milestones
   */
  static checkTradeMilestones(contractId: string): TradeActivity[] {
    // Define standard trade milestones with SLAs
    const milestones: TradeActivity[] = [
      {
        id: `${contractId}-contract-sign`,
        type: 'contract_execution',
        contractId,
        contractNo: contractId,
        partyId: 'PARTY-001',
        partyName: 'Buyer',
        partyType: 'buyer',
        expectedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago
        status: 'pending',
        sla: 2,
        currentDelay: 0,
        description: 'Contract signing and execution',
      },
      {
        id: `${contractId}-emd`,
        type: 'emd_payment',
        contractId,
        contractNo: contractId,
        partyId: 'PARTY-001',
        partyName: 'Buyer',
        partyType: 'buyer',
        expectedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
        status: 'pending',
        sla: 7,
        currentDelay: 0,
        description: 'EMD payment',
      },
      {
        id: `${contractId}-loading`,
        type: 'lorry_loading',
        contractId,
        contractNo: contractId,
        partyId: 'PARTY-002',
        partyName: 'Seller',
        partyType: 'seller',
        expectedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending',
        sla: 15,
        currentDelay: 0,
        description: 'Lorry loading at seller location',
      },
      {
        id: `${contractId}-invoice`,
        type: 'invoice_upload',
        contractId,
        contractNo: contractId,
        partyId: 'PARTY-002',
        partyName: 'Seller',
        partyType: 'seller',
        expectedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending',
        sla: 1,
        currentDelay: 0,
        description: 'Invoice upload after loading',
      },
      {
        id: `${contractId}-delivery`,
        type: 'delivery',
        contractId,
        contractNo: contractId,
        partyId: 'PARTY-003',
        partyName: 'Transporter',
        partyType: 'transporter',
        expectedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending',
        sla: 7,
        currentDelay: 0,
        description: 'Delivery to buyer location',
      },
      {
        id: `${contractId}-payment`,
        type: 'payment_due',
        contractId,
        contractNo: contractId,
        partyId: 'PARTY-001',
        partyName: 'Buyer',
        partyType: 'buyer',
        expectedDate: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending',
        sla: 15,
        currentDelay: 0,
        description: 'Payment to seller',
      },
    ];

    return milestones;
  }

  /**
   * Schedule daily progress reminders
   */
  static scheduleDailyReminders(): void {
    console.log('📅 Daily progress reminders scheduled');
    
    // In production, this would be a cron job or scheduled task
    // For demo, store schedule
    const schedule = {
      frequency: 'daily',
      time: '09:00', // 9 AM daily
      enabled: true,
      lastRun: null,
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    localStorage.setItem('dailyReminderSchedule', JSON.stringify(schedule));
  }

  /**
   * Get overdue activities summary
   */
  static getOverdueSummary(activities: TradeActivity[]): {
    byType: Record<string, number>;
    byParty: Record<string, number>;
    bySeverity: Record<string, number>;
    total: number;
  } {
    const overdue = activities.filter(a => 
      a.status === 'delayed' || a.status === 'severely_delayed'
    );

    const byType: Record<string, number> = {};
    const byParty: Record<string, number> = {};
    const bySeverity: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    overdue.forEach(activity => {
      // By type
      byType[activity.type] = (byType[activity.type] || 0) + 1;
      
      // By party
      byParty[activity.partyName] = (byParty[activity.partyName] || 0) + 1;
      
      // By severity
      if (activity.status === 'severely_delayed') {
        bySeverity.critical++;
      } else if (activity.currentDelay > activity.sla) {
        bySeverity.high++;
      } else {
        bySeverity.medium++;
      }
    });

    return {
      byType,
      byParty,
      bySeverity,
      total: overdue.length,
    };
  }
}

export default DelayMonitoringService;
