"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  User,
  ExternalLink,
  Filter
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Audit {
  id: string;
  name: string;
  description: string | null;
  status: string;
  totalCriteria: number;
  completedCriteria: number;
  passedCriteria: number;
  failedCriteria: number;
  overallScore: number | null;
  createdAt: string;
  dueDate: string | null;
  completedAt: string | null;
  site: { url: string; name: string | null };
  template: { name: string; wcagLevel: string | null } | null;
  createdBy: { email: string; firstName: string | null; lastName: string | null } | null;
  assignedTo: { email: string; firstName: string | null; lastName: string | null } | null;
  _count: { items: number };
}

const statusConfig = {
  draft: {
    label: "Draft",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: FileCheck
  },
  in_progress: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Clock
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle2
  },
  reviewed: {
    label: "Reviewed",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: CheckCircle2
  }
};

export default function AuditDashboard() {
  const router = useRouter();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [siteFilter, setSiteFilter] = useState<string>("all");

  useEffect(() => {
    fetchAudits();
  }, [statusFilter, siteFilter]);

  const fetchAudits = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (siteFilter !== "all") params.append("siteId", siteFilter);

      const res = await fetch(`/api/audits?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setAudits(data.audits || []);
      }
    } catch (e) {
      console.error("Failed to fetch audits:", e);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 50) return "bg-blue-500";
    if (percentage >= 25) return "bg-yellow-500";
    return "bg-gray-400";
  };

  const isOverdue = (audit: Audit) => {
    if (!audit.dueDate || audit.status === "completed" || audit.status === "reviewed") {
      return false;
    }
    return new Date(audit.dueDate) < new Date();
  };

  const getDaysUntilDue = (dueDate: string) => {
    const days = Math.ceil(
      (new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const uniqueSites = Array.from(
    new Set(audits.map(a => JSON.stringify({ id: a.site.url, name: a.site.name || a.site.url })))
  ).map(s => JSON.parse(s));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="reviewed">Reviewed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
              <select
                value={siteFilter}
                onChange={e => setSiteFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Sites</option>
                {uniqueSites.map((site, idx) => (
                  <option key={idx} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-600 dark:text-gray-400">Total Audits</p>
              <p className="text-2xl font-bold text-gray-900">{audits.length}</p>
            </div>
            <FileCheck className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-600 dark:text-gray-400">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {audits.filter(a => a.status === "in_progress").length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {audits.filter(a => a.status === "completed" || a.status === "reviewed").length}
              </p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-600 dark:text-gray-400">Overdue</p>
              <p className="text-2xl font-bold text-red-600">
                {audits.filter(a => isOverdue(a)).length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Audit list */}
      <div className="space-y-4">
        {audits.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <FileCheck className="w-12 h-12 text-gray-600 dark:text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 dark:text-gray-600 dark:text-gray-400">No audits found</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Create a new manual audit to get started
            </p>
          </div>
        ) : (
          audits.map((audit, idx) => {
            const StatusIcon = statusConfig[audit.status as keyof typeof statusConfig]?.icon || FileCheck;
            const progressPercentage = audit.totalCriteria > 0
              ? (audit.completedCriteria / audit.totalCriteria) * 100
              : 0;
            const overdue = isOverdue(audit);

            return (
              <motion.div
                key={audit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-white rounded-lg shadow-sm border ${
                  overdue ? "border-red-300" : "border-gray-200"
                } hover:shadow-md transition-shadow cursor-pointer`}
                onClick={() => router.push(`/dashboard/audits/${audit.id}`)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{audit.name}</h3>
                        {overdue && (
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 border border-red-200 rounded">
                            Overdue
                          </span>
                        )}
                      </div>
                      {audit.description && (
                        <p className="text-sm text-gray-600 mb-2">{audit.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-700 dark:text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <ExternalLink className="w-4 h-4" />
                          {audit.site.name || audit.site.url}
                        </span>
                        {audit.template && (
                          <span>
                            {audit.template.name}
                            {audit.template.wcagLevel && ` (${audit.template.wcagLevel})`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-3 py-1 text-sm font-medium rounded-lg border ${
                          statusConfig[audit.status as keyof typeof statusConfig]?.color ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        <StatusIcon className="w-4 h-4 inline mr-1" />
                        {statusConfig[audit.status as keyof typeof statusConfig]?.label || audit.status}
                      </span>
                      {audit.overallScore !== null && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {audit.overallScore.toFixed(0)}%
                          </div>
                          <div className="text-xs text-gray-700 dark:text-gray-600 dark:text-gray-400">Score</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">
                        Progress: {audit.completedCriteria} / {audit.totalCriteria} criteria
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        {Math.round(progressPercentage)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all ${getProgressColor(progressPercentage)}`}
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {audit._count.items}
                      </div>
                      <div className="text-xs text-gray-700 dark:text-gray-600 dark:text-gray-400">Items</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">
                        {audit.passedCriteria}
                      </div>
                      <div className="text-xs text-gray-700 dark:text-gray-600 dark:text-gray-400">Passed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-red-600">
                        {audit.failedCriteria}
                      </div>
                      <div className="text-xs text-gray-700 dark:text-gray-600 dark:text-gray-400">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-600">
                        {audit.totalCriteria - audit.completedCriteria}
                      </div>
                      <div className="text-xs text-gray-700 dark:text-gray-600 dark:text-gray-400">Remaining</div>
                    </div>
                  </div>

                  {/* Footer metadata */}
                  <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-600 dark:text-gray-400 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-4">
                      {audit.createdBy && (
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {audit.createdBy.firstName || audit.createdBy.email}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(audit.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {audit.dueDate && (
                      <span
                        className={`flex items-center gap-1 ${
                          overdue ? "text-red-600 font-medium" : ""
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                        Due {overdue ? "was" : "in"}{" "}
                        {Math.abs(getDaysUntilDue(audit.dueDate))} days
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
