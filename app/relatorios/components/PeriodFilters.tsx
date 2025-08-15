"use client";

import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

type Values = z.infer<typeof schema>;

export default function PeriodFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      from: params.get("from") || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
      to: params.get("to") || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10),
    },
  });

  useEffect(() => {
    // sincroniza quando o usuário troca de aba
    const from = params.get("from");
    const to = params.get("to");
    if (from && to) form.reset({ from, to });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.toString()]);

  function onSubmit(values: Values) {
    const sp = new URLSearchParams(params.toString());
    sp.set("from", values.from);
    sp.set("to", values.to);
    router.push(`${pathname}?${sp.toString()}`);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col">
        <label className="text-xs text-muted-foreground mb-1">Data inicial</label>
        <Input type="date" {...form.register("from")}/>
      </div>
      <div className="flex flex-col">
        <label className="text-xs text-muted-foreground mb-1">Data final</label>
        <Input type="date" {...form.register("to")}/>
      </div>
      <Button type="submit" aria-label="Filtrar">Filtrar</Button>
    </form>
  );
}







