import React from 'react';
import { Member, DashboardStats } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, DollarSign, Wallet, TrendingUp, Landmark, Mail, Phone, UserCircle } from 'lucide-react';

interface DashboardProps {
  members: Member[];
}

const Dashboard: React.FC<DashboardProps> = ({ members }) => {
  const totalCommitted = members.reduce((sum, m) => sum + m.committedAmount, 0);
  const totalCollected = members.reduce((sum, m) => sum + m.payments.reduce((pSum, p) => pSum + p.amount, 0), 0);
  const collectionRate = totalCommitted > 0 ? (totalCollected / totalCommitted) * 100 : 0;

  const stats: DashboardStats = {
    totalCommitted,
    totalCollected,
    memberCount: members.length,
    collectionRate,
  };

  const chartData = [
    { name: 'Committed', amount: totalCommitted },
    { name: 'Collected', amount: totalCollected },
  ];

  const StatCard = ({ title, value, icon: Icon, color, subValue }: any) => (
    <div className="bg-white dark:bg-[#1e293b]/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-xl transition-colors duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</h3>
          {subValue && <p className={`text-xs mt-1 ${color === 'blue' ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{subValue}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color === 'blue' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Members"
          value={stats.memberCount}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Committed"
          value={`$${stats.totalCommitted.toLocaleString()}`}
          icon={DollarSign}
          color="blue"
          subValue="Expected Annually"
        />
        <StatCard
          title="Total Collected"
          value={`$${stats.totalCollected.toLocaleString()}`}
          icon={Wallet}
          color="emerald"
          subValue="Year to Date"
        />
        <StatCard
          title="Collection Rate"
          value={`${stats.collectionRate.toFixed(1)}%`}
          icon={TrendingUp}
          color={stats.collectionRate > 50 ? 'emerald' : 'blue'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1e293b]/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-xl transition-colors duration-300">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Financial Overview</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} className="text-sm" />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    color: '#fff',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      className="transition-all duration-300"
                      fill={index === 0
                        ? 'var(--color-slate-400)' // Fallback
                        : 'var(--color-blue-500)'
                      }
                      style={{
                        fill: index === 0
                          ? (document.documentElement.classList.contains('dark') ? '#94a3b8' : '#cbd5e1')
                          : (document.documentElement.classList.contains('dark') ? '#60a5fa' : '#3b82f6')
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Contributors & Contact Info Column */}
        <div className="space-y-6">
          {/* Top Contributors Teaser */}
          <div className="bg-white dark:bg-[#1e293b]/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-xl flex flex-col transition-colors duration-300">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Top Commitments</h3>
            <div className="flex-1 overflow-auto space-y-4 pr-2 max-h-64 lg:max-h-full">
              {[...members].sort((a, b) => b.committedAmount - a.committedAmount).slice(0, 5).map((m, i) => (
                <div key={m.id} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300">{i + 1}</span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{m.name}</span>
                  </div>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">${m.committedAmount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact & Donation Info Card */}
          <div className="bg-gradient-to-br from-blue-900 to-slate-900 p-6 rounded-2xl border border-blue-800 shadow-xl text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Landmark size={20} className="text-blue-300" />
              </div>
              <div>
                <h3 className="font-semibold">Masjid Information</h3>
                <p className="text-xs text-blue-200">Payment & Contacts</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white/10 p-3 rounded-xl border border-white/5">
                <p className="text-xs text-blue-200 mb-1">Zelle / Email</p>
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-blue-300" />
                  <span className="font-mono text-sm tracking-wide">markazbuffalo@gmail.com</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-blue-200 uppercase tracking-wider">Points of Contact</p>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-200">
                    <UserCircle size={14} className="text-blue-400" />
                    <span>Hasan Bhai</span>
                  </div>
                  <span className="text-xs text-slate-400">917-345-7902</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-200">
                    <UserCircle size={14} className="text-blue-400" />
                    <span>Effath Bhai</span>
                  </div>
                  <span className="text-xs text-slate-400">716-903-1302</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-200">
                    <UserCircle size={14} className="text-blue-400" />
                    <span>Zubair Ali</span>
                  </div>
                  <span className="text-xs text-slate-400">917-302-6966</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;