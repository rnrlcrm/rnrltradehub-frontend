
import React from 'react';
import Card from '../components/ui/Card';

const TermsOfService: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Terms of Service</h1>
      <Card>
        <div className="prose max-w-none">
          <h2>1. Agreement to Terms</h2>
          <p>[Placeholder] By using the RNRL ERP system, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the system.</p>
          
          <h2>2. User Accounts</h2>
          <p>[Placeholder] You are responsible for safeguarding your account credentials. You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</p>

          <h2>3. Acceptable Use</h2>
          <p>[Placeholder] You agree not to use the system for any unlawful purpose or any purpose prohibited under this clause. You agree not to use the system in any way that could damage the system, services, or general business of RNRL Trade Hub Private Limited.</p>

          <h2>4. Intellectual Property</h2>
          <p>[Placeholder] The system and its original content, features, and functionality are and will remain the exclusive property of RNRL Trade Hub Private Limited and its licensors.</p>

          <h2>5. Termination</h2>
          <p>[Placeholder] We may terminate or suspend your access to our system immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>

          <h2>6. Governing Law</h2>
          <p>[Placeholder] These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.</p>
        </div>
      </Card>
    </div>
  );
};

export default TermsOfService;
