'use client';

import { AuthForm } from '@/components/auth/auth-form';
import Image from 'next/image';
import logoImg from '@/public/ehlogo.png';

/**
 * Auth Page - Supabase Authentication
 * Uses proper database-backed authentication
 */
export default function AuthPage() {
  return (
    <div className="!h-screen !w-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex gap-4 items-center justify-center">
            <Image src={logoImg} alt="GPT Image Generator" width={32} height={32} style={{ display: 'inline-block' }} />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              GPT Image Generator
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Chat with AI and generate images
          </p>
        </div>

        <AuthForm />
      </div>
    </div>
  );
}