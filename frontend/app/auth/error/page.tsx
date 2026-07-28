'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ErrorMessage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <p className="mt-2 text-center text-sm text-gray-600">
      {error === 'AccessDenied'
        ? 'You do not have permission to sign in.'
        : error === 'Configuration'
        ? 'There is a problem with the server configuration.'
        : 'An error occurred during authentication.'}
    </p>
  );
}

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <Suspense fallback={null}>
            <ErrorMessage />
          </Suspense>
        </div>
        <div className="mt-8">
          <Link
            href="/auth/signin"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Try Again
          </Link>
        </div>
      </div>
    </div>
  );
}
