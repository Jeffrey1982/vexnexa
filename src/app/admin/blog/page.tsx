import BlogManagement from "@/components/admin/BlogManagement";

export const dynamic = 'force-dynamic';

// Simple admin check
export default async function AdminBlogPage() {
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <BlogManagement />
        </div>
      </div>
    </div>
  );
}
