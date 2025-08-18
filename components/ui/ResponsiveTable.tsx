'use client';

import React, { useState } from 'react';
import { Box, VStack, HStack, Text, IconButton, Button, useColorModeValue, Badge, Avatar, Tooltip, Menu, MenuButton, MenuList, MenuItem, Icon } from '@chakra-ui/react';
import { ChevronLeft, ChevronRight, MoreVertical, Filter, Search, Download, Eye, Edit, Trash2 } from 'lucide-react';

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: any, item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  mobilePriority?: 'high' | 'medium' | 'low';
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  searchable?: boolean;
  filterable?: boolean;
  downloadable?: boolean;
  itemsPerPage?: number;
  className?: string;
}

export function ResponsiveTable<T extends { id: string | number }>({
  data,
  columns,
  onRowClick,
  onEdit,
  onDelete,
  onView,
  searchable = true,
  filterable = true,
  downloadable = true,
  itemsPerPage = 10,
  className = '',
}: ResponsiveTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');

  // Filtrar e ordenar dados
  const filteredData = React.useMemo(() => {
    let filtered = data;

    // Aplicar busca
    if (searchTerm) {
      filtered = filtered.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Aplicar ordenação
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, sortColumn, sortDirection]);

  // Paginação
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Função para ordenar
  const handleSort = (column: keyof T) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Função para renderizar valor da célula
  const renderCellValue = (column: Column<T>, item: T) => {
    const value = item[column.key];
    
    if (column.render) {
      return column.render(value, item);
    }

    // Renderizações padrão baseadas no tipo de dado
    if (typeof value === 'boolean') {
      return (
        <Badge colorScheme={value ? 'green' : 'red'} size="sm">
          {value ? 'Sim' : 'Não'}
        </Badge>
      );
    }

    if (typeof value === 'string' && value.includes('@')) {
      return (
        <Text fontSize="sm" color={mutedTextColor}>
          {value}
        </Text>
      );
    }

    if (typeof value === 'string' && value.length > 30) {
      return (
        <Tooltip label={value}>
          <Text fontSize="sm" noOfLines={1}>
            {value.substring(0, 30)}...
          </Text>
        </Tooltip>
      );
    }

    return (
      <Text fontSize="sm">
        {String(value)}
      </Text>
    );
  };

  // Determinar colunas visíveis em mobile
  const getMobileColumns = () => {
    return columns.filter(col => col.mobilePriority !== 'low');
  };

  const mobileColumns = getMobileColumns();

  return (
    <Box className={`responsive-table ${className}`}>
      {/* Barra de ferramentas */}
      <Box
        bg={bgColor}
        borderWidth="1px"
        borderColor={borderColor}
        borderBottomWidth="0"
        borderTopRadius="md"
        p={4}
      >
        <HStack justify="space-between" align="center" wrap="wrap" gap={4}>
          <HStack spacing={4} flex={1} minW="300px">
            {searchable && (
              <Box position="relative" flex={1} maxW="400px">
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 40px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </Box>
            )}
            
            {filterable && (
              <Button
                leftIcon={<Filter size={16} />}
                variant="outline"
                size="sm"
              >
                Filtros
              </Button>
            )}
          </HStack>

          <HStack spacing={2}>
            {downloadable && (
              <Button
                leftIcon={<Download size={16} />}
                variant="outline"
                size="sm"
              >
                Exportar
              </Button>
            )}
          </HStack>
        </HStack>
      </Box>

      {/* Tabela responsiva */}
      <Box
        bg={bgColor}
        borderWidth="1px"
        borderColor={borderColor}
        borderBottomRadius="md"
        overflow="hidden"
      >
        {/* Desktop view */}
        <Box className="mobile-hidden">
          <Box as="table" w="full">
            <Box as="thead" bg={useColorModeValue('gray.50', 'gray.700')}>
              <Box as="tr">
                {columns.map((column) => (
                  <Box
                    key={String(column.key)}
                    as="th"
                    px={4}
                    py={3}
                    textAlign="left"
                    fontSize="sm"
                    fontWeight="medium"
                    color={textColor}
                    borderBottomWidth="1px"
                    borderColor={borderColor}
                    cursor={column.sortable ? 'pointer' : 'default'}
                    _hover={column.sortable ? { bg: hoverBgColor } : {}}
                    onClick={() => column.sortable && handleSort(column.key)}
                    userSelect="none"
                  >
                    <HStack spacing={2}>
                      <Text>{column.label}</Text>
                      {column.sortable && sortColumn === column.key && (
                        <Text fontSize="xs" color="blue.500">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </Text>
                      )}
                    </HStack>
                  </Box>
                ))}
                {(onEdit || onDelete || onView) && (
                  <Box as="th" px={4} py={3} w="80px">
                    <Text fontSize="sm" fontWeight="medium" color={textColor}>
                      Ações
                    </Text>
                  </Box>
                )}
              </Box>
            </Box>
            <Box as="tbody">
              {currentData.map((item, index) => (
                <Box
                  key={item.id}
                  as="tr"
                  bg={index % 2 === 0 ? bgColor : useColorModeValue('gray.50', 'gray.700')}
                  _hover={{ bg: hoverBgColor }}
                  cursor={onRowClick ? 'pointer' : 'default'}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <Box
                      key={String(column.key)}
                      as="td"
                      px={4}
                      py={3}
                      borderBottomWidth="1px"
                      borderColor={borderColor}
                    >
                      {renderCellValue(column, item)}
                    </Box>
                  ))}
                  {(onEdit || onDelete || onView) && (
                    <Box as="td" px={4} py={3}>
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={<MoreVertical size={16} />}
                          variant="ghost"
                          size="sm"
                          aria-label="Ações"
                        />
                        <MenuList>
                          {onView && (
                            <MenuItem icon={<Eye size={16} />} onClick={() => onView(item)}>
                              Visualizar
                            </MenuItem>
                          )}
                          {onEdit && (
                            <MenuItem icon={<Edit size={16} />} onClick={() => onEdit(item)}>
                              Editar
                            </MenuItem>
                          )}
                          {onDelete && (
                            <MenuItem icon={<Trash2 size={16} />} onClick={() => onDelete(item)}>
                              Excluir
                            </MenuItem>
                          )}
                        </MenuList>
                      </Menu>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Mobile view - Cards */}
        <Box className="desktop-hidden">
          <VStack spacing={3} p={4}>
            {currentData.map((item) => (
              <Box
                key={item.id}
                w="full"
                bg={bgColor}
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="md"
                p={4}
                cursor={onRowClick ? 'pointer' : 'default'}
                onClick={() => onRowClick?.(item)}
                _hover={{ bg: hoverBgColor }}
                transition="all 0.2s"
              >
                <VStack spacing={3} align="stretch">
                  {mobileColumns.map((column) => (
                    <Box key={String(column.key)}>
                      <Text fontSize="xs" fontWeight="medium" color={mutedTextColor} mb={1}>
                        {column.label}
                      </Text>
                      <Box>
                        {renderCellValue(column, item)}
                      </Box>
                    </Box>
                  ))}
                  
                  {(onEdit || onDelete || onView) && (
                    <HStack spacing={2} pt={2} borderTopWidth="1px" borderColor={borderColor}>
                      {onView && (
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<Eye size={16} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            onView(item);
                          }}
                        >
                          Ver
                        </Button>
                      )}
                      {onEdit && (
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<Edit size={16} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(item);
                          }}
                        >
                          Editar
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          leftIcon={<Trash2 size={16} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item);
                          }}
                        >
                          Excluir
                        </Button>
                      )}
                    </HStack>
                  )}
                </VStack>
              </Box>
            ))}
          </VStack>
        </Box>
      </Box>

      {/* Paginação */}
      {totalPages > 1 && (
        <Box
          bg={bgColor}
          borderWidth="1px"
          borderColor={borderColor}
          borderTopWidth="0"}
          borderBottomRadius="md"
          p={4}
        >
          <HStack justify="space-between" align="center">
            <Text fontSize="sm" color={mutedTextColor}>
              Mostrando {startIndex + 1}-{Math.min(endIndex, filteredData.length)} de {filteredData.length} resultados
            </Text>
            
            <HStack spacing={2}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                leftIcon={<ChevronLeft size={16} />}
              >
                Anterior
              </Button>
              
              <Text fontSize="sm" color={textColor}>
                Página {currentPage} de {totalPages}
              </Text>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                rightIcon={<ChevronRight size={16} />}
              >
                Próxima
              </Button>
            </HStack>
          </HStack>
        </Box>
      )}
    </Box>
  );
}
