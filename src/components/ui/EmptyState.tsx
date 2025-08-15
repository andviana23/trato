"use client";
import { VStack, Text, Button } from "@chakra-ui/react";
import { ReactNode } from "react";

export default function EmptyState({
  title = "Nada por aqui ainda",
  description = "Comece adicionando um novo registro.",
  actionLabel,
  onAction,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <VStack py={8} gap={2}>
      <Text fontSize="lg" fontWeight="700" color="text.primary">{title}</Text>
      <Text color="text.muted">{description}</Text>
      {actionLabel && onAction && (
        <Button variant="solid" onClick={onAction} mt={2}>
          {actionLabel}
        </Button>
      )}
    </VStack>
  );
}


