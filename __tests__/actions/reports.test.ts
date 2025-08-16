/**
 * @jest-environment jsdom
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock das dependências
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/audit');
jest.mock('next/cache');

import { 
  getDREData, 
  getDREComparison, 
  exportDREReport,
  getFinancialSummary,
  getCashFlow,
  getProfitabilityAnalysis,
  validateFinancialData,
  generateAuditReport
} from '@/app/actions/reports';
import type { Period } from '@/app/actions/reports';

// Mocks dos módulos
const mockSupabaseClient = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
  rpc: jest.fn(),
};

const mockCreateClient = jest.fn(() => mockSupabaseClient);
const mockLogAuditEvent = jest.fn();
const mockRevalidatePath = jest.fn();

// Setup dos mocks
jest.mocked(require('@/lib/supabase/server')).createClient = mockCreateClient;
jest.mocked(require('@/lib/audit')).logAuditEvent = mockLogAuditEvent;
jest.mocked(require('next/cache')).revalidatePath = mockRevalidatePath;

describe('Server Actions de Relatórios - Testes Unitários', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock padrão para usuário autenticado
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@test.com' } },
      error: null
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getDREData', () => {
    const mockPeriod: Period = {
      from: '2024-01-01',
      to: '2024-12-31'
    };

    it('deve validar entrada e gerar DRE com sucesso', async () => {
      // Arrange: Mock da função calculate_dre
      const mockDREResult = [
        {
          conta_id: 'conta-1',
          conta_codigo: '4.1.1.1',
          conta_nome: 'RECEITA DE SERVIÇOS',
          conta_tipo: 'receita',
          saldo_debito: '0.00',
          saldo_credito: '50000.00',
          saldo_final: '50000.00'
        },
        {
          conta_id: 'conta-2',
          conta_codigo: '3.1.1.1',
          conta_nome: 'CUSTOS DE SERVIÇOS',
          conta_tipo: 'custo',
          saldo_debito: '15000.00',
          saldo_credito: '0.00',
          saldo_final: '15000.00'
        },
        {
          conta_id: 'conta-3',
          conta_codigo: '5.1.1.1',
          conta_nome: 'DESPESAS OPERACIONAIS',
          conta_tipo: 'despesa',
          saldo_debito: '10000.00',
          saldo_credito: '0.00',
          saldo_final: '10000.00'
        }
      ];

      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockDREResult,
        error: null
      });

      // Act: Executar a função
      const result = await getDREData({
        period: mockPeriod,
        unidade_id: 'trato',
        include_audit_trail: false
      });

      // Assert: Verificar o resultado
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.periodo.data_inicio).toBe('2024-01-01');
        expect(result.data.periodo.data_fim).toBe('2024-12-31');
        expect(result.data.receitas.receita_bruta).toBe(50000);
        expect(result.data.custos.custos_servicos).toBe(15000);
        expect(result.data.resultado.lucro_bruto).toBe(35000); // 50000 - 15000
        expect(result.data.resultado.lucro_operacional).toBe(25000); // 35000 - 10000
        expect(result.data.margem.margem_bruta).toBe(70); // (35000 / 50000) * 100
      }

      // Verificar se a função RPC foi chamada corretamente
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('calculate_dre', {
        p_data_inicio: '2024-01-01',
        p_data_fim: '2024-12-31',
        p_unidade_id: 'trato'
      });
    });

    it('deve retornar DRE vazio quando não há dados', async () => {
      // Arrange: Mock sem dados
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [],
        error: null
      });

      // Act: Executar a função
      const result = await getDREData({
        period: mockPeriod,
        unidade_id: 'trato'
      });

      // Assert: Verificar DRE vazio
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.receitas.receita_bruta).toBe(0);
        expect(result.data.custos.custos_servicos).toBe(0);
        expect(result.data.resultado.lucro_liquido).toBe(0);
        expect(result.data.margem.margem_liquida).toBe(0);
      }
    });

    it('deve retornar erro quando função SQL falha', async () => {
      // Arrange: Mock com erro na função SQL
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Erro na função calculate_dre' }
      });

      // Act: Executar a função
      const result = await getDREData({
        period: mockPeriod,
        unidade_id: 'trato'
      });

      // Assert: Verificar o erro
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Erro ao calcular DRE');
      }
    });

    it('deve validar dados de entrada incorretos', async () => {
      // Act: Testar com datas inválidas
      const result = await getDREData({
        period: { from: 'invalid-date', to: '2024-12-31' },
        unidade_id: 'trato'
      });

      // Assert: Verificar erro de validação
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Dados inválidos');
      }
    });

    it('deve retornar erro para usuário não autenticado', async () => {
      // Arrange: Mock usuário não autenticado
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      });

      // Act: Executar a função
      const result = await getDREData({
        period: mockPeriod,
        unidade_id: 'trato'
      });

      // Assert: Verificar erro de autenticação
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Usuário não autenticado');
      }
    });

    it('deve calcular margens corretamente com diferentes cenários', async () => {
      // Arrange: Cenário com prejuízo
      const mockDREResultLoss = [
        {
          conta_id: 'conta-1',
          conta_codigo: '4.1.1.1',
          conta_nome: 'RECEITA DE SERVIÇOS',
          conta_tipo: 'receita',
          saldo_debito: '0.00',
          saldo_credito: '10000.00',
          saldo_final: '10000.00'
        },
        {
          conta_id: 'conta-2',
          conta_codigo: '5.1.1.1',
          conta_nome: 'DESPESAS OPERACIONAIS',
          conta_tipo: 'despesa',
          saldo_debito: '15000.00',
          saldo_credito: '0.00',
          saldo_final: '15000.00'
        }
      ];

      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockDREResultLoss,
        error: null
      });

      // Act: Executar a função
      const result = await getDREData({
        period: mockPeriod,
        unidade_id: 'trato'
      });

      // Assert: Verificar cálculos com prejuízo
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.receitas.receita_liquida).toBe(10000);
        expect(result.data.despesas.despesas_operacionais).toBe(15000);
        expect(result.data.resultado.lucro_operacional).toBe(-5000); // Prejuízo
        expect(result.data.resultado.provisao_ir).toBe(0); // Não há IR sobre prejuízo
        expect(result.data.margem.margem_operacional).toBe(-50); // Margem negativa
      }
    });
  });

  describe('getDREComparison', () => {
    it('deve comparar DREs de dois períodos corretamente', async () => {
      // Arrange: Mock para dois períodos diferentes
      const currentPeriod: Period = { from: '2024-01-01', to: '2024-12-31' };
      const previousPeriod: Period = { from: '2023-01-01', to: '2023-12-31' };

      // Mock primeira chamada (período atual)
      mockSupabaseClient.rpc
        .mockResolvedValueOnce({
          data: [
            {
              conta_id: 'conta-1',
              conta_codigo: '4.1.1.1',
              conta_nome: 'RECEITA DE SERVIÇOS',
              conta_tipo: 'receita',
              saldo_debito: '0.00',
              saldo_credito: '60000.00',
              saldo_final: '60000.00'
            }
          ],
          error: null
        })
        // Mock segunda chamada (período anterior)
        .mockResolvedValueOnce({
          data: [
            {
              conta_id: 'conta-1',
              conta_codigo: '4.1.1.1',
              conta_nome: 'RECEITA DE SERVIÇOS',
              conta_tipo: 'receita',
              saldo_debito: '0.00',
              saldo_credito: '50000.00',
              saldo_final: '50000.00'
            }
          ],
          error: null
        });

      // Act: Executar comparação
      const result = await getDREComparison({
        current: currentPeriod,
        previous: previousPeriod,
        unidade_id: 'trato'
      });

      // Assert: Verificar comparação
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.current.receitas.receita_liquida).toBe(60000);
        expect(result.data.previous.receitas.receita_liquida).toBe(50000);
        expect(result.data.variations.receita_liquida.absolute).toBe(10000);
        expect(result.data.variations.receita_liquida.percentage).toBe(20); // 20% de crescimento
      }
    });
  });

  describe('exportDREReport', () => {
    it('deve exportar DRE em formato JSON', async () => {
      // Arrange: Mock DRE simples
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [
          {
            conta_id: 'conta-1',
            conta_codigo: '4.1.1.1',
            conta_nome: 'RECEITA DE SERVIÇOS',
            conta_tipo: 'receita',
            saldo_debito: '0.00',
            saldo_credito: '50000.00',
            saldo_final: '50000.00'
          }
        ],
        error: null
      });

      // Act: Exportar em JSON
      const result = await exportDREReport({
        period: { from: '2024-01-01', to: '2024-12-31' },
        unidade_id: 'trato',
        format: 'json'
      });

      // Assert: Verificar exportação
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mimeType).toBe('application/json');
        expect(result.data.filename).toContain('DRE_2024-01-01_2024-12-31');
        expect(result.data.filename).toEndWith('.json');
        
        // Verificar se o conteúdo é JSON válido
        expect(() => JSON.parse(result.data.content)).not.toThrow();
      }
    });

    it('deve exportar DRE em formato CSV', async () => {
      // Arrange: Mock DRE simples
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [
          {
            conta_id: 'conta-1',
            conta_codigo: '4.1.1.1',
            conta_nome: 'RECEITA DE SERVIÇOS',
            conta_tipo: 'receita',
            saldo_debito: '0.00',
            saldo_credito: '50000.00',
            saldo_final: '50000.00'
          }
        ],
        error: null
      });

      // Act: Exportar em CSV
      const result = await exportDREReport({
        period: { from: '2024-01-01', to: '2024-12-31' },
        unidade_id: 'trato',
        format: 'csv'
      });

      // Assert: Verificar exportação
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mimeType).toBe('text/csv');
        expect(result.data.filename).toEndWith('.csv');
        expect(result.data.content).toContain('Seção,Item,Valor');
        expect(result.data.content).toContain('Receitas,Receita Bruta,50000');
      }
    });
  });

  describe('validateFinancialData', () => {
    it('deve executar todas as validações com sucesso', async () => {
      // Arrange: Mock de todas as consultas de validação
      const mockFrom = jest.fn();
      
      // Mock para integridade referencial (sem erros)
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({
                data: [], // Sem lançamentos com contas inexistentes
                error: null
              }))
            }))
          }))
        }))
      });

      // Mock para balanceamento contábil (balanceado)
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({
                  data: [
                    { valor: '1000.00', tipo_lancamento: 'debito' },
                    { valor: '1000.00', tipo_lancamento: 'credito' }
                  ],
                  error: null
                }))
              }))
            }))
          }))
        }))
      });

      // Mock para valores inválidos (nenhum)
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              eq: jest.fn(() => ({
                lte: jest.fn(() => Promise.resolve({
                  data: [], // Sem valores inválidos
                  error: null
                }))
              }))
            }))
          }))
        }))
      });

      // Mock para valores altos (nenhum)
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              eq: jest.fn(() => ({
                gt: jest.fn(() => Promise.resolve({
                  data: [], // Sem valores excepcionalmente altos
                  error: null
                }))
              }))
            }))
          }))
        }))
      });

      // Mock para lançamentos (para detectar anomalias)
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({
                  data: [
                    { id: '1', valor: '1000.00', data_competencia: '2024-01-15', historico: 'Test 1' },
                    { id: '2', valor: '1100.00', data_competencia: '2024-01-16', historico: 'Test 2' },
                    { id: '3', valor: '900.00', data_competencia: '2024-01-17', historico: 'Test 3' }
                  ],
                  error: null
                }))
              }))
            }))
          }))
        }))
      });

      // Mock para lançamentos sem histórico
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              eq: jest.fn(() => ({
                or: jest.fn(() => Promise.resolve({
                  data: [], // Todos têm histórico
                  error: null
                }))
              }))
            }))
          }))
        }))
      });

      mockSupabaseClient.from.mockImplementation(() => mockFrom());

      // Mock das funções RPC (se existirem)
      mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: null });

      // Act: Executar validação
      const result = await validateFinancialData({
        period: { from: '2024-01-01', to: '2024-12-31' },
        unidade_id: 'trato',
        include_detailed_audit: true
      });

      // Assert: Verificar resultado
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isValid).toBe(true);
        expect(result.data.summary.total_checks).toBe(6);
        expect(result.data.summary.passed_checks).toBeGreaterThan(0);
        expect(result.data.errors.length).toBe(0);
      }
    });

    it('deve detectar desbalanceamento contábil', async () => {
      // Arrange: Mock com desbalanceamento
      const mockFrom = jest.fn();
      
      // Mock para integridade referencial (sem erros)
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({
                data: [],
                error: null
              }))
            }))
          }))
        }))
      });

      // Mock para balanceamento contábil (desbalanceado)
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({
                  data: [
                    { valor: '1000.00', tipo_lancamento: 'debito' },
                    { valor: '900.00', tipo_lancamento: 'credito' } // Diferença de R$ 100
                  ],
                  error: null
                }))
              }))
            }))
          }))
        }))
      });

      // Mocks para outras validações
      for (let i = 0; i < 4; i++) {
        mockFrom.mockReturnValueOnce({
          select: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => ({
                eq: jest.fn(() => ({
                  lte: jest.fn(() => Promise.resolve({ data: [], error: null })),
                  gt: jest.fn(() => Promise.resolve({ data: [], error: null })),
                  or: jest.fn(() => Promise.resolve({ data: [], error: null }))
                }))
              }))
            }))
          }))
        }));
      }

      mockSupabaseClient.from.mockImplementation(() => mockFrom());
      mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: null });

      // Act: Executar validação
      const result = await validateFinancialData({
        period: { from: '2024-01-01', to: '2024-12-31' },
        unidade_id: 'trato'
      });

      // Assert: Verificar detecção de erro
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isValid).toBe(false); // Deve ser inválido devido ao desbalanceamento
        expect(result.data.errors.length).toBeGreaterThan(0);
        
        const balanceError = result.data.errors.find(e => e.code === 'ACCOUNTING_IMBALANCE');
        expect(balanceError).toBeDefined();
        expect(balanceError?.severity).toBe('critical');
      }
    });
  });

  describe('getFinancialSummary', () => {
    it('deve gerar resumo financeiro corretamente', async () => {
      // Arrange: Mock DRE para o resumo
      mockSupabaseClient.rpc
        .mockResolvedValueOnce({
          data: [
            {
              conta_id: 'conta-1',
              conta_codigo: '4.1.1.1',
              conta_nome: 'RECEITA DE SERVIÇOS',
              conta_tipo: 'receita',
              saldo_debito: '0.00',
              saldo_credito: '100000.00',
              saldo_final: '100000.00'
            },
            {
              conta_id: 'conta-2',
              conta_codigo: '5.1.1.1',
              conta_nome: 'DESPESAS OPERACIONAIS',
              conta_tipo: 'despesa',
              saldo_debito: '30000.00',
              saldo_credito: '0.00',
              saldo_final: '30000.00'
            }
          ],
          error: null
        })
        // Mock para período anterior (para calcular crescimento)
        .mockResolvedValueOnce({
          data: [
            {
              conta_id: 'conta-1',
              conta_codigo: '4.1.1.1',
              conta_nome: 'RECEITA DE SERVIÇOS',
              conta_tipo: 'receita',
              saldo_debito: '0.00',
              saldo_credito: '80000.00',
              saldo_final: '80000.00'
            }
          ],
          error: null
        })
        // Mock para cálculo de liquidez
        .mockResolvedValueOnce({
          data: [
            {
              conta_id: 'conta-3',
              conta_codigo: '1.1.1.1',
              conta_nome: 'CAIXA',
              conta_tipo: 'ativo',
              saldo_debito: '50000.00',
              saldo_credito: '0.00',
              saldo_final: '50000.00'
            }
          ],
          error: null
        });

      // Act: Gerar resumo
      const result = await getFinancialSummary({
        period: { from: '2024-01-01', to: '2024-12-31' },
        unidade_id: 'trato'
      });

      // Assert: Verificar resumo
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.resumo.total_receitas).toBe(100000);
        expect(result.data.resumo.total_despesas).toBe(30000);
        expect(result.data.resumo.lucro_prejuizo).toBe(70000);
        expect(result.data.indicadores.crescimento_periodo).toBe(25); // (100000 - 80000) / 80000 * 100
        expect(result.data.indicadores.rentabilidade).toBe(70); // 70000 / 100000 * 100
      }
    });
  });

  describe('Funções auxiliares e utilitários', () => {
    it('deve calcular variações corretamente', () => {
      // Função auxiliar para calcular variações
      const calculateVariation = (current: number, previous: number): { absolute: number; percentage: number } => {
        const absolute = current - previous;
        const percentage = previous !== 0 ? (absolute / Math.abs(previous)) * 100 : 0;
        
        return { absolute, percentage };
      };

      // Test cases
      const variation1 = calculateVariation(150, 100);
      expect(variation1.absolute).toBe(50);
      expect(variation1.percentage).toBe(50);

      const variation2 = calculateVariation(80, 100);
      expect(variation2.absolute).toBe(-20);
      expect(variation2.percentage).toBe(-20);

      const variation3 = calculateVariation(100, 0);
      expect(variation3.absolute).toBe(100);
      expect(variation3.percentage).toBe(0);
    });

    it('deve validar consistência de DRE', () => {
      // Função de validação de consistência
      const validateDREConsistency = (dreData: any): { isValid: boolean; errors: string[] } => {
        const errors: string[] = [];

        // Verificar se receita líquida = receita bruta - deduções
        const expectedReceitaLiquida = dreData.receitas.receita_bruta - dreData.receitas.deducoes;
        if (Math.abs(dreData.receitas.receita_liquida - expectedReceitaLiquida) > 0.01) {
          errors.push(`Receita líquida inconsistente`);
        }

        // Verificar se lucro bruto = receita líquida - custos
        const expectedLucroBruto = dreData.receitas.receita_liquida - dreData.custos.custos_servicos;
        if (Math.abs(dreData.resultado.lucro_bruto - expectedLucroBruto) > 0.01) {
          errors.push(`Lucro bruto inconsistente`);
        }

        return { isValid: errors.length === 0, errors };
      };

      // Test case: DRE consistente
      const dreConsistente = {
        receitas: { receita_bruta: 100000, deducoes: 5000, receita_liquida: 95000 },
        custos: { custos_servicos: 30000 },
        resultado: { lucro_bruto: 65000 }
      };

      const validation1 = validateDREConsistency(dreConsistente);
      expect(validation1.isValid).toBe(true);
      expect(validation1.errors.length).toBe(0);

      // Test case: DRE inconsistente
      const dreInconsistente = {
        receitas: { receita_bruta: 100000, deducoes: 5000, receita_liquida: 90000 }, // Inconsistente
        custos: { custos_servicos: 30000 },
        resultado: { lucro_bruto: 70000 } // Inconsistente
      };

      const validation2 = validateDREConsistency(dreInconsistente);
      expect(validation2.isValid).toBe(false);
      expect(validation2.errors.length).toBe(2);
    });
  });
});
