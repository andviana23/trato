"use client";

import { useEffect, useState } from "react";
import { AsaasAndrey } from "@/lib/services/asaas/andrey-api";
import { AsaasCustomer } from "@/lib/services/asaas/types";

export function useAsaasAndrey() {
  const [clientes, setClientes] = useState<AsaasCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClientes() {
      setLoading(true);
      try {
        const service = new AsaasAndrey();
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