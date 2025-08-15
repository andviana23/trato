"use client";
import { SimpleGrid, SimpleGridProps } from "@chakra-ui/react";

export default function KpiGrid(props: SimpleGridProps) {
  const { columns = { base: 1, sm: 2, lg: 4 }, spacing = 4, ...rest } = props as any;
  return <SimpleGrid columns={columns as any} spacing={spacing} {...rest} />;
}


