/**
 * Certification Management Component
 * 
 * Features:
 * - User can add product certifications after approval
 * - Organic Cotton, GOTS, Fair Trade, BCI, etc.
 * - Upload certificate documents
 * - Back office gets notified for verification
 * - Shows expiry status and reminders
 * - Visible in trade matching for certified products
 * - Complete audit trail
 */

import React, { useState, useEffect } from 'react';
import { 
  ProductCertification, 
  CertificationType, 
  CertificationStatus 
} from '../types/businessPartner';
import { businessPartnerApi } from '../api/businessPartnerApi';

interface CertificationManagementProps {
  partnerId: string;
  readOnly?: boolean;
  onCertificationsChange?: (certifications: ProductCertification[]) => void;
}

const CERTIFICATION_TYPES: { value: CertificationType; label: string; description: string }[] = [
  { value: 'ORGANIC_COTTON', label: 'Organic Cotton', description: 'Certified organic cotton production' },
  { value: 'GOTS', label: 'GOTS', description: 'Global Organic Textile Standard' },
  { value: 'OCS', label: 'OCS', description: 'Organic Content Standard' },
  { value: 'FAIR_TRADE', label: 'Fair Trade', description: 'Fair Trade Certified' },
  { value: 'BCI', label: 'BCI', description: 'Better Cotton Initiative' },
  { value: 'OEKO_TEX', label: 'OEKO-TEX', description: 'OEKO-TEX Standard 100' },
  { value: 'ISO_9001', label: 'ISO 9001', description: 'Quality Management System' },
  { value: 'ISO_14001', label: 'ISO 14001', description: 'Environmental Management' },
  { value: 'GRS', label: 'GRS', description: 'Global Recycled Standard' },
  { value: 'RCS', label: 'RCS', description: 'Recycled Claim Standard' },
  { value: 'REGENERATIVE', label: 'Regenerative', description: 'Regenerative Agriculture Certified' },
  { value: 'OTHER', label: 'Other', description: 'Other certification' },
];

