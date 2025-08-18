import { z } from "zod";

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().min(1, "Informe o nome"),
  categoria: z.string().min(1, "Informe a especialidade"),
  marca: z.string().optional().default(""),
  valor: z.number().nonnegative(),
  custo: z.number().nonnegative().optional().default(0),
  quantidade: z.number().int().nonnegative(),
  ativo: z.boolean().optional().default(true),
  estoque_minimo: z.number().int().nonnegative().optional().default(0),
});

export type Product = z.infer<typeof productSchema>;

export const importCsvSchema = z.object({
  content: z.string().min(1),
});


















