import { Card, CardContent } from "@/components/ui/card";

type Variant = "primary" | "success" | "warning" | "danger";

const numberColorByVariant: Record<Variant, string> = {
  primary: "text-sky-600 dark:text-sky-400", // azul bebê
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-red-600 dark:text-red-400",
};

export default function KPICard({ label, value, variant = "primary" }: { label: string; value: string; variant?: Variant }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">{label}</div>
        <div className={`text-2xl font-extrabold ${numberColorByVariant[variant]}`}>{value}</div>
      </CardContent>
    </Card>
  );
}


