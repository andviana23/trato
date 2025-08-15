"use client";
import { Badge, type BadgeProps } from "@chakra-ui/react";

type Kind = "brand" | "accent" | "success" | "warning" | "danger";

export interface StatBadgeProps extends Omit<BadgeProps, "variant"> {
  kind?: Kind;
}

export default function StatBadge({ kind = "brand", children, ...rest }: StatBadgeProps) {
  const map: Record<Kind, NonNullable<BadgeProps["variant"]>> = {
    brand: "solid",
    accent: "subtle",
    success: "solid",
    warning: "subtle",
    danger: "solid",
  };

  return (
    <Badge variant={map[kind]} {...rest}>
      {children}
    </Badge>
  );
}


