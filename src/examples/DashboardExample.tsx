import React from 'react';
import { PageShell } from '../components/layout/PageShell';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
  Alert,
  AlertTitle,
  AlertDescription,
} from '../components/ui/shadcn';
import { TrendingUp, Users, DollarSign, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ElementType;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, trend, icon: Icon }) => {
  const isPositive = trend === 'up';
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mt-2">{value}</p>
            <div className="flex items-center mt-2">
              {isPositive ? (
                <ArrowUpRight className="w-4 h-4 text-success mr-1" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-error mr-1" />
              )}
              <span className={`text-sm font-medium ${isPositive ? 'text-success' : 'text-error'}`}>
                {change}
              </span>
              <span className="text-sm text-neutral-500 dark:text-neutral-400 ml-1">vs last month</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const DashboardExample: React.FC = () => {
  return (
    <PageShell
      title="Dashboard"
      description="Welcome to your ERP command center"
      breadcrumbs={[
        { label: 'Home' },
        { label: 'Dashboard' },
      ]}
      actions={
        <>
          <Button variant="outline">Export Report</Button>
          <Button>New Contract</Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Alert Banner */}
        <Alert variant="info">
          <AlertTitle>System Update Available</AlertTitle>
          <AlertDescription>
            A new version of the ERP system is available. Update now to get the latest features.
          </AlertDescription>
        </Alert>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value="₹12.5M"
            change="+12.5%"
            trend="up"
            icon={DollarSign}
          />
          <StatCard
            title="Active Contracts"
            value="248"
            change="+8.2%"
            trend="up"
            icon={FileText}
          />
          <StatCard
            title="Total Clients"
            value="156"
            change="-2.4%"
            trend="down"
            icon={Users}
          />
          <StatCard
            title="Growth Rate"
            value="23.5%"
            change="+5.1%"
            trend="up"
            icon={TrendingUp}
          />
        </div>

        {/* Content Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Contracts</CardTitle>
              <CardDescription>Latest sales contracts in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: 'SC-2024-001', client: 'ABC Traders', amount: '₹2.5M', status: 'Active' },
                  { id: 'SC-2024-002', client: 'XYZ Mills', amount: '₹1.8M', status: 'Pending' },
                  { id: 'SC-2024-003', client: 'Global Corp', amount: '₹3.2M', status: 'Active' },
                ].map((contract) => (
                  <div key={contract.id} className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-neutral-50">{contract.id}</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">{contract.client}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-neutral-900 dark:text-neutral-50">{contract.amount}</p>
                      <Badge variant={contract.status === 'Active' ? 'success' : 'warning'} className="mt-1">
                        {contract.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Frequently used operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-20 flex-col">
                  <FileText className="w-6 h-6 mb-2" />
                  <span>New Contract</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <DollarSign className="w-6 h-6 mb-2" />
                  <span>Create Invoice</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Users className="w-6 h-6 mb-2" />
                  <span>Add Client</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <TrendingUp className="w-6 h-6 mb-2" />
                  <span>View Reports</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
};
