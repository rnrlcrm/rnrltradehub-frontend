
import React from 'react';
import Card from '../components/ui/Card';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Privacy Policy</h1>
      <Card>
        <div className="prose max-w-none">
          <h2>1. Introduction</h2>
          <p>[Placeholder] Welcome to RNRL ERP. We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our internal ERP system.</p>
          
          <h2>2. Information We Collect</h2>
          <p>[Placeholder] We may collect personal identification information (like name, email address, PAN, GSTIN), financial information (like bank account details), and other business-related data that you voluntarily provide to us when you are onboarded or use the system.</p>

          <h2>3. Use of Your Information</h2>
          <p>[Placeholder] Having accurate information permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the application to:</p>
          <ul>
            <li>Manage business partner accounts.</li>
            <li>Process transactions and manage sales contracts.</li>
            <li>Fulfill compliance and legal obligations.</li>
            <li>Maintain an internal audit trail.</li>
          </ul>

          <h2>4. Disclosure of Your Information</h2>
          <p>[Placeholder] We do not share your information with any third parties, except as required by law or for internal business processes.</p>

          <h2>5. Security of Your Information</h2>
          <p>[Placeholder] We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.</p>

          <h2>6. Contact Us</h2>
          <p>[Placeholder] If you have questions or comments about this Privacy Policy, please contact the Grievance Officer.</p>
        </div>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;
