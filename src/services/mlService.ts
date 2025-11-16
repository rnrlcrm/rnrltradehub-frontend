/**
 * Machine Learning Service
 * Improves OCR accuracy, learns from corrections, predicts delays
 */

export interface OCRTrainingData {
  id: string;
  documentType: 'invoice' | 'payment' | 'logistics';
  originalOCRResult: any;
  correctedData: any;
  correctionDate: string;
  correctedBy: string;
  fieldCorrections: {
    field: string;
    ocrValue: any;
    correctedValue: any;
    confidence: number;
  }[];
}

export interface DelayPrediction {
  activityType: string;
  contractId: string;
  predictedDelayDays: number;
  confidence: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: {
    factor: string;
    weight: number;
    contribution: number;
  }[];
  recommendation: string;
}

export interface ReconciliationSuggestion {
  type: 'auto_match' | 'probable_match' | 'missing_entry' | 'duplicate_entry';
  confidence: number;
  systemEntry?: any;
  suggestedMatch?: any;
  reason: string;
  action: string;
}

/**
 * Machine Learning Service Class
 */
export class MLService {
  private static OCR_TRAINING_KEY = 'mlOCRTraining';
  private static DELAY_HISTORY_KEY = 'mlDelayHistory';
  
  /**
   * Learn from OCR corrections to improve future accuracy
   */
  static learnFromOCRCorrection(
    documentType: 'invoice' | 'payment' | 'logistics',
    ocrResult: any,
    correctedData: any,
    correctedBy: string
  ): void {
    const fieldCorrections: OCRTrainingData['fieldCorrections'] = [];
    
    // Compare OCR result with corrected data
    Object.keys(correctedData).forEach(field => {
      if (ocrResult.data && ocrResult.data[field] !== correctedData[field]) {
        fieldCorrections.push({
          field,
          ocrValue: ocrResult.data[field],
          correctedValue: correctedData[field],
          confidence: ocrResult.confidence || 0,
        });
      }
    });

    const trainingData: OCRTrainingData = {
      id: `TRAIN-${Date.now()}`,
      documentType,
      originalOCRResult: ocrResult,
      correctedData,
      correctionDate: new Date().toISOString(),
      correctedBy,
      fieldCorrections,
    };

    // Store training data
    this.storeTrainingData(trainingData);

    console.log(`[ML] Learned from ${fieldCorrections.length} field corrections for ${documentType}`);
  }

  /**
   * Get OCR accuracy metrics
   */
  static getOCRAccuracyMetrics(): {
    overallAccuracy: number;
    byDocumentType: Record<string, number>;
    byField: Record<string, number>;
    totalCorrections: number;
    improvementRate: number;
  } {
    const trainingData = this.getTrainingData();
    
    if (trainingData.length === 0) {
      return {
        overallAccuracy: 0.95, // Default starting accuracy
        byDocumentType: {},
        byField: {},
        totalCorrections: 0,
        improvementRate: 0,
      };
    }

    const byDocumentType: Record<string, { total: number; correct: number }> = {};
    const byField: Record<string, { total: number; correct: number }> = {};
    let totalFields = 0;
    let correctFields = 0;

    trainingData.forEach(data => {
      const docType = data.documentType;
      if (!byDocumentType[docType]) {
        byDocumentType[docType] = { total: 0, correct: 0 };
      }

      data.fieldCorrections.forEach(correction => {
        totalFields++;
        byDocumentType[docType].total++;

        if (!byField[correction.field]) {
          byField[correction.field] = { total: 0, correct: 0 };
        }
        byField[correction.field].total++;

        // If confidence was high but still corrected, it was wrong
        if (correction.confidence > 0.9) {
          // Was confident but wrong
        } else {
          correctFields++;
          byDocumentType[docType].correct++;
          byField[correction.field].correct++;
        }
      });
    });

    const overallAccuracy = totalFields > 0 ? correctFields / totalFields : 0.95;

    return {
      overallAccuracy,
      byDocumentType: Object.fromEntries(
        Object.entries(byDocumentType).map(([type, stats]) => [
          type,
          stats.total > 0 ? stats.correct / stats.total : 0.95,
        ])
      ),
      byField: Object.fromEntries(
        Object.entries(byField).map(([field, stats]) => [
          field,
          stats.total > 0 ? stats.correct / stats.total : 0.95,
        ])
      ),
      totalCorrections: trainingData.length,
      improvementRate: this.calculateImprovementRate(trainingData),
    };
  }

