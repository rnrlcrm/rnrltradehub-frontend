/**
 * Business Partner Management - Admin & Back Office
 * 
 * Features:
 * - List all partners with advanced filters
 * - Search by name, code, PAN, GST
 * - Filter by type, status, registration date
 * - View partner details
 * - Approve/Reject registrations
 * - Verify documents
 * - Export to CSV/Excel
 * - Statistics dashboard
 */

import React, { useState, useEffect } from 'react';
import { businessPartnerApi } from '../api/businessPartnerApi';
import { BusinessPartner, BusinessPartnerType, BusinessPartnerStatus } from '../types/businessPartner';
import { User } from '../types';
import { Download, Search, Filter, Eye, CheckCircle, XCircle, FileText, Calendar } from 'lucide-react';

interface Props {
  currentUser: User;
}

type ViewMode = 'list' | 'pending' | 'details';

const BusinessPartnerManagement: React.FC<Props> = ({ currentUser }) => {
  const [partners, setPartners] = useState<BusinessPartner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<BusinessPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedPartner, setSelectedPartner] = useState<BusinessPartner | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<BusinessPartnerType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<BusinessPartnerStatus | 'ALL'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'SELF_SERVICE' | 'BACK_OFFICE' | 'CHATBOT' | 'SUB_BROKER'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    inactive: 0,
    buyers: 0,
    sellers: 0,
    traders: 0,
  });

  useEffect(() => {
    loadPartners();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [partners, searchQuery, typeFilter, statusFilter, sourceFilter, dateFrom, dateTo]);

  const loadPartners = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await businessPartnerApi.getAllPartners();
      setPartners(data);
      calculateStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load partners');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: BusinessPartner[]) => {
    setStats({
      total: data.length,
      active: data.filter(p => p.status === 'ACTIVE').length,
      pending: data.filter(p => p.status === 'PENDING_APPROVAL').length,
      inactive: data.filter(p => p.status === 'INACTIVE').length,
      buyers: data.filter(p => p.businessType === 'BUYER').length,
      sellers: data.filter(p => p.businessType === 'SELLER').length,
      traders: data.filter(p => p.businessType === 'TRADER').length,
    });
  };

  const applyFilters = () => {
    let filtered = [...partners];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.legalName?.toLowerCase().includes(query) ||
        p.tradeName?.toLowerCase().includes(query) ||
        p.partnerCode?.toLowerCase().includes(query) ||
        p.pan?.toLowerCase().includes(query) ||
        p.gstNumber?.toLowerCase().includes(query) ||
        p.primaryContactEmail?.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(p => p.businessType === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Registration source filter
    if (sourceFilter !== 'ALL') {
      filtered = filtered.filter(p => p.registrationSource === sourceFilter);
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(p => new Date(p.createdAt) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(p => new Date(p.createdAt) <= new Date(dateTo));
    }

    setFilteredPartners(filtered);
  };

  const handleApprove = async (partnerId: string) => {
    if (!confirm('Are you sure you want to approve this partner registration?')) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      await businessPartnerApi.approvePartner(partnerId, 'Approved by admin');
      alert('Partner approved successfully! Login credentials have been sent to their email.');
      loadPartners();
      setViewMode('list');
      setSelectedPartner(null);
    } catch (err: any) {
      setError(err.message || 'Failed to approve partner');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (partnerId: string) => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;

    setLoading(true);
    setError('');
    try {
      await businessPartnerApi.rejectPartner(partnerId, reason);
      alert('Partner registration rejected');
      loadPartners();
      setViewMode('list');
      setSelectedPartner(null);
    } catch (err: any) {
      setError(err.message || 'Failed to reject partner');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Partner Code',
      'Legal Name',
      'Trade Name',
      'Business Type',
      'Status',
      'PAN',
      'GST',
      'Contact Person',
      'Email',
      'Phone',
      'Registration Date',
    ];

    const rows = filteredPartners.map(p => [
      p.partnerCode || '',
      p.legalName || '',
      p.tradeName || '',
      p.businessType || '',
      p.status || '',
      p.pan || '',
      p.gstNumber || '',
      p.primaryContactPerson || '',
      p.primaryContactEmail || '',
      p.primaryContactPhone || '',
      p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-partners-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const viewPartnerDetails = (partner: BusinessPartner) => {
    setSelectedPartner(partner);
    setViewMode('details');
  };

  if (loading && partners.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600">Loading business partners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Business Partner Management</h1>
          <p className="text-slate-600 mt-1">Manage partner registrations, approvals, and verifications</p>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Partners</p>
                <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-600 mb-1">Active</p>
                <p className="text-3xl font-bold text-slate-800">{stats.active}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-amber-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-600 mb-1">Pending Approval</p>
                <p className="text-3xl font-bold text-slate-800">{stats.pending}</p>
              </div>
              <div className="bg-amber-100 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-slate-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-600 mb-1">Inactive</p>
                <p className="text-3xl font-bold text-slate-800">{stats.inactive}</p>
              </div>
              <div className="bg-slate-100 p-3 rounded-lg">
                <XCircle className="w-6 h-6 text-slate-600" />
              </div>
            </div>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setViewMode('list')}
              className={`px-6 py-4 font-medium ${
                viewMode === 'list'
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              All Partners ({stats.total})
            </button>
            <button
              onClick={() => { setViewMode('pending'); setStatusFilter('PENDING_APPROVAL'); }}
              className={`px-6 py-4 font-medium ${
                viewMode === 'pending'
                  ? 'border-b-2 border-amber-600 text-amber-600 bg-amber-50'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              Pending Approvals ({stats.pending})
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        {viewMode !== 'details' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Filter className="w-5 h-5 text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-800">Filters & Search</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, code, PAN, GST, email..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Business Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as BusinessPartnerType | 'ALL')}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ALL">All Types</option>
                  <option value="BUYER">Buyer</option>
                  <option value="SELLER">Seller</option>
                  <option value="TRADER">Trader</option>
                  <option value="SUB_BROKER">Sub-Broker</option>
                  <option value="TRANSPORTER">Transporter</option>
                  <option value="CONTROLLER">Controller</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as BusinessPartnerStatus | 'ALL')}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING_APPROVAL">Pending Approval</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="BLACKLISTED">Blacklisted</option>
                  <option value="KYC_EXPIRED">KYC Expired</option>
                </select>
              </div>

              {/* Registration Source Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Registration Source
                </label>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ALL">All Sources</option>
                  <option value="SELF_SERVICE">🌐 Self-Service</option>
                  <option value="BACK_OFFICE">👤 Back Office</option>
                  <option value="CHATBOT">🤖 Chatbot</option>
                  <option value="SUB_BROKER">🤝 Sub-Broker</option>
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Actions */}
              <div className="flex items-end gap-3 lg:col-span-2">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setTypeFilter('ALL');
                    setStatusFilter('ALL');
                    setSourceFilter('ALL');
                    setDateFrom('');
                    setDateTo('');
                  }}
                  className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Clear Filters
                </button>
                <button
                  onClick={exportToCSV}
                  disabled={filteredPartners.length === 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Partner List */}
        {viewMode === 'list' || viewMode === 'pending' ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {filteredPartners.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-600">No partners found matching your filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-100 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Partner Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Legal Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Registered
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredPartners.map((partner) => (
                      <tr key={partner.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm text-slate-900">{partner.partnerCode}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-slate-900">{partner.legalName}</p>
                            {partner.tradeName && (
                              <p className="text-sm text-slate-500">{partner.tradeName}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {partner.businessType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            partner.registrationSource === 'SELF_SERVICE' ? 'bg-purple-100 text-purple-800' :
                            partner.registrationSource === 'BACK_OFFICE' ? 'bg-orange-100 text-orange-800' :
                            partner.registrationSource === 'CHATBOT' ? 'bg-cyan-100 text-cyan-800' :
                            'bg-pink-100 text-pink-800'
                          }`}>
                            {partner.registrationSource === 'SELF_SERVICE' ? '🌐 Self' :
                             partner.registrationSource === 'BACK_OFFICE' ? '👤 BO' :
                             partner.registrationSource === 'CHATBOT' ? '🤖 Bot' :
                             '🤝 Broker'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            partner.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            partner.status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-800' :
                            partner.status === 'INACTIVE' ? 'bg-slate-200 text-slate-700' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {partner.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="text-slate-900">{partner.primaryContactPerson}</p>
                            <p className="text-slate-500">{partner.primaryContactEmail}</p>
                            <p className="text-slate-500">{partner.primaryContactPhone}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {partner.createdAt ? new Date(partner.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => viewPartnerDetails(partner)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {partner.status === 'PENDING_APPROVAL' && (
                              <>
                                <button
                                  onClick={() => handleApprove(partner.id)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                  title="Approve"
                                  disabled={loading}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleReject(partner.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                  title="Reject"
                                  disabled={loading}
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}

        {/* Partner Details View */}
        {viewMode === 'details' && selectedPartner && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{selectedPartner.legalName}</h2>
                <p className="text-slate-600 mt-1">
                  Partner Code: <span className="font-mono font-semibold">{selectedPartner.partnerCode}</span>
                </p>
              </div>
              <button
                onClick={() => { setViewMode('list'); setSelectedPartner(null); }}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                ← Back to List
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Basic Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-600">Legal Name</label>
                    <p className="text-slate-900">{selectedPartner.legalName}</p>
                  </div>
                  {selectedPartner.tradeName && (
                    <div>
                      <label className="block text-sm font-medium text-slate-600">Trade Name</label>
                      <p className="text-slate-900">{selectedPartner.tradeName}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-600">Business Type</label>
                    <p className="text-slate-900">{selectedPartner.businessType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600">Registration Type</label>
                    <p className="text-slate-900">{selectedPartner.registrationType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600">Status</label>
                    <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
                      selectedPartner.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      selectedPartner.status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {selectedPartner.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-600">Contact Person</label>
                    <p className="text-slate-900">{selectedPartner.primaryContactPerson}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600">Email</label>
                    <p className="text-slate-900">{selectedPartner.primaryContactEmail}</p>
                    {selectedPartner.verification?.email.verified && (
                      <span className="text-xs text-green-600">✓ Verified</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600">Phone</label>
                    <p className="text-slate-900">{selectedPartner.primaryContactPhone}</p>
                    {selectedPartner.verification?.mobile.verified && (
                      <span className="text-xs text-green-600">✓ Verified</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Compliance Info */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Compliance Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-600">PAN</label>
                    <p className="text-slate-900 font-mono">{selectedPartner.pan}</p>
                  </div>
                  {selectedPartner.gstNumber && (
                    <div>
                      <label className="block text-sm font-medium text-slate-600">GST Number</label>
                      <p className="text-slate-900 font-mono">{selectedPartner.gstNumber}</p>
                    </div>
                  )}
                  {selectedPartner.cin && (
                    <div>
                      <label className="block text-sm font-medium text-slate-600">CIN</label>
                      <p className="text-slate-900 font-mono">{selectedPartner.cin}</p>
                    </div>
                  )}
                  {selectedPartner.aadharNumber && (
                    <div>
                      <label className="block text-sm font-medium text-slate-600">Aadhar</label>
                      <p className="text-slate-900 font-mono">{selectedPartner.aadharNumber}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Registered Address</h3>
                <div className="space-y-1 text-slate-900">
                  <p>{selectedPartner.registeredAddress?.addressLine1}</p>
                  {selectedPartner.registeredAddress?.addressLine2 && (
                    <p>{selectedPartner.registeredAddress.addressLine2}</p>
                  )}
                  <p>{selectedPartner.registeredAddress?.city}, {selectedPartner.registeredAddress?.state}</p>
                  <p>{selectedPartner.registeredAddress?.pincode}</p>
                  <p>{selectedPartner.registeredAddress?.country}</p>
                </div>
              </div>
            </div>

            {/* Approval Actions */}
            {selectedPartner.status === 'PENDING_APPROVAL' && (
              <div className="mt-8 pt-6 border-t flex justify-end gap-3">
                <button
                  onClick={() => handleReject(selectedPartner.id)}
                  disabled={loading}
                  className="px-6 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 font-medium disabled:opacity-50"
                >
                  Reject Registration
                </button>
                <button
                  onClick={() => handleApprove(selectedPartner.id)}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Approve & Send Credentials'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessPartnerManagement;
