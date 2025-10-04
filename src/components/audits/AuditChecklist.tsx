"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Circle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Upload,
  Link2,
  FileText,
  Save,
  Clock,
  TrendingUp
} from "lucide-react";

interface AuditItem {
  id: string;
  criterionId: string;
  category: string;
  subcategory: string | null;
  title: string;
  description: string | null;
  howToTest: string | null;
  wcagCriterion: string | null;
  wcagLevel: string | null;
  wcagUrl: string | null;
  priority: string;
  status: string;
  result: string | null;
  notes: string | null;
  screenshotUrls: string[];
  elementSelector: string | null;
  pageUrl: string | null;
  testedAt: string | null;
  testedBy: any | null;
}

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
  site: { url: string; name: string | null };
  template: { name: string; wcagLevel: string | null } | null;
  items: AuditItem[];
}

interface AuditChecklistProps {
  auditId: string;
}

const categoryLabels: Record<string, string> = {
  keyboard: "Keyboard Accessibility",
  screen_reader: "Screen Reader",
  color: "Color & Contrast",
  forms: "Forms & Input",
  timing: "Timing & Sessions",
  motion: "Motion & Animation",
  navigation: "Navigation",
  content: "Content Structure",
  interactive: "Interactive Elements",
  language: "Language",
  predictable: "Predictability",
  compatible: "Compatibility",
  media: "Media & Multimedia"
};

const priorityColors: Record<string, string> = {
  critical: "text-red-600 bg-red-50 border-red-200",
  high: "text-orange-600 bg-orange-50 border-orange-200",
  medium: "text-yellow-600 bg-yellow-50 border-yellow-200",
  low: "text-blue-600 bg-blue-50 border-blue-200"
};

