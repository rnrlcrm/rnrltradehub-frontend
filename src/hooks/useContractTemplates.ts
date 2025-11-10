/**
 * useContractTemplates Hook
 * React hook for contract template functionality
 * 
 * Usage:
 * const { templates, applyTemplate, mostUsed } = useContractTemplates();
 */

import { useState, useEffect } from 'react';
import { ContractTemplate } from '../types';
import * as templateUtils from '../utils/contractTemplates';

export function useContractTemplates() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [mostUsed, setMostUsed] = useState<ContractTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    setIsLoading(true);
    const library = templateUtils.getTemplateLibrary();
    setTemplates(library.templates);
    setMostUsed(library.mostUsed);
    setIsLoading(false);
  };

  const applyTemplate = (templateId: string, currentFormData: any = {}) => {
    templateUtils.incrementTemplateUsage(templateId);
    return templateUtils.applyTemplate(templateId, currentFormData);
  };

  const searchTemplates = (query: string) => {
    return templateUtils.searchTemplates(query);
  };

  const getTemplatesByCategory = (category: string) => {
    return templateUtils.getTemplatesByCategory(category);
  };

  const createCustomTemplate = (name: string, description: string, formData: any, createdBy: string) => {
    const newTemplate = templateUtils.createCustomTemplate(name, description, formData, createdBy);
    setTemplates(prev => [...prev, newTemplate]);
    return newTemplate;
  };

  return {
    templates,
    mostUsed,
    isLoading,
    applyTemplate,
    searchTemplates,
    getTemplatesByCategory,
    createCustomTemplate,
    reload: loadTemplates,
  };
}

export default useContractTemplates;