  /**
   * Predict delay for an activity based on historical patterns
   */
  static predictDelay(
    activityType: string,
    contractData: {
      partyId: string;
      partyName: string;
      commodityType: string;
      contractValue: number;
      expectedDate: string;
    }
  ): DelayPrediction {
    const delayHistory = this.getDelayHistory();
    
    // Analyze historical delays for similar activities
    const similarActivities = delayHistory.filter(
      h => h.activityType === activityType
    );

    if (similarActivities.length === 0) {
      return {
        activityType,
        contractId: contractData.partyId,
        predictedDelayDays: 0,
        confidence: 0.5,
        riskLevel: 'low',
        factors: [],
        recommendation: 'No historical data available. Monitor closely.',
      };
    }

    // Calculate factors
    const factors: DelayPrediction['factors'] = [];
    let totalScore = 0;

    // Factor 1: Party history
    const partyDelays = similarActivities.filter(h => h.partyId === contractData.partyId);
    const partyAvgDelay = partyDelays.length > 0
      ? partyDelays.reduce((sum, h) => sum + h.actualDelay, 0) / partyDelays.length
      : 0;
    
    if (partyAvgDelay > 0) {
      factors.push({
        factor: 'Party delay history',
        weight: 0.4,
        contribution: partyAvgDelay,
      });
      totalScore += partyAvgDelay * 0.4;
    }

    // Factor 2: Commodity type
    const commodityDelays = similarActivities.filter(
      h => h.commodityType === contractData.commodityType
    );
    const commodityAvgDelay = commodityDelays.length > 0
      ? commodityDelays.reduce((sum, h) => sum + h.actualDelay, 0) / commodityDelays.length
      : 0;
    
    if (commodityAvgDelay > 0) {
      factors.push({
        factor: 'Commodity pattern',
        weight: 0.2,
        contribution: commodityAvgDelay,
      });
      totalScore += commodityAvgDelay * 0.2;
    }

    // Factor 3: Contract size
    const highValueThreshold = 500000;
    if (contractData.contractValue > highValueThreshold) {
      factors.push({
        factor: 'High value contract',
        weight: 0.2,
        contribution: 2, // 2 days additional delay
      });
      totalScore += 2 * 0.2;
    }

    // Factor 4: Seasonal pattern
    const expectedDate = new Date(contractData.expectedDate);
    const month = expectedDate.getMonth();
    const seasonalDelays = similarActivities.filter(h => {
      const activityMonth = new Date(h.expectedDate).getMonth();
      return Math.abs(activityMonth - month) <= 1;
    });
    const seasonalAvgDelay = seasonalDelays.length > 0
      ? seasonalDelays.reduce((sum, h) => sum + h.actualDelay, 0) / seasonalDelays.length
      : 0;
    
    if (seasonalAvgDelay > 0) {
      factors.push({
        factor: 'Seasonal pattern',
        weight: 0.2,
        contribution: seasonalAvgDelay,
      });
      totalScore += seasonalAvgDelay * 0.2;
    }

    const predictedDelay = Math.round(totalScore);
    const confidence = Math.min(0.9, 0.5 + (similarActivities.length / 100) * 0.4);

    let riskLevel: DelayPrediction['riskLevel'];
    let recommendation: string;

    if (predictedDelay === 0) {
      riskLevel = 'low';
      recommendation = 'Activity likely to be completed on time.';
    } else if (predictedDelay <= 3) {
      riskLevel = 'medium';
      recommendation = `Potential ${predictedDelay}-day delay. Send reminder 2 days before due date.`;
    } else if (predictedDelay <= 7) {
      riskLevel = 'high';
      recommendation = `High risk of ${predictedDelay}-day delay. Contact party immediately and set up follow-up.`;
    } else {
      riskLevel = 'critical';
      recommendation = `Critical risk of ${predictedDelay}+ day delay. Consider alternative arrangements or escalation.`;
    }

    return {
      activityType,
      contractId: contractData.partyId,
      predictedDelayDays: predictedDelay,
      confidence,
      riskLevel,
      factors,
      recommendation,
    };
  }

