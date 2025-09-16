'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminTest() {
  const [authResult, setAuthResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Test authentication
    fetch('/admin/debug')
      .then(res => res.json())
      .then(data => {
        setAuthResult(data);
        setLoading(false);
      })
      .catch(err => {
        setAuthResult({ success: false, error: err.message });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Admin Test Page</CardTitle>
            <CardDescription>Testing authentication and admin access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Authentication Status:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm">
                {JSON.stringify(authResult, null, 2)}
              </pre>
            </div>

            <div className="flex gap-4">
              <Link href="/admin">
                <Button>Go to Admin Dashboard</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline">Login Page</Button>
              </Link>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold">Expected Admin Email:</h4>
              <p>jeffrey.aay@gmail.com</p>

              <h4 className="font-semibold mt-4">Your Current Email:</h4>
              <p>{authResult?.user?.email || 'Not logged in'}</p>

              <h4 className="font-semibold mt-4">Admin Access:</h4>
              <p>{authResult?.user?.email === 'jeffrey.aay@gmail.com' ? '✅ YES - You have admin access' : '❌ NO - Admin access required'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}