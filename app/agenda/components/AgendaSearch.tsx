'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Box, Input, Box as ChakraBox, Text, VStack, HStack, Avatar, Badge } from '@chakra-ui/react';
import { Search, User, Clock } from 'lucide-react';
import { useClients } from '@/lib/query/hooks/useClients';

interface AgendaSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface Client {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  ultimo_agendamento?: string;
}

export function AgendaSearch({ value, onChange, placeholder = "Buscar..." }: AgendaSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Hook para buscar clientes
  const { data: clients, isLoading } = useClients();

  // Filtrar clientes baseado na busca
  useEffect(() => {
    if (!value.trim() || !clients) {
      setSearchResults([]);
      setIsOpen(false);
      return;
    }

    const filtered = clients.filter(client =>
      client.nome?.toLowerCase().includes(value.toLowerCase()) ||
      client.email?.toLowerCase().includes(value.toLowerCase()) ||
      client.telefone?.includes(value)
    ).slice(0, 8); // Limitar a 8 resultados

    setSearchResults(filtered);
    setIsOpen(filtered.length > 0);
    setSelectedIndex(-1);
  }, [value, clients]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navegação com teclado
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          handleClientSelect(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Selecionar cliente
  const handleClientSelect = (client: Client) => {
    onChange(client.nome || '');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  // Formatar data do último agendamento
  const formatLastAppointment = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;
    return `${Math.floor(diffDays / 365)} anos atrás`;
  };

  return (
    <Box position="relative" minW="300px">
      {/* Input de busca */}
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => value.trim() && searchResults.length > 0 && setIsOpen(true)}
        placeholder={placeholder}
        size="sm"
        pr="40px"
        bg="white"
        border="1px solid"
        borderColor="gray.300"
        _focus={{
          borderColor: "blue.500",
          boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)",
        }}
        _hover={{
          borderColor: "gray.400",
        }}
      />
      
      {/* Ícone de busca */}
      <Box
        position="absolute"
        right="12px"
        top="50%"
        transform="translateY(-50%)"
        color="gray.400"
        pointerEvents="none"
      >
        <Search size={16} />
      </Box>

      {/* Dropdown de resultados */}
      {isOpen && (
        <ChakraBox
          ref={dropdownRef}
          position="absolute"
          top="100%"
          left="0"
          right="0"
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          boxShadow="lg"
          zIndex={1000}
          maxH="300px"
          overflowY="auto"
          mt={1}
        >
          {isLoading ? (
            <Box p={4} textAlign="center">
              <Text color="gray.500">Buscando...</Text>
            </Box>
          ) : searchResults.length === 0 ? (
            <Box p={4} textAlign="center">
              <Text color="gray.500">Nenhum cliente encontrado</Text>
            </Box>
          ) : (
            <VStack spacing={0} align="stretch">
              {searchResults.map((client, index) => (
                <Box
                  key={client.id}
                  p={3}
                  cursor="pointer"
                  bg={selectedIndex === index ? "blue.50" : "transparent"}
                  _hover={{
                    bg: selectedIndex === index ? "blue.50" : "gray.50",
                  }}
                  onClick={() => handleClientSelect(client)}
                  borderBottom="1px solid"
                  borderColor="gray.100"
                  _last={{ borderBottom: "none" }}
                >
                  <HStack spacing={3} align="flex-start">
                    {/* Avatar do cliente */}
                    <Avatar
                      size="sm"
                      name={client.nome}
                      bg="blue.500"
                      color="white"
                    />
                    
                    {/* Informações do cliente */}
                    <Box flex={1}>
                      <Text fontWeight="medium" fontSize="sm">
                        {client.nome}
                      </Text>
                      
                      {client.email && (
                        <Text fontSize="xs" color="gray.600" mt={1}>
                          {client.email}
                        </Text>
                      )}
                      
                      {client.telefone && (
                        <Text fontSize="xs" color="gray.600">
                          {client.telefone}
                        </Text>
                      )}
                      
                      {/* Último agendamento */}
                      <HStack spacing={2} mt={2}>
                        <Clock size={12} color="gray.400" />
                        <Text fontSize="xs" color="gray.500">
                          Último: {formatLastAppointment(client.ultimo_agendamento)}
                        </Text>
                      </HStack>
                    </Box>
                    
                    {/* Badge de status */}
                    <Badge
                      colorScheme={client.ultimo_agendamento ? "green" : "gray"}
                      size="sm"
                      variant="subtle"
                    >
                      {client.ultimo_agendamento ? "Ativo" : "Novo"}
                    </Badge>
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </ChakraBox>
      )}
    </Box>
  );
}
