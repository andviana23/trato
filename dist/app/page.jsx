"use client";
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
export default function HomePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    useEffect(() => {
        if (!loading) {
            if (user) {
                router.push('/dashboard');
            }
            else {
                router.push('/auth/login');
            }
        }
    }, [user, loading, router]);
    if (loading) {
        return (<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-barbershop-light to-white dark:from-barbershop-dark dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>);
    }
    return null;
}
