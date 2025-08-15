"use client";

import React from "react";
import { Button as ChakraButton, type ButtonProps as ChakraButtonProps } from "@chakra-ui/react";

type LegacyVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
type LegacySize = "default" | "sm" | "lg" | "icon";

export type ButtonProps = Omit<ChakraButtonProps, "variant" | "size"> & {
  variant?: LegacyVariant;
  size?: LegacySize;
  asChild?: boolean;
};

function mapVariant(variant?: LegacyVariant): ChakraButtonProps["variant"] {
  switch (variant) {
    case "destructive":
      return "solid";
    case "outline":
      return "outline";
    case "secondary":
      return "subtle";
    case "ghost":
      return "ghost";
    case "link":
      return "plain";
    case "default":
    default:
      return "solid";
  }
}

function mapSize(size?: LegacySize): ChakraButtonProps["size"] {
  switch (size) {
    case "sm":
      return "sm";
    case "lg":
      return "lg";
    case "icon":
      return "sm";
    case "default":
    default:
      return "md";
  }
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, asChild: _asChild, colorPalette, ...rest }, ref) => {
    const chakraVariant = mapVariant(variant);
    const chakraSize = mapSize(size);
    const palette = variant === "destructive" ? (colorPalette ?? "red") : colorPalette;
    return (
      <ChakraButton ref={ref} variant={chakraVariant} size={chakraSize} colorPalette={palette} {...rest} />
    );
  }
);
Button.displayName = "ChakraCompatButton";

// Backward export to avoid breaking imports
export const buttonVariants = {} as const;

