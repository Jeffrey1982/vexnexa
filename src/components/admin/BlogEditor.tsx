"use client";

import { useState, useMemo, useRef } from "react";
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
  EyeOff,
  Upload,
  X,
  Link as LinkIcon,
  Loader2
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
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageDialogData, setImageDialogData] = useState({ url: '', alt: '', title: '' });
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const inlineImageInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

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

  const uploadImage = async (file: File, isCover: boolean = false): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/blog/upload-image', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!result.ok) {
        setError(result.error || 'Failed to upload image');
        return null;
      }

      return result.url;
    } catch (e: any) {
      setError(e.message || 'Failed to upload image');
      return null;
    }
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    setError(null);

    const url = await uploadImage(file, true);

    if (url) {
      setFormData({ ...formData, coverImage: url });
    }

    setUploadingCover(false);

    // Reset input
    if (coverImageInputRef.current) {
      coverImageInputRef.current.value = '';
    }
  };

  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingInline(true);
    setError(null);

    const url = await uploadImage(file, false);

    if (url) {
      // Show dialog for alt text and title
      setImageDialogData({ url, alt: '', title: '' });
      setShowImageDialog(true);
    }

    setUploadingInline(false);

    // Reset input
    if (inlineImageInputRef.current) {
      inlineImageInputRef.current.value = '';
    }
  };

  const insertImageMarkdown = () => {
    const { url, alt, title } = imageDialogData;
    let markdown = `![${alt || 'Image'}](${url})`;

    if (title) {
      markdown = `![${alt || 'Image'}](${url} "${title}")`;
    }

    // Insert at cursor position or append
    const textarea = contentTextareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.content;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newContent = before + '\n\n' + markdown + '\n\n' + after;

      setFormData({ ...formData, content: newContent });

      // Move cursor after inserted image
      setTimeout(() => {
        textarea.focus();
        const newPos = start + markdown.length + 4;
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
    } else {
      // Fallback: append to end
      setFormData({ ...formData, content: formData.content + '\n\n' + markdown + '\n\n' });
    }

    // Reset dialog
    setShowImageDialog(false);
    setImageDialogData({ url: '', alt: '', title: '' });
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
                {!showPreview && (
                  <button
                    type="button"
                    onClick={() => inlineImageInputRef.current?.click()}
                    disabled={uploadingInline}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50"
                  >
                    {uploadingInline ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-3 h-3" />
                        Insert Image
                      </>
                    )}
                  </button>
                )}
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
            <input
              type="file"
              ref={inlineImageInputRef}
              onChange={handleInlineImageUpload}
              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
              className="hidden"
            />
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
                ref={contentTextareaRef}
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
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => coverImageInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                  {uploadingCover ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload
                    </>
                  )}
                </button>
                {formData.coverImage && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, coverImage: '' })}
                    className="px-3 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <input
                type="file"
                ref={coverImageInputRef}
                onChange={handleCoverImageUpload}
                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                className="hidden"
              />
              <div className="relative">
                <input
                  type="text"
                  value={formData.coverImage}
                  onChange={e =>
                    setFormData({ ...formData, coverImage: e.target.value })
                  }
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Or paste image URL"
                />
                <LinkIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              {formData.coverImage && (
                <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={formData.coverImage}
                    alt="Cover preview"
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EInvalid%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
              )}
            </div>
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

      {/* Image Dialog */}
      {showImageDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Insert Image</h3>

            <div className="space-y-4">
              {/* Image Preview */}
              {imageDialogData.url && (
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={imageDialogData.url}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              {/* Alt Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alt Text <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={imageDialogData.alt}
                  onChange={e =>
                    setImageDialogData({ ...imageDialogData, alt: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the image for accessibility"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Required for SEO and accessibility. Describe what the image shows.
                </p>
              </div>

              {/* Title (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={imageDialogData.title}
                  onChange={e =>
                    setImageDialogData({ ...imageDialogData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional caption or tooltip text"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Shown as a tooltip when hovering over the image
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowImageDialog(false);
                    setImageDialogData({ url: '', alt: '', title: '' });
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={insertImageMarkdown}
                  disabled={!imageDialogData.alt.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Insert
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