const CertificationManagement: React.FC<CertificationManagementProps> = ({
  partnerId,
  readOnly = false,
  onCertificationsChange,
}) => {
  const [certifications, setCertifications] = useState<ProductCertification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCertification, setEditingCertification] = useState<ProductCertification | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    certificationType: 'ORGANIC_COTTON' as CertificationType,
    certificationName: '',
    certificationBody: '',
    certificateNumber: '',
    productsScope: [] as string[],
    locationScope: 'All',
    issueDate: '',
    expiryDate: '',
    isVisibleInTrade: true,
    isPublic: true,
    certificateFile: null as File | null,
  });

  // Load certifications
  useEffect(() => {
    loadCertifications();
  }, [partnerId]);

  const loadCertifications = async () => {
    setIsLoading(true);
    try {
      const response = await businessPartnerApi.getCertifications(partnerId);
      setCertifications(response.data);
      onCertificationsChange?.(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load certifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCertification = () => {
    setEditingCertification(null);
    setFormData({
      certificationType: 'ORGANIC_COTTON',
      certificationName: '',
      certificationBody: '',
      certificateNumber: '',
      productsScope: [],
      locationScope: 'All',
      issueDate: '',
      expiryDate: '',
      isVisibleInTrade: true,
      isPublic: true,
      certificateFile: null,
    });
    setIsAddModalOpen(true);
  };

  const handleEditCertification = (certification: ProductCertification) => {
    setEditingCertification(certification);
    setFormData({
      certificationType: certification.certificationType,
      certificationName: certification.certificationName,
      certificationBody: certification.certificationBody,
      certificateNumber: certification.certificateNumber,
      productsScope: certification.productsScope,
      locationScope: certification.locationScope || 'All',
      issueDate: certification.issueDate.split('T')[0],
      expiryDate: certification.expiryDate.split('T')[0],
      isVisibleInTrade: certification.isVisibleInTrade,
      isPublic: certification.isPublic,
      certificateFile: null,
    });
    setIsAddModalOpen(true);
  };

  const handleSaveCertification = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate
      if (!formData.certificationName || !formData.certificationBody || !formData.certificateNumber) {
        setError('Please fill all required fields');
        return;
      }

      if (!formData.issueDate || !formData.expiryDate) {
        setError('Please provide issue and expiry dates');
        return;
      }

      if (new Date(formData.expiryDate) <= new Date(formData.issueDate)) {
        setError('Expiry date must be after issue date');
        return;
      }

      if (!editingCertification && !formData.certificateFile) {
        setError('Please upload certificate document');
        return;
      }

      // Upload document if new file
      let certificateDocument = editingCertification?.certificateDocument;
      if (formData.certificateFile) {
        const uploadResponse = await businessPartnerApi.uploadDocument(
          partnerId,
          formData.certificateFile,
          'CERTIFICATION'
        );
        certificateDocument = {
          fileUrl: uploadResponse.data.fileUrl,
          fileName: formData.certificateFile.name,
          uploadedAt: new Date().toISOString(),
          uploadedBy: partnerId, // Current user
        };
      }

      const certificationData: Partial<ProductCertification> = {
        partnerId,
        certificationType: formData.certificationType,
        certificationName: formData.certificationName,
        certificationBody: formData.certificationBody,
        certificateNumber: formData.certificateNumber,
        productsScope: formData.productsScope,
        locationScope: formData.locationScope,
        issueDate: new Date(formData.issueDate).toISOString(),
        expiryDate: new Date(formData.expiryDate).toISOString(),
        isVisibleInTrade: formData.isVisibleInTrade,
        isPublic: formData.isPublic,
        certificateDocument: certificateDocument!,
        status: 'PENDING_VERIFICATION', // Always pending until back office verifies
      };

      if (editingCertification) {
        await businessPartnerApi.updateCertification(partnerId, editingCertification.id, certificationData);
      } else {
        await businessPartnerApi.addCertification(partnerId, certificationData);
      }

      setIsAddModalOpen(false);
      await loadCertifications();
    } catch (err: any) {
      setError(err.message || 'Failed to save certification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCertification = async (certificationId: string) => {
    if (!confirm('Are you sure you want to delete this certification?')) return;

    try {
      setIsLoading(true);
      await businessPartnerApi.deleteCertification(partnerId, certificationId);
      await loadCertifications();
    } catch (err: any) {
      setError(err.message || 'Failed to delete certification');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: CertificationStatus) => {
    const badges = {
      PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-800',
      VERIFIED: 'bg-green-100 text-green-800',
      EXPIRED: 'bg-red-100 text-red-800',
      REJECTED: 'bg-red-200 text-red-900',
      SUSPENDED: 'bg-gray-200 text-gray-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getExpiryStatus = (cert: ProductCertification) => {
    if (cert.isExpired) {
      return { label: 'EXPIRED', color: 'text-red-600', icon: '🔴' };
    }
    if (cert.isExpiring) {
      return { label: 'EXPIRING SOON', color: 'text-orange-600', icon: '⚠️' };
    }
    return { label: 'VALID', color: 'text-green-600', icon: '✅' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Product Certifications</h3>
          <p className="text-sm text-gray-600">
            Add your product certifications. Back office will verify before making them visible in trades.
          </p>
        </div>
        {!readOnly && (
          <button
            onClick={handleAddCertification}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + Add Certification
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>📋 Why add certifications?</strong> Buyers looking for certified products (organic, fair trade, etc.)
          will see your certifications in trade matching. This increases your visibility and helps close deals faster.
        </p>
      </div>

      {/* Certifications List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading certifications...</p>
        </div>
      ) : certifications.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-6xl mb-4">📜</div>
          <p className="text-gray-600 mb-4">No certifications added yet</p>
          {!readOnly && (
            <button
              onClick={handleAddCertification}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Add Your First Certification
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certifications.map((cert) => {
            const expiryStatus = getExpiryStatus(cert);
            return (
              <div
                key={cert.id}
                className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900">{cert.certificationName}</h4>
                    <p className="text-sm text-gray-600">{cert.certificationBody}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadge(cert.status)}`}
                  >
                    {cert.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Certificate #:</span>
                    <span className="font-medium">{cert.certificateNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">
                      {CERTIFICATION_TYPES.find((t) => t.value === cert.certificationType)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Products:</span>
                    <span className="font-medium">{cert.productsScope.join(', ')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Issue Date:</span>
                    <span>{new Date(cert.issueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Expiry Date:</span>
                    <span className={expiryStatus.color}>
                      {expiryStatus.icon} {new Date(cert.expiryDate).toLocaleDateString()} ({expiryStatus.label})
                    </span>
                  </div>
                </div>

                {/* Trade Visibility */}
                <div className="flex items-center gap-4 mb-4 text-sm">
                  {cert.isVisibleInTrade && <span className="text-green-600">✓ Visible in Trade</span>}
                  {cert.isPublic && <span className="text-blue-600">✓ Public</span>}
                </div>

                {/* Document */}
                <div className="mb-4">
                  <a
                    href={cert.certificateDocument.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-2"
                  >
                    📄 View Certificate Document
                  </a>
                </div>

                {/* Verification Info */}
                {cert.status === 'VERIFIED' && cert.verifiedBy && (
                  <div className="text-xs text-gray-600 mb-4">
                    ✅ Verified by {cert.verifiedBy} on {new Date(cert.verifiedAt!).toLocaleDateString()}
                  </div>
                )}

                {cert.status === 'REJECTED' && cert.rejectionReason && (
                  <div className="text-xs text-red-600 mb-4">
                    ❌ Rejected: {cert.rejectionReason}
                  </div>
                )}

                {/* Actions */}
                {!readOnly && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditCertification(cert)}
                      className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCertification(cert.id)}
                      className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-sm"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-xl font-semibold mb-4">
              {editingCertification ? 'Edit Certification' : 'Add New Certification'}
            </h3>

            <div className="space-y-4">
              {/* Certification Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certification Type *
                </label>
                <select
                  value={formData.certificationType}
                  onChange={(e) => setFormData({ ...formData, certificationType: e.target.value as CertificationType })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {CERTIFICATION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label} - {type.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Certification Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certification Name *
                </label>
                <input
                  type="text"
                  value={formData.certificationName}
                  onChange={(e) => setFormData({ ...formData, certificationName: e.target.value })}
                  placeholder="e.g., GOTS Organic Cotton Certificate"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              {/* Certification Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certification Body *
                </label>
                <input
                  type="text"
                  value={formData.certificationBody}
                  onChange={(e) => setFormData({ ...formData, certificationBody: e.target.value })}
                  placeholder="e.g., Control Union Certifications"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              {/* Certificate Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certificate Number *
                </label>
                <input
                  type="text"
                  value={formData.certificateNumber}
                  onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                  placeholder="e.g., CU123456"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              {/* Products Scope */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Products Covered (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.productsScope.join(', ')}
                  onChange={(e) => setFormData({ ...formData, productsScope: e.target.value.split(',').map(s => s.trim()) })}
                  placeholder="e.g., Organic Cotton, Cotton Yarn"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              {/* Certificate Document */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certificate Document * (PDF, max 5MB)
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFormData({ ...formData, certificateFile: e.target.files?.[0] || null })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                {editingCertification && (
                  <p className="text-xs text-gray-600 mt-1">Leave empty to keep existing document</p>
                )}
              </div>

              {/* Visibility Options */}
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isVisibleInTrade}
                    onChange={(e) => setFormData({ ...formData, isVisibleInTrade: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Show in trade matching (buyers can see certified products)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Make public (visible to all users)</span>
                </label>
              </div>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCertification}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : editingCertification ? 'Update' : 'Add'} Certification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificationManagement;
