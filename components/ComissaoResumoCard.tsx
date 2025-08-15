import { Card, HStack, Heading, Text } from "@chakra-ui/react";
import { ReactNode } from "react";

interface Props {
  icon: ReactNode;
  title: string;
  value: number;
  valueColorClass?: string; // ignorado, mantido por compat
  gradientClass?: string;   // ignorado, mantido por compat
}

export function ComissaoResumoCard({ icon, title, value }: Props) {
  return (
    <Card.Root bg="gray.800" borderWidth="1px" borderColor="whiteAlpha.200" rounded="2xl" shadow="md">
      <Card.Header>
        <HStack gap={3} align="center">
          {icon}
          <Heading size="sm">{title}</Heading>
        </HStack>
      </Card.Header>
      <Card.Body>
        <Text fontSize="3xl" fontWeight="extrabold" color="green.300">
          R$ {value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </Text>
      </Card.Body>
    </Card.Root>
  );
}