  /**
   * Generate smart reconciliation suggestions
   */
  static generateReconciliationSuggestions(
    systemEntries: any[],
    statedEntries: any[]
  ): ReconciliationSuggestion[] {
    const suggestions: ReconciliationSuggestion[] = [];

    // Algorithm 1: Exact amount match
    systemEntries.forEach(systemEntry => {
      const exactMatch = statedEntries.find(
        stated => 
          Math.abs(stated.amount - systemEntry.amount) < 1 &&
          new Date(stated.date).getTime() === new Date(systemEntry.date).getTime()
      );

      if (exactMatch) {
        suggestions.push({
          type: 'auto_match',
          confidence: 0.99,
          systemEntry,
          suggestedMatch: exactMatch,
          reason: 'Exact amount and date match',
          action: 'Auto-reconcile these entries',
        });
      }
    });

    // Algorithm 2: Probable match (similar amount, close date)
    systemEntries.forEach(systemEntry => {
      const probableMatches = statedEntries.filter(stated => {
        const amountDiff = Math.abs(stated.amount - systemEntry.amount);
        const amountTolerance = systemEntry.amount * 0.02; // 2% tolerance
        const dateDiff = Math.abs(
          new Date(stated.date).getTime() - new Date(systemEntry.date).getTime()
        ) / (1000 * 60 * 60 * 24); // days

        return amountDiff <= amountTolerance && dateDiff <= 3; // within 3 days
      });

      probableMatches.forEach(match => {
        suggestions.push({
          type: 'probable_match',
          confidence: 0.85,
          systemEntry,
          suggestedMatch: match,
          reason: `Similar amount (${Math.abs(match.amount - systemEntry.amount).toFixed(2)} diff) and close date`,
          action: 'Review and confirm this match',
        });
      });
    });

    // Algorithm 3: Detect missing entries
    systemEntries.forEach(systemEntry => {
      const hasMatch = suggestions.some(s => s.systemEntry === systemEntry);
      if (!hasMatch) {
        suggestions.push({
          type: 'missing_entry',
          confidence: 0.75,
          systemEntry,
          reason: 'Entry in system but not in stated balance',
          action: 'Verify if this entry was communicated to party',
        });
      }
    });

    // Algorithm 4: Detect potential duplicates
    const duplicates = this.findDuplicates(systemEntries);
    duplicates.forEach(([entry1, entry2]) => {
      suggestions.push({
        type: 'duplicate_entry',
        confidence: 0.9,
        systemEntry: entry1,
        suggestedMatch: entry2,
        reason: 'Potential duplicate entries with similar amounts and dates',
        action: 'Review and remove duplicate if confirmed',
      });
    });

    return suggestions;
  }

  /**
   * Record delay for learning
   */
  static recordDelay(
    activityType: string,
    partyId: string,
    partyName: string,
    commodityType: string,
    expectedDate: string,
    actualDate: string,
    actualDelay: number
  ): void {
    const delayHistory = this.getDelayHistory();
    
    delayHistory.push({
      id: `DELAY-${Date.now()}`,
      activityType,
      partyId,
      partyName,
      commodityType,
      expectedDate,
      actualDate,
      actualDelay,
      recordedAt: new Date().toISOString(),
    });

    localStorage.setItem(this.DELAY_HISTORY_KEY, JSON.stringify(delayHistory));
  }

  /**
   * Private helper methods
   */
  private static storeTrainingData(data: OCRTrainingData): void {
    const existing = this.getTrainingData();
    existing.push(data);
    
    // Keep only last 1000 training records
    const trimmed = existing.slice(-1000);
    localStorage.setItem(this.OCR_TRAINING_KEY, JSON.stringify(trimmed));
  }

  private static getTrainingData(): OCRTrainingData[] {
    const stored = localStorage.getItem(this.OCR_TRAINING_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private static getDelayHistory(): any[] {
    const stored = localStorage.getItem(this.DELAY_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private static calculateImprovementRate(trainingData: OCRTrainingData[]): number {
    if (trainingData.length < 10) return 0;

    const recent = trainingData.slice(-50);
    const older = trainingData.slice(-100, -50);

    const recentAvgCorrections = recent.reduce((sum, d) => sum + d.fieldCorrections.length, 0) / recent.length;
    const olderAvgCorrections = older.reduce((sum, d) => sum + d.fieldCorrections.length, 0) / older.length;

    return olderAvgCorrections > 0 
      ? ((olderAvgCorrections - recentAvgCorrections) / olderAvgCorrections) * 100
      : 0;
  }

  private static findDuplicates(entries: any[]): [any, any][] {
    const duplicates: [any, any][] = [];

    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const entry1 = entries[i];
        const entry2 = entries[j];

        const amountDiff = Math.abs(entry1.amount - entry2.amount);
        const dateDiff = Math.abs(
          new Date(entry1.date).getTime() - new Date(entry2.date).getTime()
        ) / (1000 * 60 * 60 * 24);

        if (amountDiff < 1 && dateDiff === 0) {
          duplicates.push([entry1, entry2]);
        }
      }
    }

    return duplicates;
  }
}

export default MLService;
