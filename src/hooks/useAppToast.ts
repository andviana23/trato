"use client";
// Compat: fallback simples de toast via evento custom caso useToast não exista
import { chakra } from "@chakra-ui/react";

type ToastStatus = "success" | "error" | "info" | "warning";

export interface AppToastOptions {
  title: string;
  description?: string;
  durationMs?: number;
  isClosable?: boolean;
  status?: ToastStatus;
  id?: string;
}

export function useAppToast() {
  const isBrowser = typeof document !== "undefined";

  const show = (options: AppToastOptions) => {
    const {
      title,
      description,
      durationMs = 4000,
      isClosable = true,
      status = "info",
      id,
    } = options;

    // Sem dependência de toast global aqui; prevenir duplicidade opcionalmente pelo id via dataset do evento

    // Se estiver usando Chakra v3 sem useToast, dispare um evento para um listener global
    if (isBrowser) {
      const ev = new CustomEvent("app:toast", { detail: { id, title, description, status, isClosable, durationMs } });
      window.dispatchEvent(ev);
    }
  };

  const success = (o: Omit<AppToastOptions, "status">) => show({ ...o, status: "success" });
  const error = (o: Omit<AppToastOptions, "status">) => show({ ...o, status: "error" });
  const info = (o: Omit<AppToastOptions, "status">) => show({ ...o, status: "info" });
  const warning = (o: Omit<AppToastOptions, "status">) => show({ ...o, status: "warning" });

  return { show, success, error, info, warning };
}


