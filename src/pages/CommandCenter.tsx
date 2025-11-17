/**
 * COMMAND CENTER DASHBOARD
 * Mission Control for High-Volume Trade Finance (₹300-400 CR per party)
 * TOP-PRIORITY: WORLD-CLASS REPORTING - NO COMPROMISE
 */

import React, { useState, useEffect, useMemo } from 'react';
import Card from '../components/ui/Card';
import { User } from '../types';
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, 
  DollarSign, Users, FileText, Activity, Bell, Download, Filter,
  Calendar, BarChart3, PieChart, LineChart, Settings, Search,
  ArrowUpRight, ArrowDownRight, Zap, Target, Award
} from 'lucide-react';

interface CommandCenterProps {
  currentUser: User;
}

interface KPI {
  id: string;
  title: string;
  value: string | number;
  change: number; // Percentage change
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  color: string;
  target?: number;
  unit?: string;
}

interface ActivityFeedItem {
  id: string;
  type: 'invoice' | 'payment' | 'contract' | 'alert' | 'system';
  title: string;
  description: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actor?: string;
  amount?: number;
}

interface PredictiveAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  expectedDate?: string;
  confidence: number; // 0-100
  affectedParties?: string[];
}

/**
 * COMMAND CENTER DASHBOARD
 * Real-time mission control for ₹300-400 CR turnover operations
 */
