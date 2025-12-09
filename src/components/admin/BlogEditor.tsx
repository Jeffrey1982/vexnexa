"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import DOMPurify from "dompurify";
import {
  Save,
  Eye,
  FileText,
  Image as ImageIcon,
  Tag,
  Calendar,
  AlertCircle,
  BookOpen,
  Clock,
  CheckCircle2,
  EyeOff
} from "lucide-react";

interface BlogEditorProps {
  initialData?: {
    id?: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    coverImage?: string;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    category: string;
    tags?: string[];
    status: string;
    publishedAt?: string;
  };
  onSave?: (data: any) => void;
  onCancel?: () => void;
}

export default function BlogEditor({ initialData, onSave, onCancel }: BlogEditorProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    content: initialData?.content || "",
    excerpt: initialData?.excerpt || "",
    coverImage: initialData?.coverImage || "",
    metaTitle: initialData?.metaTitle || "",
    metaDescription: initialData?.metaDescription || "",
    metaKeywords: initialData?.metaKeywords?.join(", ") || "",
    category: initialData?.category || "Accessibility",
    tags: initialData?.tags?.join(", ") || "",
    status: initialData?.status || "draft"
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Calculate word count and reading time
  const stats = useMemo(() => {
    const words = formData.content.trim().split(/\s+/).filter(w => w.length > 0).length;
    const readingTime = Math.ceil(words / 200); // Average reading speed
    const characters = formData.content.length;
    return { words, readingTime, characters };
  }, [formData.content]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title)
    });
  };

  const handleSave = async (status?: string) => {
    setError(null);

    if (!formData.title || !formData.slug || !formData.content) {
      setError("Title, slug, and content are required");
      return;
    }

    try {
      setSaving(true);

      const data = {
        ...formData,
        metaKeywords: formData.metaKeywords
          .split(",")
          .map(k => k.trim())
          .filter(k => k),
        tags: formData.tags
          .split(",")
          .map(t => t.trim())
          .filter(t => t),
        status: status || formData.status
      };

      if (initialData?.id) {
        // Update existing post
        const res = await fetch(`/api/blog/${initialData.slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });

        const result = await res.json();
        if (!result.ok) {
          setError(result.error || "Failed to update post");
          return;
        }
      } else {
        // Create new post
        const res = await fetch("/api/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });

        const result = await res.json();
        if (!result.ok) {
          setError(result.error || "Failed to create post");
          return;
        }
      }

      if (onSave) {
        onSave(data);
      }

      setLastSaved(new Date());
    } catch (e: any) {
      setError(e.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Save Status & Errors */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>
        {lastSaved && !error && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            <span>
              Saved {new Date(lastSaved).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main content */}
        <div className="col-span-2 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => handleTitleChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg font-medium"
              placeholder="Enter blog post title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">yoursite.com/blog/</span>
              <input
                type="text"
                value={formData.slug}
                onChange={e =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="post-slug"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Content <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {stats.words} words
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {stats.readingTime} min read
                </span>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                >
                  {showPreview ? (
                    <>
                      <EyeOff className="w-3 h-3" />
                      Edit
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" />
                      Preview
                    </>
                  )}
                </button>
              </div>
            </div>
            {showPreview ? (
              <div className="w-full min-h-[500px] px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(formData.content.replace(/\n/g, '<br/>'), {
                    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre'],
                    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class']
                  })
                }} />
              </div>
            ) : (
              <textarea
                value={formData.content}
                onChange={e =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={20}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="Write your blog post content in Markdown..."
              />
            )}
            <p className="text-xs text-gray-500 mt-1">
              Supports Markdown formatting • {stats.characters} characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Excerpt
            </label>
            <textarea
              value={formData.excerpt}
              onChange={e =>
                setFormData({ ...formData, excerpt: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="A brief summary of the post (optional)"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publishing */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Publishing
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={e =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleSave("draft")}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  Save Draft
                </button>
                <button
                  onClick={() => handleSave("published")}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Eye className="w-4 h-4" />
                  Publish
                </button>
              </div>
            </div>
          </div>

          {/* Cover Image */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Cover Image
            </h3>
            <input
              type="text"
              value={formData.coverImage}
              onChange={e =>
                setFormData({ ...formData, coverImage: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Image URL"
            />
            {formData.coverImage && (
              <div className="mt-3 rounded-lg overflow-hidden">
                <img
                  src={formData.coverImage}
                  alt="Cover preview"
                  className="w-full h-32 object-cover"
                />
              </div>
            )}
          </div>

          {/* Category & Tags */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Organization
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={e =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Accessibility">Accessibility</option>
                  <option value="WCAG">WCAG</option>
                  <option value="Best Practices">Best Practices</option>
                  <option value="News">News</option>
                  <option value="Tutorials">Tutorials</option>
                  <option value="Case Studies">Case Studies</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={e =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="tag1, tag2, tag3"
                />
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              SEO
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Meta Title
                  </label>
                  <span className={`text-xs ${formData.metaTitle.length > 60 ? 'text-orange-600' : 'text-gray-500'}`}>
                    {formData.metaTitle.length}/60
                  </span>
                </div>
                <input
                  type="text"
                  value={formData.metaTitle}
                  onChange={e =>
                    setFormData({ ...formData, metaTitle: e.target.value })
                  }
                  maxLength={70}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="SEO title (50-60 characters)"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Meta Description
                  </label>
                  <span className={`text-xs ${formData.metaDescription.length > 160 ? 'text-orange-600' : 'text-gray-500'}`}>
                    {formData.metaDescription.length}/160
                  </span>
                </div>
                <textarea
                  value={formData.metaDescription}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      metaDescription: e.target.value
                    })
                  }
                  rows={3}
                  maxLength={170}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="SEO description (150-160 characters)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keywords
                </label>
                <input
                  type="text"
                  value={formData.metaKeywords}
                  onChange={e =>
                    setFormData({ ...formData, metaKeywords: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="keyword1, keyword2"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
        >
          Cancel
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
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
        </div>
      </div>
    </div>
  );
}
