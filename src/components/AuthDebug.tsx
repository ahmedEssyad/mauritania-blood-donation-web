'use client';

import { useAuth } from '@/contexts/AuthContext';

export function AuthDebug() {
  const { user, loading, isAuthenticated, refreshUser } = useAuth();

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') return null;

  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  return (
    <div className="fixed top-0 right-0 bg-black text-white p-2 text-xs z-50 max-w-xs overflow-y-auto max-h-64">
      <div>Loading: {loading ? '✓' : '✗'}</div>
      <div>Authenticated: {isAuthenticated ? '✓' : '✗'}</div>
      <div>User: {user ? (user.name || user.phone || 'no name/phone') : 'null'}</div>
      <div>Token: {token ? '✓' : '✗'}</div>
      <div>Stored User: {storedUser ? 'EXISTS' : 'null'}</div>
      {storedUser && (
        <div className="text-yellow-300 text-xs mt-1">
          Raw: {storedUser.substring(0, 100)}...
        </div>
      )}
      {user && (
        <div className="text-green-300 text-xs mt-1">
          ID: {user._id}<br/>
          Phone: {user.phone}<br/>
          Name: {user.name || 'No name'}
        </div>
      )}
      <button
        onClick={refreshUser}
        className="bg-blue-600 text-white px-2 py-1 text-xs mt-2 rounded"
      >
        Refresh User
      </button>
    </div>
  );
}