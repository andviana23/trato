"use client";
import { VStack, Skeleton, Spinner, Text } from "@chakra-ui/react";

export default function LoadingState({ lines = 3, spinner = false }: { lines?: number; spinner?: boolean }) {
  if (spinner) {
    return (
      <VStack py={8} gap={3}>
        <Spinner />
        <Text color="text.muted">Carregando...</Text>
      </VStack>
    );
  }
  return (
    <VStack py={4} gap={3} align="stretch">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height="20px" rounded="md" />
      ))}
    </VStack>
  );
}


