'use client';

import React from 'react';
import AdminDashboard from '../../components/admin/AdminDashboard';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  return (
    <AdminDashboard
      onBackToMap={() => {
        router.push('/');
      }}
    />
  );
}
