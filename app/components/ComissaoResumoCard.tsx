import { Card, CardHeader, CardBody } from "@/components/ui/chakra-adapters";
import { ReactNode } from "react";

interface Props {
  icon: ReactNode;
  title: string;
  value: number;
  valueColorClass: string;
  gradientClass: string;
}

export function ComissaoResumoCard({ icon, title, value, valueColorClass, gradientClass }: Props) {
  return (
    <Card className={`rounded-2xl shadow-lg border-0 ${gradientClass}`}>
      <CardHeader className="flex items-center gap-3 pb-0">
        {icon}
        <span className="text-lg font-semibold text-gray-900">{title}</span>
      </CardHeader>
      <CardBody className="pt-2">
        <span className={`text-4xl font-extrabold block ${valueColorClass}`}>
          R$ {value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
      </CardBody>
    </Card>
  );
}
