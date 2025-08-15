"use client";

import React, { useState } from "react";
import { Box, Flex, HStack, Icon, Input, Link as CLink, Text, VStack, IconButton, Avatar, Separator } from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  LayoutGrid,
  Clock,
  Bookmark,
  ChevronDown,
  ChevronRight,
  FileText,
  LifeBuoy,
  Settings,
  MoreHorizontal,
} from "lucide-react";

type NavChild = { label: string; href: string };
type NavItem = {
  label: string;
  href?: string;
  icon?: React.ElementType;
  children?: NavChild[];
};

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Analysis", href: "/analysis", icon: Clock },
  {
    label: "Documents",
    icon: FileText,
    children: [
      { label: "Reports", href: "/documents/reports" },
      { label: "Invoices", href: "/documents/invoices" },
      { label: "Contracts", href: "/documents/contracts" },
    ],
  },
  { label: "History", href: "/history", icon: Clock },
  { label: "Favorites", href: "/favorites", icon: Bookmark },
];

export function Sidebar(): JSX.Element {
  const pathname = usePathname();
  const [openDocs, setOpenDocs] = useState<boolean>(true);
  const docsListId = "sidebar-docs";

  const NavLink = ({
    href,
    label,
    icon: IconCmp,
    active = false,
  }: {
    href?: string;
    label: string;
    icon?: React.ElementType;
    active?: boolean;
  }) => (
    <CLink
      as={NextLink}
      href={href ?? "#"}
      px={3}
      py={2.5}
      borderRadius="lg"
      bg={active ? "whiteAlpha.200" : "transparent"}
      _hover={{ bg: "whiteAlpha.100" }}
      _focusVisible={{
        outline: "2px solid",
        outlineColor: "whiteAlpha.400",
        outlineOffset: "2px",
      }}
      display="flex"
      alignItems="center"
      gap={3}
      role="menuitem"
      aria-current={active ? "page" : undefined}
    >
      {IconCmp ? <Icon as={IconCmp} boxSize={5} /> : null}
      <Text fontWeight={active ? "semibold" : "medium"}>{label}</Text>
    </CLink>
  );

  return (
    <Flex direction="column" h="100%" px={4} py={5}>
      {/* Topo: Logo */}
      <HStack mb={4} gap={3}>
        <Box w="32px" h="32px" borderRadius="full" bg="teal.400" />
        <Text fontWeight="bold">Logo</Text>
      </HStack>

      {/* Busca (sem InputGroup para compat v3) */}
      <Box mb={5} position="relative">
        <Box
          position="absolute"
          left={3}
          top="50%"
          transform="translateY(-50%)"
          color="whiteAlpha.700"
          pointerEvents="none"
        >
          <Search size={16} />
        </Box>
        <Input pl={9} placeholder="Search" aria-label="Search" />
      </Box>

      {/* Navegação */}
      <VStack as="nav" align="stretch" gap={1} role="menu" aria-label="Main">
        {NAV.slice(0, 2).map((item) => (
          <NavLink
            key={item.label}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={item.href ? pathname?.startsWith(item.href) : false}
          />
        ))}

        {/* Documents colapsável */}
        <Box>
          <HStack
            as="button"
            px={3}
            py={2.5}
            borderRadius="lg"
            _hover={{ bg: "whiteAlpha.100" }}
            _focusVisible={{
              outline: "2px solid",
              outlineColor: "whiteAlpha.400",
              outlineOffset: "2px",
            }}
            onClick={() => setOpenDocs((v) => !v)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setOpenDocs((v) => !v);
              }
            }}
            cursor="pointer"
            role="button"
            aria-expanded={openDocs}
            aria-controls={docsListId}
          >
            <Icon as={FileText} boxSize={5} />
            <Text flex="1" fontWeight="medium">
              Documents
            </Text>
            <Icon as={openDocs ? ChevronDown : ChevronRight} boxSize={4} />
          </HStack>
          {openDocs && (
            <VStack id={docsListId} align="stretch" mt={1} pl={9} gap={1}>
              {NAV[2].children!.map((c) => (
                <NavLink
                  key={c.href}
                  href={c.href}
                  label={c.label}
                  active={pathname?.startsWith(c.href)}
                />
              ))}
            </VStack>
          )}
        </Box>

        {NAV.slice(3).map((item) => (
          <NavLink
            key={item.label}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={item.href ? pathname?.startsWith(item.href) : false}
          />
        ))}
      </VStack>

      {/* Rodapé */}
      <Box mt="auto" pt={4}>
        <Separator borderColor="whiteAlpha.200" mb={3} />
        <VStack align="stretch" gap={1} mb={3}>
          <HStack
            as="button"
            px={3}
            py={2.5}
            borderRadius="lg"
            _hover={{ bg: "whiteAlpha.100" }}
            _focusVisible={{
              outline: "2px solid",
              outlineColor: "whiteAlpha.400",
              outlineOffset: "2px",
            }}
            cursor="pointer"
            role="menuitem"
            aria-label="Help Center"
          >
            <Icon as={LifeBuoy} boxSize={5} />
            <Text>Help Center</Text>
          </HStack>
          <HStack
            as="button"
            px={3}
            py={2.5}
            borderRadius="lg"
            _hover={{ bg: "whiteAlpha.100" }}
            _focusVisible={{
              outline: "2px solid",
              outlineColor: "whiteAlpha.400",
              outlineOffset: "2px",
            }}
            cursor="pointer"
            role="menuitem"
            aria-label="Settings"
          >
            <Icon as={Settings} boxSize={5} />
            <Text>Settings</Text>
          </HStack>
        </VStack>

        {/* Card de Perfil */}
        <Box borderTopWidth="1px" borderColor="whiteAlpha.200" pt={3}>
          <HStack
            px={3}
            py={2.5}
            borderRadius="lg"
            _hover={{ bg: "whiteAlpha.100" }}
            justify="space-between"
          >
            <HStack>
              <Avatar.Root size="sm">
                <Avatar.Fallback>J</Avatar.Fallback>
              </Avatar.Root>
              <Box>
                <Text fontWeight="semibold" lineHeight="1">
                  John Doe
                </Text>
                <Text fontSize="xs" color="whiteAlpha.700">
                  john@chakra-ui.com
                </Text>
              </Box>
            </HStack>
            <IconButton aria-label="User menu" variant="ghost" size="sm">
              <MoreHorizontal size={16} />
            </IconButton>
          </HStack>
        </Box>
      </Box>
    </Flex>
  );
}


