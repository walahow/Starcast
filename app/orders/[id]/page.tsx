'use client';

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OrderRedirect({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/orders/${resolvedParams.id}/invoice`);
  }, [resolvedParams.id, router]);

  return null;
}