export default function AuditChecklist({ auditId }: AuditChecklistProps) {
  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  // Form state for editing an item
  const [formData, setFormData] = useState<{
    result: string;
    notes: string;
    pageUrl: string;
    elementSelector: string;
  }>({
    result: "",
    notes: "",
    pageUrl: "",
    elementSelector: ""
  });

  useEffect(() => {
    fetchAudit();
  }, [auditId]);

  const fetchAudit = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/audits/${auditId}`);
      const data = await res.json();
      if (data.ok) {
        setAudit(data.audit);
        // Auto-expand all categories by default
        const categories = new Set<string>(data.audit.items.map((item: AuditItem) => item.category));
        setExpandedCategories(categories);
      }
    } catch (e) {
      console.error("Failed to fetch audit:", e);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const startEditing = (item: AuditItem) => {
    setEditingItem(item.id);
    setFormData({
      result: item.result || "",
      notes: item.notes || "",
      pageUrl: item.pageUrl || "",
      elementSelector: item.elementSelector || ""
    });
    // Auto-expand the item when editing
    const newExpanded = new Set(expandedItems);
    newExpanded.add(item.id);
    setExpandedItems(newExpanded);
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setFormData({ result: "", notes: "", pageUrl: "", elementSelector: "" });
  };

  const saveItem = async (itemId: string) => {
    try {
      setSaving(itemId);
      const res = await fetch(`/api/audits/${auditId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "tested",
          ...formData
        })
      });

      const data = await res.json();
      if (data.ok) {
        // Refresh audit data
        await fetchAudit();
        setEditingItem(null);
      }
    } catch (e) {
      console.error("Failed to save item:", e);
    } finally {
      setSaving(null);
    }
  };

  const quickSetResult = async (itemId: string, result: string) => {
    try {
      setSaving(itemId);
      const res = await fetch(`/api/audits/${auditId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "tested",
          result
        })
      });

      const data = await res.json();
      if (data.ok) {
        await fetchAudit();
      }
    } catch (e) {
      console.error("Failed to update result:", e);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Audit not found</p>
      </div>
    );
  }

  // Group items by category
  const itemsByCategory: Record<string, AuditItem[]> = {};
  audit.items.forEach(item => {
    if (!itemsByCategory[item.category]) {
      itemsByCategory[item.category] = [];
    }
    itemsByCategory[item.category].push(item);
  });

  const categories = Object.keys(itemsByCategory).sort();

  const getResultIcon = (result: string | null) => {
    switch (result) {
      case "pass":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "fail":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "na":
        return <Circle className="w-5 h-5 text-gray-400" />;
      case "needs_review":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  const progressPercentage = audit.totalCriteria > 0
    ? (audit.completedCriteria / audit.totalCriteria) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{audit.name}</h2>
            {audit.description && (
              <p className="text-gray-600 mt-1">{audit.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Link2 className="w-4 h-4" />
                {audit.site.name || audit.site.url}
              </span>
              {audit.template && (
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {audit.template.name} ({audit.template.wcagLevel})
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {Math.round(progressPercentage)}%
            </div>
            <div className="text-sm text-gray-500">Complete</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{audit.completedCriteria}</div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{audit.passedCriteria}</div>
            <div className="text-xs text-gray-500">Passed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{audit.failedCriteria}</div>
            <div className="text-xs text-gray-500">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {audit.overallScore !== null ? audit.overallScore.toFixed(1) : "-"}
            </div>
            <div className="text-xs text-gray-500">Score</div>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-4">
        {categories.map(category => {
          const items = itemsByCategory[category];
          const categoryCompleted = items.filter(i => i.result).length;
          const categoryTotal = items.length;
          const categoryProgress = (categoryCompleted / categoryTotal) * 100;

          return (
            <div
              key={category}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Category header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedCategories.has(category) ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="font-semibold text-gray-900">
                    {categoryLabels[category] || category}
                  </span>
                  <span className="text-sm text-gray-500">
                    {categoryCompleted} / {categoryTotal}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${categoryProgress}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {Math.round(categoryProgress)}%
                  </span>
                </div>
              </button>

              {/* Category items */}
              <AnimatePresence>
                {expandedCategories.has(category) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-200"
                  >
                    {items.map((item, idx) => {
                      const isExpanded = expandedItems.has(item.id);
                      const isEditing = editingItem === item.id;
                      const isSaving = saving === item.id;

                      return (
                        <div
                          key={item.id}
                          className={`border-b border-gray-100 last:border-b-0 ${
                            isExpanded ? "bg-gray-50" : ""
                          }`}
                        >
                          {/* Item header */}
                          <div className="px-6 py-4 flex items-start gap-4">
                            <div className="flex-shrink-0 mt-1">
                              {getResultIcon(item.result)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <button
                                    onClick={() => toggleItem(item.id)}
                                    className="text-left"
                                  >
                                    <h4 className="font-medium text-gray-900 hover:text-blue-600">
                                      {item.title}
                                    </h4>
                                    {item.wcagCriterion && (
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-gray-500">
                                          {item.wcagCriterion}
                                        </span>
                                        <span
                                          className={`text-xs px-2 py-0.5 rounded ${
                                            item.wcagLevel === "A"
                                              ? "bg-green-100 text-green-700"
                                              : item.wcagLevel === "AA"
                                              ? "bg-blue-100 text-blue-700"
                                              : "bg-purple-100 text-purple-700"
                                          }`}
                                        >
                                          {item.wcagLevel}
                                        </span>
                                        <span
                                          className={`text-xs px-2 py-0.5 rounded border ${
                                            priorityColors[item.priority]
                                          }`}
                                        >
                                          {item.priority}
                                        </span>
                                      </div>
                                    )}
                                  </button>
                                </div>

                                {/* Quick action buttons */}
                                {!isEditing && (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => quickSetResult(item.id, "pass")}
                                      disabled={isSaving}
                                      className="p-2 hover:bg-green-100 rounded transition-colors disabled:opacity-50"
                                      title="Pass"
                                    >
                                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    </button>
                                    <button
                                      onClick={() => quickSetResult(item.id, "fail")}
                                      disabled={isSaving}
                                      className="p-2 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                                      title="Fail"
                                    >
                                      <XCircle className="w-4 h-4 text-red-600" />
                                    </button>
                                    <button
                                      onClick={() => startEditing(item)}
                                      disabled={isSaving}
                                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                                    >
                                      Details
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Expanded details */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mt-4 space-y-4"
                                  >
                                    {item.description && (
                                      <div>
                                        <h5 className="text-sm font-medium text-gray-700 mb-1">
                                          Description
                                        </h5>
                                        <p className="text-sm text-gray-600">
                                          {item.description}
                                        </p>
                                      </div>
                                    )}

                                    {item.howToTest && (
                                      <div>
                                        <h5 className="text-sm font-medium text-gray-700 mb-1">
                                          How to Test
                                        </h5>
                                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                          {item.howToTest}
                                        </p>
                                      </div>
                                    )}

                                    {item.wcagUrl && (
                                      <div>
                                        <a
                                          href={item.wcagUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                        >
                                          View WCAG Criterion
                                          <Link2 className="w-3 h-3" />
                                        </a>
                                      </div>
                                    )}

                                    {/* Edit form */}
                                    {isEditing && (
                                      <div className="border-t border-gray-200 pt-4 space-y-4">
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Result
                                          </label>
                                          <select
                                            value={formData.result}
                                            onChange={e =>
                                              setFormData({ ...formData, result: e.target.value })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                          >
                                            <option value="">Select result...</option>
                                            <option value="pass">Pass</option>
                                            <option value="fail">Fail</option>
                                            <option value="na">Not Applicable</option>
                                            <option value="needs_review">Needs Review</option>
                                          </select>
                                        </div>

                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Notes
                                          </label>
                                          <textarea
                                            value={formData.notes}
                                            onChange={e =>
                                              setFormData({ ...formData, notes: e.target.value })
                                            }
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Add notes about this test..."
                                          />
                                        </div>

                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Page URL (optional)
                                          </label>
                                          <input
                                            type="text"
                                            value={formData.pageUrl}
                                            onChange={e =>
                                              setFormData({ ...formData, pageUrl: e.target.value })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="https://example.com/page"
                                          />
                                        </div>

                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Element Selector (optional)
                                          </label>
                                          <input
                                            type="text"
                                            value={formData.elementSelector}
                                            onChange={e =>
                                              setFormData({
                                                ...formData,
                                                elementSelector: e.target.value
                                              })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder=".button-class or #element-id"
                                          />
                                        </div>

                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => saveItem(item.id)}
                                            disabled={isSaving || !formData.result}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            {isSaving ? (
                                              <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Saving...
                                              </>
                                            ) : (
                                              <>
                                                <Save className="w-4 h-4" />
                                                Save
                                              </>
                                            )}
                                          </button>
                                          <button
                                            onClick={cancelEditing}
                                            disabled={isSaving}
                                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    )}

                                    {/* Display saved data */}
                                    {!isEditing && item.result && (
                                      <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
                                        {item.notes && (
                                          <div>
                                            <span className="font-medium text-gray-700">
                                              Notes:
                                            </span>{" "}
                                            <span className="text-gray-600">{item.notes}</span>
                                          </div>
                                        )}
                                        {item.pageUrl && (
                                          <div>
                                            <span className="font-medium text-gray-700">
                                              Page:
                                            </span>{" "}
                                            <a
                                              href={item.pageUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-600 hover:underline"
                                            >
                                              {item.pageUrl}
                                            </a>
                                          </div>
                                        )}
                                        {item.elementSelector && (
                                          <div>
                                            <span className="font-medium text-gray-700">
                                              Element:
                                            </span>{" "}
                                            <code className="text-gray-600 bg-gray-100 px-1 py-0.5 rounded">
                                              {item.elementSelector}
                                            </code>
                                          </div>
                                        )}
                                        {item.testedAt && (
                                          <div className="flex items-center gap-1 text-gray-500">
                                            <Clock className="w-3 h-3" />
                                            Tested {new Date(item.testedAt).toLocaleString()}
                                            {item.testedBy && (
                                              <span>
                                                {" "}
                                                by{" "}
                                                {item.testedBy.firstName ||
                                                  item.testedBy.email}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
