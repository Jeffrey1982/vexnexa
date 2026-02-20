"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, FileCheck, AlertCircle } from "lucide-react";

interface Site {
  id: string;
  url: string;
  name: string | null;
}

interface Scan {
  id: string;
  score: number | null;
  createdAt: string;
}

interface AuditTemplate {
  id: string;
  name: string;
  description: string | null;
  wcagLevel: string | null;
  category: string;
}

interface AuditManagerProps {
  sites: Site[];
  templates: AuditTemplate[];
  onAuditCreated?: (auditId: string) => void;
}

export default function AuditManager({
  sites,
  templates,
  onAuditCreated
}: AuditManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [scans, setScans] = useState<Scan[]>([]);
  const [loadingScans, setLoadingScans] = useState(false);

  const [formData, setFormData] = useState({
    siteId: "",
    scanId: "",
    name: "",
    description: "",
    templateId: "",
    dueDate: ""
  });

  const handleSiteChange = async (siteId: string) => {
    setSelectedSite(siteId);
    setFormData({ ...formData, siteId, scanId: "" });

    if (siteId) {
      setLoadingScans(true);
      try {
        const res = await fetch(`/api/scans?siteId=${siteId}&limit=10`);
        const data = await res.json();
        if (data.ok) {
          setScans(data.scans || []);
        }
      } catch (e) {
        console.error("Failed to load scans:", e);
      } finally {
        setLoadingScans(false);
      }
    } else {
      setScans([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.siteId || !formData.name || !formData.templateId) {
      setError("Site, name, and template are required");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          dueDate: formData.dueDate || null
        })
      });

      const data = await res.json();
      if (data.ok) {
        setShowForm(false);
        setFormData({
          siteId: "",
          scanId: "",
          name: "",
          description: "",
          templateId: "",
          dueDate: ""
        });
        if (onAuditCreated) {
          onAuditCreated(data.audit.id);
        }
      } else {
        setError(data.error || "Failed to create audit");
      }
    } catch (e: any) {
      setError(e.message || "Failed to create audit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create New Manual Audit
        </button>
      )}

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <FileCheck className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Create Manual Accessibility Audit
            </h3>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.siteId}
                onChange={e => handleSiteChange(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a site...</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>
                    {site.name || site.url}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Associated Scan (optional)
              </label>
              <select
                value={formData.scanId}
                onChange={e => setFormData({ ...formData, scanId: e.target.value })}
                disabled={!selectedSite || loadingScans}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">No associated scan</option>
                {scans.map(scan => (
                  <option key={scan.id} value={scan.id}>
                    Scan from {new Date(scan.createdAt).toLocaleDateString()}
                    {scan.score !== null && ` - Score: ${scan.score}`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Link this audit to an automated scan to combine results
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Audit Template <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.templateId}
                onChange={e => setFormData({ ...formData, templateId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a template...</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                    {template.wcagLevel && ` (${template.wcagLevel})`}
                  </option>
                ))}
              </select>
              {formData.templateId && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    {templates.find(t => t.id === formData.templateId)?.description ||
                      "This template will generate a comprehensive checklist of manual accessibility tests."}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Audit Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Q4 2024 Accessibility Audit"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Describe the scope and goals of this audit..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date (optional)
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-[var(--vn-disabled-bg)] disabled:text-[var(--vn-disabled-fg)] disabled:opacity-100 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    Create Audit
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                }}
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:bg-[var(--vn-disabled-bg)] disabled:text-[var(--vn-disabled-fg)] disabled:opacity-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
}
