'use client';

import { signIn } from 'next-auth/react';
import Image from 'next/image';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Togedo
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Collaborative task management made simple
          </p>
        </div>
        <div className="mt-8">
          <div>
            <div className="mt-6">
              <button
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Image
                  src="/google.svg"
                  alt="Google"
                  width={20}
                  height={20}
                  className="mr-2"
                  style={{ width: 'auto', height: 'auto' }}
                />
                Sign in with Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 