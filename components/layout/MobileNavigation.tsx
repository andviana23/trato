'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Box, VStack, HStack, Text, IconButton, Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton, Button, Avatar, Divider, useColorModeValue } from '@chakra-ui/react';
import { Menu, Home, Calendar, Users, BarChart3, Settings, User, LogOut, Bell, Search, Plus } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useUnidadeStore } from '@/lib/stores/useUnidadeStore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MobileNavigationProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export function MobileNavigation({ isOpen, onOpen, onClose }: MobileNavigationProps) {
  const { user, signOut } = useAuth();
  const { unidade } = useUnidadeStore();
  const pathname = usePathname();
  const btnRef = useRef<HTMLButtonElement>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');

  const navigationItems = [
    {
      label: 'Início',
      href: '/',
      icon: Home,
      active: pathname === '/',
    },
    {
      label: 'Agenda',
      href: '/agenda',
      icon: Calendar,
      active: pathname.startsWith('/agenda'),
    },
    {
      label: 'Fila',
      href: '/fila',
      icon: Users,
      active: pathname.startsWith('/fila'),
    },
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: BarChart3,
      active: pathname.startsWith('/dashboard'),
    },
    {
      label: 'Configurações',
      href: '/configuracoes',
      icon: Settings,
      active: pathname.startsWith('/configuracoes'),
    },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <>
      {/* Botão do menu hambúrguer */}
      <IconButton
        ref={btnRef}
        aria-label="Abrir menu de navegação"
        icon={<Menu size={20} />}
        variant="ghost"
        size="lg"
        onClick={onOpen}
        className="desktop-hidden"
        colorScheme="gray"
        _hover={{ bg: 'gray.100' }}
      />

      {/* Drawer de navegação */}
      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        finalFocusRef={btnRef}
        size="full"
      >
        <DrawerOverlay />
        <DrawerContent bg={bgColor}>
          <DrawerCloseButton size="lg" />
          <DrawerHeader borderBottomWidth="1px" borderColor={borderColor}>
            <VStack align="flex-start" spacing={2}>
              <Text fontSize="xl" fontWeight="bold" color={textColor}>
                Trato de Barbados
              </Text>
              {unidade && (
                <Text fontSize="sm" color={mutedTextColor}>
                  {unidade}
                </Text>
              )}
            </VStack>
          </DrawerHeader>

          <DrawerBody p={0}>
            <VStack spacing={0} align="stretch">
              {/* Perfil do usuário */}
              <Box p={4} borderBottomWidth="1px" borderColor={borderColor}>
                <HStack spacing={3}>
                  <Avatar size="md" name={user?.user_metadata?.full_name || user?.email} />
                  <VStack align="flex-start" spacing={1} flex={1}>
                    <Text fontSize="sm" fontWeight="medium" color={textColor}>
                      {user?.user_metadata?.full_name || 'Usuário'}
                    </Text>
                    <Text fontSize="xs" color={mutedTextColor}>
                      {user?.email}
                    </Text>
                  </VStack>
                </HStack>
              </Box>

              {/* Menu de navegação */}
              <VStack spacing={0} align="stretch" flex={1}>
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href} onClick={onClose}>
                      <Box
                        px={4}
                        py={3}
                        bg={item.active ? 'blue.50' : 'transparent'}
                        borderLeftWidth={item.active ? '4px' : '0'}
                        borderLeftColor={item.active ? 'blue.500' : 'transparent'}
                        _hover={{ bg: item.active ? 'blue.50' : 'gray.50' }}
                        transition="all 0.2s"
                      >
                        <HStack spacing={3}>
                          <Icon 
                            size={20} 
                            color={item.active ? '#3b82f6' : '#6b7280'} 
                          />
                          <Text
                            fontSize="sm"
                            fontWeight={item.active ? 'medium' : 'normal'}
                            color={item.active ? 'blue.600' : textColor}
                          >
                            {item.label}
                          </Text>
                        </HStack>
                      </Box>
                    </Link>
                  );
                })}
              </VStack>

              <Divider />

              {/* Ações rápidas */}
              <Box p={4}>
                <VStack spacing={3} align="stretch">
                  <Button
                    leftIcon={<Plus size={16} />}
                    colorScheme="blue"
                    size="sm"
                    variant="solid"
                    onClick={onClose}
                  >
                    Novo Agendamento
                  </Button>
                  
                  <Button
                    leftIcon={<Search size={16} />}
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                  >
                    Buscar Cliente
                  </Button>
                </VStack>
              </Box>

              <Divider />

              {/* Logout */}
              <Box p={4}>
                <Button
                  leftIcon={<LogOut size={16} />}
                  variant="ghost"
                  size="sm"
                  colorScheme="red"
                  onClick={handleSignOut}
                  w="full"
                  justifyContent="flex-start"
                >
                  Sair
                </Button>
              </Box>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}

// Componente de navegação inferior para mobile
export function BottomNavigation() {
  const pathname = usePathname();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const activeColor = useColorModeValue('blue.500', 'blue.400');
  const inactiveColor = useColorModeValue('gray.500', 'gray.400');

  const bottomNavItems = [
    {
      label: 'Início',
      href: '/',
      icon: Home,
      active: pathname === '/',
    },
    {
      label: 'Agenda',
      href: '/agenda',
      icon: Calendar,
      active: pathname.startsWith('/agenda'),
    },
    {
      label: 'Fila',
      href: '/fila',
      icon: Users,
      active: pathname.startsWith('/fila'),
    },
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: BarChart3,
      active: pathname.startsWith('/dashboard'),
    },
  ];

  return (
    <Box
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg={bgColor}
      borderTopWidth="1px"
      borderColor={borderColor}
      zIndex={999}
      className="desktop-hidden"
    >
      <HStack justify="space-around" p={2}>
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <VStack spacing={1} align="center" flex={1}>
                <Icon 
                  size={20} 
                  color={item.active ? activeColor : inactiveColor} 
                />
                <Text
                  fontSize="xs"
                  color={item.active ? activeColor : inactiveColor}
                  fontWeight={item.active ? 'medium' : 'normal'}
                >
                  {item.label}
                </Text>
              </VStack>
            </Link>
          );
        })}
      </HStack>
    </Box>
  );
}
