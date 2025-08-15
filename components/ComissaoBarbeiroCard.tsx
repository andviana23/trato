import { Card, Avatar, HStack, VStack, Text, Button, Box } from "@chakra-ui/react";
import { ReactNode } from "react";

interface Props {
  nome: string;
  avatarUrl: string;
  minutos: number;
  percentual: number;
  comissao: number;
  ticketMedio: number;
  tipos: Record<string, number>;
  tipoServicoIcone: Record<string, ReactNode>;
  onClick: () => void;
}

export function ComissaoBarbeiroCard({
  nome, avatarUrl, minutos, percentual, comissao, ticketMedio, tipos, onClick
}: Props) {
  return (
    <Card.Root bg="gray.800" borderWidth="1px" borderColor="whiteAlpha.200" rounded="2xl">
      <Card.Body>
        <VStack alignItems="center" gap={2}>
          <Avatar.Root size="lg">
            <Avatar.Image src={avatarUrl} />
            <Avatar.Fallback>{nome?.[0] ?? "U"}</Avatar.Fallback>
          </Avatar.Root>
          <Button variant="ghost" onClick={onClick} px={3} py={1}>
            <Text fontWeight="bold" fontSize="lg">{nome}</Text>
          </Button>
          <Text fontSize="xs" color="whiteAlpha.700">{minutos} min • {(percentual * 100).toFixed(1)}% do mês</Text>
          <Text fontSize="2xl" fontWeight="extrabold" color="green.300">R$ {comissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</Text>
          <Text fontSize="sm" color="whiteAlpha.700">Comissão Total</Text>
          <Text fontSize="md" fontWeight="semibold" color="blue.300">Ticket Médio: R$ {ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</Text>
          <Box w="full" borderTopWidth="1px" borderColor="whiteAlpha.200" pt={3} mt={2}>
            <HStack wrap="wrap" gap={2} justify="space-between">
              {Object.entries(tipos).map(([tipo, qtd]) => (
                <VStack key={tipo} minW="60px" gap={0} flexBasis="24%">
                  <Text fontSize="xs" color="whiteAlpha.800" textAlign="center">{tipo}</Text>
                  <Text fontSize="md" color="green.300" fontWeight="bold">{qtd}</Text>
                </VStack>
              ))}
            </HStack>
          </Box>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
