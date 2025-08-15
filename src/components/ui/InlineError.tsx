"use client";
import { HStack, Text, Icon } from "@chakra-ui/react";
import { WarningTwoIcon } from "@chakra-ui/icons";

export default function InlineError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <HStack color="danger" gap={2}>
      <Icon as={WarningTwoIcon} />
      <Text fontSize="sm">{message}</Text>
    </HStack>
  );
}


