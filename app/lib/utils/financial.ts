/**
 * Utilitários para operações financeiras
 * Funções puras e bem documentadas para formatação e cálculos
 */

/**
 * Formata um valor numérico para o padrão monetário brasileiro (BRL)
 * @param amount - Valor numérico a ser formatado
 * @returns String formatada no padrão brasileiro (ex: "R$ 1.234,56")
 * 
 * @example
 * formatCurrency(1234.56) // "R$ 1.234,56"
 * formatCurrency(0) // "R$ 0,00"
 * formatCurrency(-100) // "-R$ 100,00"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Formata um valor numérico para o padrão monetário brasileiro sem símbolo da moeda
 * @param amount - Valor numérico a ser formatado
 * @returns String formatada no padrão brasileiro sem símbolo (ex: "1.234,56")
 * 
 * @example
 * formatCurrencyValue(1234.56) // "1.234,56"
 * formatCurrencyValue(0) // "0,00"
 */
export function formatCurrencyValue(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Calcula a porcentagem de uma parte em relação ao todo
 * @param part - Valor da parte
 * @param whole - Valor total
 * @param decimals - Número de casas decimais (padrão: 2)
 * @returns String formatada com o símbolo de porcentagem (ex: "15.00%")
 * 
 * @example
 * calculatePercentage(15, 100) // "15.00%"
 * calculatePercentage(3, 10) // "30.00%"
 * calculatePercentage(0, 100) // "0.00%"
 */
export function calculatePercentage(part: number, whole: number, decimals: number = 2): string {
  if (whole === 0) return '0.00%';
  
  const percentage = (part / whole) * 100;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Calcula a porcentagem de uma parte em relação ao todo e retorna o valor numérico
 * @param part - Valor da parte
 * @param whole - Valor total
 * @returns Número representando a porcentagem
 * 
 * @example
 * calculatePercentageValue(15, 100) // 15
 * calculatePercentageValue(3, 10) // 30
 */
export function calculatePercentageValue(part: number, whole: number): number {
  if (whole === 0) return 0;
  return (part / whole) * 100;
}

/**
 * Formata uma data do formato ISO para o formato brasileiro
 * @param dateString - Data em formato ISO string
 * @returns String formatada no padrão brasileiro (ex: "15/08/2024")
 * 
 * @example
 * formatDate("2024-08-15") // "15/08/2024"
 * formatDate("2024-08-15T10:30:00Z") // "15/08/2024"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    throw new Error('Data inválida fornecida');
  }
  
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formata uma data e hora do formato ISO para o formato brasileiro
 * @param dateString - Data e hora em formato ISO string
 * @returns String formatada no padrão brasileiro (ex: "15/08/2024 às 14:30")
 * 
 * @example
 * formatDateTime("2024-08-15T14:30:00Z") // "15/08/2024 às 14:30"
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    throw new Error('Data inválida fornecida');
  }
  
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(',', ' às');
}

/**
 * Formata um valor para exibição com separadores de milhares
 * @param value - Valor numérico
 * @param decimals - Número de casas decimais (padrão: 2)
 * @returns String formatada com separadores (ex: "1.234,56")
 * 
 * @example
 * formatNumber(1234.56) // "1.234,56"
 * formatNumber(1000000) // "1.000.000,00"
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Formata um valor inteiro para exibição com separadores de milhares
 * @param value - Valor inteiro
 * @returns String formatada com separadores (ex: "1.234")
 * 
 * @example
 * formatInteger(1234) // "1.234"
 * formatInteger(1000000) // "1.000.000"
 */
export function formatInteger(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

/**
 * Converte uma string de data brasileira para formato ISO
 * @param dateString - Data no formato brasileiro (ex: "15/08/2024")
 * @returns String no formato ISO (ex: "2024-08-15")
 * 
 * @example
 * parseBrazilianDate("15/08/2024") // "2024-08-15"
 */
export function parseBrazilianDate(dateString: string): string {
  const [day, month, year] = dateString.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * Valida se uma string representa uma data válida
 * @param dateString - String a ser validada
 * @returns true se for uma data válida, false caso contrário
 * 
 * @example
 * isValidDate("2024-08-15") // true
 * isValidDate("data-invalida") // false
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Calcula a diferença em dias entre duas datas
 * @param startDate - Data de início
 * @param endDate - Data de fim
 * @returns Número de dias entre as datas
 * 
 * @example
 * calculateDaysDifference("2024-08-01", "2024-08-15") // 14
 */
export function calculateDaysDifference(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Uma ou ambas as datas são inválidas');
  }
  
  const timeDiff = end.getTime() - start.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

/**
 * Obtém o primeiro dia do mês de uma data
 * @param dateString - Data de referência
 * @returns String no formato ISO do primeiro dia do mês
 * 
 * @example
 * getFirstDayOfMonth("2024-08-15") // "2024-08-01"
 */
export function getFirstDayOfMonth(dateString: string): string {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    throw new Error('Data inválida fornecida');
  }
  
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
}

/**
 * Obtém o último dia do mês de uma data
 * @param dateString - Data de referência
 * @returns String no formato ISO do último dia do mês
 * 
 * @example
 * getLastDayOfMonth("2024-08-15") // "2024-08-31"
 */
export function getLastDayOfMonth(dateString: string): string {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    throw new Error('Data inválida fornecida');
  }
  
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
}

/**
 * Formata um valor para exibição compacta (K, M, B)
 * @param value - Valor numérico
 * @returns String formatada de forma compacta
 * 
 * @example
 * formatCompactNumber(1234) // "1,2K"
 * formatCompactNumber(1234567) // "1,2M"
 * formatCompactNumber(1234567890) // "1,2B"
 */
export function formatCompactNumber(value: number): string {
  if (value < 1000) return value.toString();
  
  const formatter = new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    maximumFractionDigits: 1
  });
  
  return formatter.format(value);
}

/**
 * Formata um valor monetário para exibição compacta
 * @param value - Valor monetário
 * @returns String formatada de forma compacta com símbolo da moeda
 * 
 * @example
 * formatCompactCurrency(1234) // "R$ 1,2K"
 * formatCompactCurrency(1234567) // "R$ 1,2M"
 */
export function formatCompactCurrency(value: number): string {
  if (value < 1000) return formatCurrency(value);
  
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1
  });
  
  return formatter.format(value);
}
