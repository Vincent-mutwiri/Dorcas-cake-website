'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function CheckAdminPage() {
  const { data: session, status, update } = useSession();
  const [dbCheck, setDbCheck] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const res = await fetch('/api/check-session');
        const data = await res.json();
        setDbCheck(data);
      } catch (err) {
        setError('Failed to check admin status');
        console.error('Error checking admin status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [session]);

  if (status === 'loading' || isLoading) {
    return <div>Loading...</div>;
  }

  const refreshSession = async () => {
    try {
      await update();
      window.location.reload();
    } catch (err) {
      console.error('Error refreshing session:', err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Status Check</h1>
      
      <div className="mb-6 p-4 border rounded bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Session Data</h2>
        <pre className="text-sm bg-white p-3 rounded border overflow-auto">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>
      
      <div className="mb-6 p-4 border rounded bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Database Check</h2>
        <pre className="text-sm bg-white p-3 rounded border overflow-auto">
          {JSON.stringify(dbCheck, null, 2)}
        </pre>
      </div>

      <div className="space-y-4">
        <button
          onClick={refreshSession}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh Session
        </button>
        
        <div>
          <p className="font-semibold">Next Steps:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>If database shows <code>isAdmin: true</code> but session doesn't, click "Refresh Session"</li>
            <li>If that doesn't work, sign out and sign back in</li>
            <li>If the database doesn't show <code>isAdmin: true</code>, the user is not an admin in the database</li>
          </ul>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}
    </div>
  );
}
