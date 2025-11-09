
import React, { useState } from 'react';
import Card from '../components/ui/Card';
import { User, AuditLog } from '../types';
import { Button } from '../components/ui/Form';

interface GrievanceOfficerProps {
  currentUser: User;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
}

const GrievanceOfficer: React.FC<GrievanceOfficerProps> = ({ currentUser, addAuditLog }) => {
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !details) {
      alert('Please fill out all fields.');
      return;
    }

    addAuditLog({
      user: currentUser.name,
      role: currentUser.role,
      action: 'Grievance',
      module: 'Grievance Officer',
      details: `Submitted grievance with subject: "${subject}"`,
      reason: 'User-submitted grievance'
    });

    setSubmitted(true);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Grievance Redressal Mechanism</h1>
      
      <Card title="Grievance Officer Details">
        <p className="text-slate-600">
          In compliance with the Information Technology Act, 2000 and the rules made thereunder, the name and contact details of the Grievance Officer are provided below.
        </p>
        <div className="mt-4 border-t pt-4">
          <p className="font-semibold">Name: Mr. Ankit Desai</p>
          <p>Email: <a href="mailto:grievance.officer@rnrltradehub.com" className="text-blue-600 hover:underline">grievance.officer@rnrltradehub.com</a></p>
          <p>Address: RNRL Trade Hub Private Limited, Rajurkar Compound, Tilak Road, Akola, MH, INDIA.</p>
        </div>
      </Card>

      <Card title="Submit a Grievance">
        {submitted ? (
          <div className="text-center p-8">
            <h3 className="text-lg font-semibold text-green-700">Grievance Submitted Successfully</h3>
            <p className="mt-2 text-slate-600">Thank you. Your grievance has been logged and will be reviewed by the Grievance Officer. You will be contacted via your registered email address.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-slate-700">Subject</label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 block w-full border border-slate-300 rounded-none shadow-sm py-2 px-3 focus:outline-none focus:border-blue-500 focus:ring-0 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="details" className="block text-sm font-medium text-slate-700">Details of your Grievance</label>
              <textarea
                id="details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={6}
                className="mt-1 block w-full border border-slate-300 rounded-none shadow-sm py-2 px-3 focus:outline-none focus:border-blue-500 focus:ring-0 sm:text-sm"
                required
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="text-sm">
                Submit Grievance
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default GrievanceOfficer;
