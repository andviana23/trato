"use client";
import { Box, Flex, HStack, VStack, Text, Icon } from "@chakra-ui/react";
import { ReactNode } from "react";

type Trend = "up" | "down" | "neutral";
type Tone = "brand" | "accent" | "neutral";

export interface KpiCardProps {
  title: string;
  value: ReactNode;
  helperText?: string;
  trend?: Trend;
  trendValue?: string;
  icon?: React.ElementType;
  tone?: Tone;
  emphasized?: boolean;
}

const toneMap = {
  brand: { bg: "brand.soft", color: "brand.solid" },
  accent: { bg: "accent.soft", color: "accent.solid" },
  neutral: { bg: "bg.subtle", color: "text.primary" },
};

export default function KpiCard({
  title,
  value,
  helperText,
  trend = "neutral",
  trendValue,
  icon,
  tone = "brand",
  emphasized = false,
}: KpiCardProps) {
  const t = toneMap[tone] ?? toneMap.brand;

  return (
    <Box bg="bg.surface" borderWidth="1px" borderColor="border.default" rounded="xl" boxShadow="elevation" p={4} role="group">
      <HStack justify="space-between" align="start" mb={3}>
        <VStack align="start" gap={0}>
          <Text fontSize="sm" color="text.muted">{title}</Text>
          <HStack gap={2} align="baseline">
            <Text fontSize="3xl" fontWeight="700" color="text.primary">{value}</Text>
            {trendValue && (
              <Text fontSize="sm" fontWeight="600" color={trend === "up" ? "success" : trend === "down" ? "danger" : "text.muted"}>
                {trend === "up" ? "▲ " : trend === "down" ? "▼ " : ""}
                {trendValue}
              </Text>
            )}
          </HStack>
        </VStack>

        {icon && (
          <Flex bg={emphasized ? t.bg : "bg.subtle"} color={emphasized ? t.color : "text.primary"} borderWidth="1px" borderColor={emphasized ? t.color : "border.default"} rounded="xl" p={2}>
            <Icon as={icon} boxSize={5} />
          </Flex>
        )}
      </HStack>

      {helperText && <Text fontSize="sm" color="text.muted">{helperText}</Text>}
    </Box>
  );
}


