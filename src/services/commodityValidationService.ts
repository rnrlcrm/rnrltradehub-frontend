/**
 * Commodity Validation Service
 * 
 * Comprehensive validation service that checks:
 * - Business rules
 * - Data integrity
 * - Security constraints
 * - Relationships
 */

import { Commodity, MasterDataItem, GstRate, StructuredTerm, CommissionStructure } from '../types';
import { detectSQLInjection, detectXSS } from './sanitization';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface CommodityUsageInfo {
  canDelete: boolean;
  canDeactivate: boolean;
  activeContractsCount: number;
  totalContractsCount: number;
  lastUsed?: string;
  blockReason?: string;
}

/**
 * Main Commodity Validation Service
 */
export class CommodityValidationService {
  /**
   * Validate all aspects of a commodity
   */
  static validateAll(
    commodity: Omit<Commodity, 'id'>,
    existingCommodities: Commodity[],
    masterData: {
      tradeTypes: MasterDataItem[];
      bargainTypes: MasterDataItem[];
      varieties: MasterDataItem[];
      weightmentTerms: MasterDataItem[];
      passingTerms: MasterDataItem[];
      deliveryTerms: StructuredTerm[];
      paymentTerms: StructuredTerm[];
      commissions: CommissionStructure[];
      gstRates: GstRate[];
    },
    editingId?: number
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // 1. Security validation
    const securityResult = this.validateSecurity(commodity);
    errors.push(...securityResult.errors);
    warnings.push(...securityResult.warnings);

    // 2. Business rules validation
    const businessResult = this.validateBusinessRules(commodity, existingCommodities, editingId);
    errors.push(...businessResult.errors);
    warnings.push(...businessResult.warnings);

    // 3. Relationship validation
    const relationshipResult = this.validateRelationships(commodity, masterData);
    errors.push(...relationshipResult.errors);
    warnings.push(...relationshipResult.warnings);

    // 4. Data integrity validation
    const integrityResult = this.validateDataIntegrity(commodity, existingCommodities, editingId);
    errors.push(...integrityResult.errors);
    warnings.push(...integrityResult.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate security constraints (XSS, SQL injection, etc.)
   */
  static validateSecurity(commodity: Omit<Commodity, 'id'>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Check name for malicious patterns
    if (detectSQLInjection(commodity.name)) {
      errors.push({
        field: 'name',
        message: 'Commodity name contains potentially harmful patterns',
        severity: 'error',
      });
    }

    if (detectXSS(commodity.name)) {
      errors.push({
        field: 'name',
        message: 'Commodity name contains script patterns that are not allowed',
        severity: 'error',
      });
    }

    // Check symbol for malicious patterns
    if (detectSQLInjection(commodity.symbol)) {
      errors.push({
        field: 'symbol',
        message: 'Symbol contains potentially harmful patterns',
        severity: 'error',
      });
    }

    // Check description for malicious patterns
    if (commodity.description && detectXSS(commodity.description)) {
      warnings.push({
        field: 'description',
        message: 'Description contains script patterns that will be sanitized',
        severity: 'warning',
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate business rules
   */
  static validateBusinessRules(
    commodity: Omit<Commodity, 'id'>,
    existingCommodities: Commodity[],
    editingId?: number
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Rule 1: Cotton must support CCI Terms
    if (commodity.name.toLowerCase().includes('cotton') && !commodity.supportsCciTerms) {
      errors.push({
        field: 'supportsCciTerms',
        message: 'Cotton commodities must support CCI Terms as per business policy',
        severity: 'error',
      });
    }

    // Rule 2: Only cotton can support CCI Terms
    if (!commodity.name.toLowerCase().includes('cotton') && commodity.supportsCciTerms) {
      errors.push({
        field: 'supportsCciTerms',
        message: 'Only Cotton commodities can support CCI Terms',
        severity: 'error',
      });
    }

    // Rule 3: Cotton should use Bales
    if (commodity.name.toLowerCase().includes('cotton') && commodity.unit !== 'Bales') {
      warnings.push({
        field: 'unit',
        message: 'Cotton commodities typically use Bales as the primary unit',
        severity: 'warning',
      });
    }

    // Rule 4: At least one active commodity
    if (!commodity.isActive) {
      const activeCount = existingCommodities.filter(
        c => c.isActive && c.id !== editingId
      ).length;

      if (activeCount === 0) {
        errors.push({
          field: 'isActive',
          message: 'Cannot deactivate the last active commodity. At least one commodity must remain active.',
          severity: 'error',
        });
      }
    }

    // Rule 5: CCI Trade requires cotton
    if (commodity.tradeTypeIds.includes(2) && !commodity.name.toLowerCase().includes('cotton')) {
      warnings.push({
        field: 'tradeTypeIds',
        message: 'CCI Trade type is typically used only for Cotton commodities',
        severity: 'warning',
      });
    }

    // Rule 6: Minimum trading parameters
    const requiredParameterCount = 1;
    if (commodity.tradeTypeIds.length < requiredParameterCount) {
      errors.push({
        field: 'tradeTypeIds',
        message: `At least ${requiredParameterCount} trade type(s) must be selected`,
        severity: 'error',
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate relationships (ensure selected IDs exist)
   */
  static validateRelationships(
    commodity: Omit<Commodity, 'id'>,
    masterData: {
      tradeTypes: MasterDataItem[];
      bargainTypes: MasterDataItem[];
      varieties: MasterDataItem[];
      weightmentTerms: MasterDataItem[];
      passingTerms: MasterDataItem[];
      deliveryTerms: StructuredTerm[];
      paymentTerms: StructuredTerm[];
      commissions: CommissionStructure[];
      gstRates: GstRate[];
    }
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate trade type IDs
    const validTradeTypeIds = masterData.tradeTypes.map(t => t.id);
    const invalidTradeTypes = commodity.tradeTypeIds.filter(id => !validTradeTypeIds.includes(id));
    if (invalidTradeTypes.length > 0) {
      errors.push({
        field: 'tradeTypeIds',
        message: `Invalid trade type IDs: ${invalidTradeTypes.join(', ')}. Please refresh the form.`,
        severity: 'error',
      });
    }

    // Validate bargain type IDs
    const validBargainTypeIds = masterData.bargainTypes.map(t => t.id);
    const invalidBargainTypes = commodity.bargainTypeIds.filter(id => !validBargainTypeIds.includes(id));
    if (invalidBargainTypes.length > 0) {
      errors.push({
        field: 'bargainTypeIds',
        message: `Invalid bargain type IDs: ${invalidBargainTypes.join(', ')}. Please refresh the form.`,
        severity: 'error',
      });
    }

    // Validate variety IDs
    const validVarietyIds = masterData.varieties.map(v => v.id);
    const invalidVarieties = commodity.varietyIds.filter(id => !validVarietyIds.includes(id));
    if (invalidVarieties.length > 0) {
      errors.push({
        field: 'varietyIds',
        message: `Invalid variety IDs: ${invalidVarieties.join(', ')}. Please refresh the form.`,
        severity: 'error',
      });
    }

    // Validate weightment term IDs
    const validWeightmentIds = masterData.weightmentTerms.map(t => t.id);
    const invalidWeightment = commodity.weightmentTermIds.filter(id => !validWeightmentIds.includes(id));
    if (invalidWeightment.length > 0) {
      errors.push({
        field: 'weightmentTermIds',
        message: `Invalid weightment term IDs: ${invalidWeightment.join(', ')}. Please refresh the form.`,
        severity: 'error',
      });
    }

    // Validate passing term IDs
    const validPassingIds = masterData.passingTerms.map(t => t.id);
    const invalidPassing = commodity.passingTermIds.filter(id => !validPassingIds.includes(id));
    if (invalidPassing.length > 0) {
      errors.push({
        field: 'passingTermIds',
        message: `Invalid passing term IDs: ${invalidPassing.join(', ')}. Please refresh the form.`,
        severity: 'error',
      });
    }

    // Validate delivery term IDs
    const validDeliveryIds = masterData.deliveryTerms.map(t => t.id);
    const invalidDelivery = commodity.deliveryTermIds.filter(id => !validDeliveryIds.includes(id));
    if (invalidDelivery.length > 0) {
      errors.push({
        field: 'deliveryTermIds',
        message: `Invalid delivery term IDs: ${invalidDelivery.join(', ')}. Please refresh the form.`,
        severity: 'error',
      });
    }

    // Validate payment term IDs
    const validPaymentIds = masterData.paymentTerms.map(t => t.id);
    const invalidPayment = commodity.paymentTermIds.filter(id => !validPaymentIds.includes(id));
    if (invalidPayment.length > 0) {
      errors.push({
        field: 'paymentTermIds',
        message: `Invalid payment term IDs: ${invalidPayment.join(', ')}. Please refresh the form.`,
        severity: 'error',
      });
    }

    // Validate commission IDs
    const validCommissionIds = masterData.commissions.map(c => c.id);
    const invalidCommissions = commodity.commissionIds.filter(id => !validCommissionIds.includes(id));
    if (invalidCommissions.length > 0) {
      errors.push({
        field: 'commissionIds',
        message: `Invalid commission IDs: ${invalidCommissions.join(', ')}. Please refresh the form.`,
        severity: 'error',
      });
    }

    // Validate GST rate ID
    if (commodity.defaultGstRateId !== null) {
      const validGstRateIds = masterData.gstRates.map(g => g.id);
      if (!validGstRateIds.includes(commodity.defaultGstRateId)) {
        errors.push({
          field: 'defaultGstRateId',
          message: 'Invalid GST rate selected. Please refresh the form.',
          severity: 'error',
        });
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate data integrity (duplicates, conflicts, etc.)
   */
  static validateDataIntegrity(
    commodity: Omit<Commodity, 'id'>,
    existingCommodities: Commodity[],
    editingId?: number
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Check for duplicate names (case-insensitive)
    const duplicateName = existingCommodities.find(
      c =>
        c.id !== editingId &&
        c.name.toLowerCase().trim() === commodity.name.toLowerCase().trim()
    );

    if (duplicateName) {
      errors.push({
        field: 'name',
        message: `A commodity with the name "${commodity.name}" already exists (ID: ${duplicateName.id})`,
        severity: 'error',
      });
    }

    // Check for duplicate symbols (case-insensitive)
    const duplicateSymbol = existingCommodities.find(
      c =>
        c.id !== editingId &&
        c.symbol.toLowerCase().trim() === commodity.symbol.toLowerCase().trim()
    );

    if (duplicateSymbol) {
      errors.push({
        field: 'symbol',
        message: `A commodity with the symbol "${commodity.symbol}" already exists (${duplicateSymbol.name})`,
        severity: 'error',
      });
    }

    // Check for similar names (potential duplicates)
    const similarNames = existingCommodities.filter(c => {
      if (c.id === editingId) return false;
      const name1 = c.name.toLowerCase().replace(/\s+/g, '');
      const name2 = commodity.name.toLowerCase().replace(/\s+/g, '');
      return name1.includes(name2) || name2.includes(name1);
    });

    if (similarNames.length > 0) {
      warnings.push({
        field: 'name',
        message: `Similar commodity names exist: ${similarNames.map(c => c.name).join(', ')}`,
        severity: 'warning',
      });
    }

    // Check for empty trading parameters
    if (commodity.tradeTypeIds.length === 0) {
      errors.push({
        field: 'tradeTypeIds',
        message: 'At least one trade type must be selected',
        severity: 'error',
      });
    }

    if (commodity.bargainTypeIds.length === 0) {
      errors.push({
        field: 'bargainTypeIds',
        message: 'At least one bargain type must be selected',
        severity: 'error',
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Check if commodity can be deleted
   */
  static checkDeletionSafety(
    commodity: Commodity,
    existingCommodities: Commodity[]
  ): CommodityUsageInfo {
    // Check if it's the last active commodity
    const activeCommodities = existingCommodities.filter(c => c.isActive && c.id !== commodity.id);

    if (activeCommodities.length === 0) {
      return {
        canDelete: false,
        canDeactivate: false,
        activeContractsCount: 0,
        totalContractsCount: 0,
        blockReason: 'Cannot delete or deactivate the last active commodity. At least one commodity must remain active.',
      };
    }

    // In a real application, we would check for:
    // - Active contracts using this commodity
    // - Historical data referencing this commodity
    // For now, we'll return a safe default

    return {
      canDelete: true,
      canDeactivate: true,
      activeContractsCount: 0, // TODO: Implement actual contract checking
      totalContractsCount: 0, // TODO: Implement actual contract checking
    };
  }
}
