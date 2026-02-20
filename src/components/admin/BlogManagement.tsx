"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Filter,
  Calendar,
  TrendingUp
} from "lucide-react";
import BlogEditor from "./BlogEditor";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  category: string;
  tags: string[];
  status: string;
  locale: string; // en, nl, fr, es, pt
  views: number;
  publishedAt: string | null;
  createdAt: string;
  author: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

export default function BlogManagement() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPosts();
  }, [statusFilter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ admin: "true" });
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/blog?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setPosts(data.posts || []);
      }
    } catch (e) {
      console.error("Failed to fetch posts:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      const res = await fetch(`/api/blog/${slug}`, {
        method: "DELETE"
      });

      const data = await res.json();
      if (data.ok) {
        await fetchPosts();
      }
    } catch (e) {
      console.error("Failed to delete post:", e);
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setShowEditor(true);
  };

  const handleCreate = () => {
    setEditingPost(null);
    setShowEditor(true);
  };

  const handleSave = async () => {
    setShowEditor(false);
    setEditingPost(null);
    await fetchPosts();
  };

  const handleCancel = () => {
    setShowEditor(false);
    setEditingPost(null);
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusStats = {
    total: posts.length,
    published: posts.filter(p => p.status === "published").length,
    draft: posts.filter(p => p.status === "draft").length,
    archived: posts.filter(p => p.status === "archived").length
  };

  const totalViews = posts.reduce((sum, p) => sum + p.views, 0);

  if (showEditor) {
    // Convert BlogPost (with null) to BlogEditor format (with undefined)
    const editorData = editingPost ? {
      id: editingPost.id,
      title: editingPost.title,
      slug: editingPost.slug,
      content: editingPost.content,
      excerpt: editingPost.excerpt ?? undefined,
      category: editingPost.category,
      tags: editingPost.tags,
      status: editingPost.status,
      publishedAt: editingPost.publishedAt ?? undefined
    } : undefined;

    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground">
            {editingPost ? "Edit Post" : "Create New Post"}
          </h2>
        </div>
        <BlogEditor
          initialData={editorData}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground">Blog Management</h2>
          <p className="text-muted-foreground mt-1">Manage your blog posts and content</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Post
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:border-white/[0.06] p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-foreground">{statusStats.total}</div>
          <div className="text-sm text-muted-foreground">Total Posts</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:border-white/[0.06] p-4">
          <div className="text-2xl font-bold text-green-600">{statusStats.published}</div>
          <div className="text-sm text-muted-foreground">Published</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:border-white/[0.06] p-4">
          <div className="text-2xl font-bold text-yellow-600">{statusStats.draft}</div>
          <div className="text-sm text-muted-foreground">Drafts</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:border-white/[0.06] p-4">
          <div className="text-2xl font-bold text-muted-foreground">{statusStats.archived}</div>
          <div className="text-sm text-muted-foreground">Archived</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:border-white/[0.06] p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <div className="text-2xl font-bold text-blue-600">{totalViews}</div>
          </div>
          <div className="text-sm text-muted-foreground">Total Views</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:border-white/[0.06] p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-white/[0.08] rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-white/[0.08] rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:border-white/[0.06] p-12 text-center">
          <p className="text-muted-foreground">No posts found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post, idx) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 dark:border-white/[0.06] p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">{post.title}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        post.status === "published"
                          ? "bg-green-100 text-green-700"
                          : post.status === "draft"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700 dark:text-muted-foreground"
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>
                  {post.excerpt && (
                    <p className="text-muted-foreground text-sm mb-3">{post.excerpt}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString()
                        : "Not published"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {post.views} views
                    </span>
                    <span className="px-2 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                      {post.category}
                    </span>
                    {post.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        {post.tags.slice(0, 3).map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-gray-100 text-muted-foreground rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                        {post.tags.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{post.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {post.status === "published" && (
                    <a
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:bg-blue-950/30 rounded-lg transition-colors"
                      title="View post"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => handleEdit(post)}
                    className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:bg-blue-950/30 rounded-lg transition-colors"
                    title="Edit post"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(post.slug)}
                    className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:bg-red-950/30 rounded-lg transition-colors"
                    title="Delete post"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