const CommandCenter: React.FC<CommandCenterProps> = ({ currentUser }) => {
  // State
  const [liveData, setLiveData] = useState<any>(null);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [predictiveAlerts, setPredictiveAlerts] = useState<PredictiveAlert[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month' | 'quarter' | 'year'>('month');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Real-time data fetching (every 5 seconds)
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchLiveData();
        fetchActivityFeed();
        fetchPredictiveAlerts();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Mock data (in production, fetch from real-time API)
  const fetchLiveData = () => {
    setLiveData({
      totalTurnover: 35000000000, // ₹350 CR
      todayTurnover: 120000000,   // ₹12 CR today
      activeContracts: 450,
      pendingInvoices: 85,
      overduePayments: 12,
      cashPosition: 5000000000,   // ₹50 CR
    });
  };

  const fetchActivityFeed = () => {
    // Mock real-time activity
    setActivityFeed([
      {
        id: '1',
        type: 'payment',
        title: 'Payment Received',
        description: 'ABC Mills paid ₹2.5 CR for INV-2024-001',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        priority: 'high',
        actor: 'ABC Mills',
        amount: 25000000,
      },
      {
        id: '2',
        type: 'invoice',
        title: 'New Invoice',
        description: 'XYZ Traders uploaded invoice ₹1.8 CR',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        priority: 'medium',
        actor: 'XYZ Traders',
        amount: 18000000,
      },
      {
        id: '3',
        type: 'alert',
        title: 'Payment Overdue',
        description: 'DEF Corporation - ₹3.2 CR overdue by 5 days',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        priority: 'critical',
        actor: 'DEF Corporation',
        amount: 32000000,
      },
    ]);
  };

  const fetchPredictiveAlerts = () => {
    setPredictiveAlerts([
      {
        id: '1',
        severity: 'warning',
        title: 'Predicted Payment Delay',
        description: 'ABC Mills likely to delay payment by 7 days',
        recommendation: 'Send reminder today to prevent delay',
        expectedDate: '2024-11-25',
        confidence: 92,
        affectedParties: ['ABC Mills'],
      },
      {
        id: '2',
        severity: 'critical',
        title: 'Cash Flow Alert',
        description: 'Projected cash shortage of ₹5 CR next week',
        recommendation: 'Accelerate collections or arrange short-term funding',
        expectedDate: '2024-11-22',
        confidence: 87,
      },
    ]);
  };

  // Calculate KPIs
  const kpis: KPI[] = useMemo(() => [
    {
      id: 'turnover',
      title: 'Total Turnover',
      value: '₹350',
      change: 12.5,
      trend: 'up',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'blue',
      target: 400,
      unit: 'CR',
    },
    {
      id: 'active-contracts',
      title: 'Active Contracts',
      value: 450,
      change: 8.2,
      trend: 'up',
      icon: <FileText className="w-6 h-6" />,
      color: 'green',
    },
    {
      id: 'collection-rate',
      title: 'Collection Rate',
      value: '94%',
      change: -2.1,
      trend: 'down',
      icon: <Target className="w-6 h-6" />,
      color: 'orange',
      target: 98,
    },
    {
      id: 'overdue',
      title: 'Overdue Amount',
      value: '₹8.5',
      change: -15.3,
      trend: 'down', // Down is good for overdue
      icon: <AlertTriangle className="w-6 h-6" />,
      color: 'red',
      unit: 'CR',
    },
  ], [liveData]);

  // Role-based quick actions
  const getQuickActions = () => {
    const baseActions = [
      { icon: <FileText />, label: 'Upload Invoice', action: () => console.log('Upload invoice'), color: 'blue' },
      { icon: <DollarSign />, label: 'Record Payment', action: () => console.log('Record payment'), color: 'green' },
      { icon: <BarChart3 />, label: 'Generate Report', action: () => console.log('Generate report'), color: 'purple' },
      { icon: <Download />, label: 'Export Data', action: () => console.log('Export'), color: 'gray' },
    ];

    // Add role-specific actions
    if (currentUser.role === 'Admin' || currentUser.role === 'Finance') {
      baseActions.push(
        { icon: <Zap />, label: 'Run Reconciliation', action: () => console.log('Reconcile'), color: 'yellow' },
        { icon: <Bell />, label: 'Send Reminders', action: () => console.log('Reminders'), color: 'orange' }
      );
    }

    return baseActions;
  };

  const formatCurrency = (value: number): string => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} CR`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} L`;
    } else {
      return `₹${value.toLocaleString()}`;
    }
  };

  const getTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Live Indicator */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-600" />
            Command Center
            {autoRefresh && (
              <span className="flex items-center gap-2 text-sm font-normal text-green-600">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                LIVE
              </span>
            )}
          </h1>
          <p className="text-slate-600 mt-1">
            Real-time mission control • Updated {autoRefresh ? 'every 5 seconds' : 'manually'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as any)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              autoRefresh
                ? 'bg-green-600 text-white'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            <Activity className={`w-4 h-4 ${autoRefresh ? 'animate-pulse' : ''}`} />
            {autoRefresh ? 'Live' : 'Paused'}
          </button>
        </div>
      </div>

      {/* Real-Time KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map(kpi => (
          <Card key={kpi.id} className="hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${kpi.color}-100`}>
                  <div className={`text-${kpi.color}-600`}>{kpi.icon}</div>
                </div>
                {kpi.trend !== 'stable' && (
                  <div className={`flex items-center gap-1 ${
                    (kpi.trend === 'up' && kpi.id !== 'overdue') || (kpi.trend === 'down' && kpi.id === 'overdue')
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {kpi.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    <span className="text-sm font-semibold">{Math.abs(kpi.change)}%</span>
                  </div>
                )}
              </div>
              
              <div>
                <p className="text-sm text-slate-600 mb-1">{kpi.title}</p>
                <p className="text-3xl font-bold text-slate-800">
                  {kpi.value}
                  {kpi.unit && <span className="text-lg ml-1">{kpi.unit}</span>}
                </p>
                {kpi.target && (
                  <p className="text-xs text-slate-500 mt-1">
                    Target: {typeof kpi.target === 'number' ? kpi.target : kpi.target}{kpi.unit || ''}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Predictive Alerts */}
      {predictiveAlerts.length > 0 && (
        <Card title="🔮 Predictive Alerts" className="border-l-4 border-l-yellow-500">
          <div className="p-4 space-y-3">
            {predictiveAlerts.map(alert => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.severity === 'critical'
                    ? 'bg-red-50 border-l-red-500'
                    : alert.severity === 'warning'
                    ? 'bg-yellow-50 border-l-yellow-500'
                    : 'bg-blue-50 border-l-blue-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-slate-800">{alert.title}</h4>
                      <span className="text-xs px-2 py-0.5 bg-white rounded-full border">
                        {alert.confidence}% confidence
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mb-2">{alert.description}</p>
                    <p className="text-sm text-slate-600">
                      💡 <strong>Recommendation:</strong> {alert.recommendation}
                    </p>
                    {alert.expectedDate && (
                      <p className="text-xs text-slate-500 mt-2">
                        Expected: {alert.expectedDate}
                      </p>
                    )}
                  </div>
                  <button className="ml-4 px-3 py-1 bg-white border rounded-lg text-sm hover:bg-slate-50">
                    Take Action
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Activity Feed */}
        <Card title="📊 Live Activity Feed" className="lg:col-span-2">
          <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
            {activityFeed.map(item => (
              <div
                key={item.id}
                className={`p-4 rounded-lg border-l-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                  item.priority === 'critical'
                    ? 'border-l-red-500 bg-red-50'
                    : item.priority === 'high'
                    ? 'border-l-orange-500'
                    : item.priority === 'medium'
                    ? 'border-l-blue-500'
                    : 'border-l-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {item.type === 'payment' && <DollarSign className="w-4 h-4 text-green-600" />}
                      {item.type === 'invoice' && <FileText className="w-4 h-4 text-blue-600" />}
                      {item.type === 'alert' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                      <h4 className="font-semibold text-slate-800">{item.title}</h4>
                    </div>
                    <p className="text-sm text-slate-700 mb-1">{item.description}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{getTimeAgo(item.timestamp)}</span>
                      {item.actor && <span>• {item.actor}</span>}
                      {item.amount && <span>• {formatCurrency(item.amount)}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card title="⚡ Quick Actions">
          <div className="p-4 space-y-3">
            {getQuickActions().map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={`w-full p-4 rounded-lg border-2 border-${action.color}-200 hover:border-${action.color}-400 hover:bg-${action.color}-50 transition-all flex items-center gap-3 group`}
              >
                <div className={`p-2 rounded-lg bg-${action.color}-100 text-${action.color}-600 group-hover:bg-${action.color}-200`}>
                  {action.icon}
                </div>
                <span className="font-medium text-slate-700">{action.label}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Performance Metrics Chart Placeholder */}
      <Card title="📈 Performance Trends">
        <div className="p-4">
          <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
            <div className="text-center">
              <LineChart className="w-16 h-16 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600">Performance chart will be rendered here</p>
              <p className="text-sm text-slate-500">Using Recharts or D3.js for visualization</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CommandCenter;
