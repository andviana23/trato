"use client";
import { Tabs as CTabs, TabsList, TabsTrigger, TabsContent } from "@chakra-ui/react";
import { ReactNode } from "react";

export interface AppTabsProps {
  variant?: any;
  tabs: { label: string; content: ReactNode; disabled?: boolean; value?: string }[];
  selectedKey?: string;
  onSelectionChange?: (key: string) => void;
  [key: string]: any;
}

export default function AppTabs({ variant = "line", tabs, selectedKey, onSelectionChange, ...rest }: AppTabsProps) {
  return (
    <CTabs.Root value={selectedKey} onValueChange={(e: any) => onSelectionChange?.(e.value)} variant={variant as any} {...rest}>
      <TabsList>
        {tabs.map((t, i) => (
          <TabsTrigger key={t.value ?? i} value={t.value ?? String(i)} disabled={t.disabled}>{t.label}</TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((t, i) => (
        <TabsContent key={t.value ?? i} value={t.value ?? String(i)}>{t.content}</TabsContent>
      ))}
    </CTabs.Root>
  );
}


