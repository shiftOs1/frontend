'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    authApi.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <Card className="border-0 shadow-xl shadow-slate-200/60">
      <CardContent className="pt-8 pb-8 text-center space-y-4">
        {status === 'loading' && (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
            <p className="text-slate-600">Verifying your email...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold text-slate-900">Email verified!</h2>
            <p className="text-sm text-slate-500">Your account is ready. You can now log in.</p>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => router.push('/login')}>
              Go to login
            </Button>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-semibold text-slate-900">Verification failed</h2>
            <p className="text-sm text-slate-500">The link is invalid or has expired.</p>
            <Button variant="outline" className="w-full" onClick={() => router.push('/login')}>
              Back to login
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
