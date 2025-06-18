"use client";

import { useEffect, useState } from "react";
import { AsaasTrato } from "@/lib/services/asaas/trato-api";
import { AsaasCustomer } from "@/lib/services/asaas/types";

export function useAsaasTrato() {
  const [clientes, setClientes] = useState<AsaasCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClientes() {
      setLoading(true);
      try {
        const service = new AsaasTrato();
        const data = await service.getActiveCustomers();
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