"use client";
import { HStack, Button } from "@chakra-ui/react";

export default function FormActions({
  onCancel, isSubmitting, submitLabel = "Salvar", cancelLabel = "Cancelar",
}: {
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
}) {
  return (
    <HStack justify="flex-end" gap={3}>
      {onCancel && <Button variant="outline" onClick={onCancel}>{cancelLabel}</Button>}
      <Button type="submit" loading={!!isSubmitting}>{submitLabel}</Button>
    </HStack>
  );
}


