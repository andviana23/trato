"use client";

import { useEffect, useState } from "react";
import { ExternalPaymentsService } from "@/lib/services/external-payments/api";
import { ExternalPayment } from "@/lib/services/external-payments/types";

export function useExternalPayments() {
  const [clientes, setClientes] = useState<ExternalPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClientes() {
      setLoading(true);
      try {
        const service = new ExternalPaymentsService();
        const data = await service.getExternalCustomers();
        setClientes(data);
      } catch (e) {
        setClientes([]);
      } finally {
        setLoading(false);
      }
    }
    fetchClientes();
  }, []);

  return { clientes, loading };
} 