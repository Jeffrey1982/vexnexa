"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ScanDebugger() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testDirectScan = async () => {
    setLoading(true);
    setResults(null);

    try {
      console.log('🧪 Testing direct API call...');

      // Test 1: Basic connectivity
      const testResponse = await fetch('/api/test-scan?url=https://example.com');
      const testData = await testResponse.json();
      console.log('🧪 Test scan result:', testData);

      // Test 2: Debug info
      const debugResponse = await fetch('/api/debug-scan');
      const debugData = await debugResponse.json();
      console.log('🧪 Debug scan result:', debugData);

      // Test 3: Actual scan
      const scanResponse = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' })
      });
      const scanData = await scanResponse.json();
      console.log('🧪 Actual scan result:', scanData);

      setResults({
        test: testData,
        debug: debugData,
        scan: scanData,
        scanStatus: scanResponse.status
      });

    } catch (error) {
      console.error('🧪 Test failed:', error);
      setResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testSimpleFetch = async () => {
    setLoading(true);
    try {
      console.log('🧪 Testing simple fetch to example.com...');

      const response = await fetch('https://example.com', {
        method: 'HEAD',
        mode: 'no-cors'
      });

      console.log('🧪 Fetch result:', response.status);
      setResults({ fetchTest: 'Success', status: response.status });
    } catch (error) {
      console.error('🧪 Fetch failed:', error);
      setResults({ fetchTest: 'Failed', error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h3 className="font-semibold mb-4">🔧 Scan Debugger</h3>

      <div className="space-x-2 mb-4">
        <Button onClick={testDirectScan} disabled={loading}>
          {loading ? 'Testing...' : 'Test All APIs'}
        </Button>

        <Button onClick={testSimpleFetch} disabled={loading} variant="outline">
          Test Simple Fetch
        </Button>
      </div>

      {results && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Results:</h4>
          <pre className="bg-gray-800 text-green-300 p-3 rounded text-xs overflow-auto max-h-64">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}