import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { InfoIcon } from "lucide-react";
import { FetchDataSteps } from "@/components/tutorial/fetch-data-steps";

export default function ProtectedPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-20 items-center">
      <div className="w-full">
        <h1 className="text-3xl font-bold mb-4">Página Protegida</h1>
        <p>Esta página só pode ser acessada por usuários autenticados.</p>
      </div>
    </div>
  )
}
