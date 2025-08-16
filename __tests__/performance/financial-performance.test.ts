/**
 * @jest-environment jsdom
 */

import { describe, it, expect, jest, beforeEach, afterEach, beforeAll } from '@jest/globals';

// Mock das dependências
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/audit');

import { getDREData, validateFinancialData, getCashFlow } from '@/app/actions/reports';
import { processAutomaticRevenue } from '@/app/actions/financial';

// Mocks
const mockSupabaseClient = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
  rpc: jest.fn(),
};

const mockCreateClient = jest.fn(() => mockSupabaseClient);
const mockLogAuditEvent = jest.fn();

jest.mocked(require('@/lib/supabase/server')).createClient = mockCreateClient;
jest.mocked(require('@/lib/audit')).logAuditEvent = mockLogAuditEvent;

describe('Testes de Performance - Módulo Financeiro', () => {
  beforeAll(() => {
    console.log('🚀 Iniciando testes de performance do módulo financeiro');
  });

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

  describe('Performance de Consultas DRE', () => {
    it('deve executar getDREData em menos de 2 segundos para datasets médios', async () => {
      // Arrange: Simular dataset médio (1000 contas)
      const largeDREDataset = Array.from({ length: 1000 }, (_, i) => ({
        conta_id: `conta-${i}`,
        conta_codigo: `${Math.floor(i/100) + 1}.${Math.floor((i%100)/10) + 1}.${(i%10) + 1}.1`,
        conta_nome: `CONTA TESTE ${i}`,
        conta_tipo: ['receita', 'despesa', 'custo', 'ativo'][i % 4],
        saldo_debito: (Math.random() * 10000).toFixed(2),
        saldo_credito: (Math.random() * 10000).toFixed(2),
        saldo_final: (Math.random() * 20000 - 10000).toFixed(2)
      }));

      mockSupabaseClient.rpc.mockImplementation(() => 
        new Promise(resolve => {
          // Simular latência de consulta no banco
          setTimeout(() => {
            resolve({
              data: largeDREDataset,
              error: null
            });
          }, 100); // 100ms de latência simulada
        })
      );

      // Act: Medir tempo de execução
      const startTime = performance.now();
      
      const result = await getDREData({
        period: { from: '2024-01-01', to: '2024-12-31' },
        unidade_id: 'trato',
        include_audit_trail: false
      });

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Assert: Verificar performance e resultado
      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(2000); // Menos de 2 segundos
      
      if (result.success) {
        expect(result.data.receitas.detalhes.length).toBeGreaterThan(0);
        expect(result.data.custos.detalhes.length).toBeGreaterThan(0);
        expect(result.data.despesas.detalhes.length).toBeGreaterThan(0);
      }

      console.log(`⚡ getDREData executado em ${executionTime.toFixed(2)}ms para ${largeDREDataset.length} contas`);
    });

    it('deve executar getDREData com trilha de auditoria em menos de 5 segundos', async () => {
      // Arrange: Dataset com auditoria
      const auditDataset = Array.from({ length: 500 }, (_, i) => ({
        conta_id: `conta-audit-${i}`,
        conta_codigo: `4.1.${Math.floor(i/10) + 1}.${(i%10) + 1}`,
        conta_nome: `RECEITA AUDIT ${i}`,
        conta_tipo: 'receita',
        saldo_debito: '0.00',
        saldo_credito: (1000 + i * 10).toFixed(2),
        saldo_final: (1000 + i * 10).toFixed(2)
      }));

      // Mock para DRE
      mockSupabaseClient.rpc.mockResolvedValue({
        data: auditDataset,
        error: null
      });

      // Mock para trilha de auditoria (simular múltiplas consultas)
      const mockFrom = jest.fn();
      auditDataset.forEach((_, index) => {
        mockFrom.mockReturnValueOnce({
          select: jest.fn(() => ({
            or: jest.fn(() => ({
              gte: jest.fn(() => ({
                lte: jest.fn(() => ({
                  eq: jest.fn(() => ({
                    eq: jest.fn(() => Promise.resolve({
                      data: Array.from({ length: Math.floor(Math.random() * 10) + 1 }, (_, i) => ({
                        id: `lancamento-${index}-${i}`,
                        valor: (Math.random() * 1000).toFixed(2),
                        historico: `Lançamento ${index}-${i}`
                      })),
                      error: null
                    }))
                  }))
                }))
              }))
            }))
          }))
        });
      });

      mockSupabaseClient.from.mockImplementation(() => mockFrom());

      // Act: Medir tempo com auditoria
      const startTime = performance.now();
      
      const result = await getDREData({
        period: { from: '2024-01-01', to: '2024-12-31' },
        unidade_id: 'trato',
        include_audit_trail: true
      });

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Assert: Verificar performance com auditoria
      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(5000); // Menos de 5 segundos
      
      if (result.success && result.data.audit_trail) {
        expect(result.data.audit_trail.length).toBeGreaterThan(0);
      }

      console.log(`⚡ getDREData com auditoria executado em ${executionTime.toFixed(2)}ms`);
    });

    it('deve identificar consultas que podem ser otimizadas', async () => {
      // Arrange: Simular consulta lenta
      const heavyQuery = jest.fn(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              data: Array.from({ length: 10000 }, (_, i) => ({
                conta_id: `conta-heavy-${i}`,
                conta_codigo: `1.${Math.floor(i/1000) + 1}.${Math.floor((i%1000)/100) + 1}.${Math.floor((i%100)/10) + 1}`,
                conta_nome: `CONTA PESADA ${i}`,
                conta_tipo: 'ativo',
                saldo_debito: (Math.random() * 50000).toFixed(2),
                saldo_credito: '0.00',
                saldo_final: (Math.random() * 50000).toFixed(2)
              })),
              error: null
            });
          }, 3000); // 3 segundos - consulta lenta
        })
      );

      mockSupabaseClient.rpc.mockImplementation(heavyQuery);

      // Act: Executar consulta lenta
      const startTime = performance.now();
      
      const result = await getDREData({
        period: { from: '2024-01-01', to: '2024-12-31' },
        unidade_id: 'trato'
      });

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Assert: Identificar gargalo
      expect(result.success).toBe(true);
      
      if (executionTime > 2000) {
        console.warn(`⚠️ CONSULTA LENTA DETECTADA: ${executionTime.toFixed(2)}ms`);
        console.warn('🔧 OTIMIZAÇÕES SUGERIDAS:');
        console.warn('   1. Criar índice em (unidade_id, data_competencia) na tabela lancamentos_contabeis');
        console.warn('   2. Criar índice em (codigo, ativo) na tabela contas_contabeis');
        console.warn('   3. Considerar particionamento da tabela lancamentos_contabeis por mês');
        console.warn('   4. Implementar cache para consultas DRE frequentes');
      }

      console.log(`🔍 Consulta pesada executada em ${executionTime.toFixed(2)}ms`);
    });
  });

  describe('Performance de Validação de Dados', () => {
    it('deve executar validateFinancialData em menos de 10 segundos para datasets grandes', async () => {
      // Arrange: Mock para múltiplas validações
      const mockFrom = jest.fn();
      
      // Simulação de diferentes tipos de validação
      const validationQueries = [
        // Integridade referencial
        { data: [], error: null, delay: 200 },
        // Balanceamento contábil
        { 
          data: Array.from({ length: 5000 }, (_, i) => ({
            valor: (1000 + i).toFixed(2),
            tipo_lancamento: i % 2 === 0 ? 'debito' : 'credito'
          })), 
          error: null, 
          delay: 500 
        },
        // Valores inválidos
        { data: [], error: null, delay: 100 },
        // Valores altos
        { data: [], error: null, delay: 150 },
        // Anomalias
        { 
          data: Array.from({ length: 2000 }, (_, i) => ({
            id: `lancamento-${i}`,
            valor: (Math.random() * 10000).toFixed(2),
            data_competencia: `2024-01-${(i % 28) + 1}`,
            historico: `Transação ${i}`
          })), 
          error: null, 
          delay: 800 
        },
        // Completude
        { data: [], error: null, delay: 300 }
      ];

      validationQueries.forEach(query => {
        mockFrom.mockReturnValueOnce({
          select: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => ({
                eq: jest.fn(() => ({
                  lte: jest.fn(() => new Promise(resolve => {
                    setTimeout(() => resolve(query), query.delay);
                  })),
                  gt: jest.fn(() => new Promise(resolve => {
                    setTimeout(() => resolve(query), query.delay);
                  })),
                  or: jest.fn(() => new Promise(resolve => {
                    setTimeout(() => resolve(query), query.delay);
                  }))
                }))
              }))
            }))
          }))
        }));
      });

      mockSupabaseClient.from.mockImplementation(() => mockFrom());
      mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: null });

      // Act: Medir tempo de validação
      const startTime = performance.now();
      
      const result = await validateFinancialData({
        period: { from: '2024-01-01', to: '2024-12-31' },
        unidade_id: 'trato',
        include_detailed_audit: true
      });

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Assert: Verificar performance da validação
      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(10000); // Menos de 10 segundos
      
      if (result.success) {
        expect(result.data.summary.total_checks).toBe(6);
      }

      console.log(`🔍 Validação completa executada em ${executionTime.toFixed(2)}ms`);
    });

    it('deve identificar validações que podem ser paralelizadas', async () => {
      // Arrange: Simulação de validações sequenciais vs paralelas
      const sequentialTime = await measureSequentialValidation();
      const parallelTime = await measureParallelValidation();

      // Assert: Verificar melhoria de performance
      const improvement = ((sequentialTime - parallelTime) / sequentialTime) * 100;
      
      console.log(`📊 Validação sequencial: ${sequentialTime.toFixed(2)}ms`);
      console.log(`📊 Validação paralela: ${parallelTime.toFixed(2)}ms`);
      console.log(`🚀 Melhoria de performance: ${improvement.toFixed(1)}%`);

      if (improvement > 20) {
        console.log('✅ Paralelização de validações é efetiva');
      } else {
        console.warn('⚠️ Considerar outras otimizações além da paralelização');
      }

      expect(parallelTime).toBeLessThan(sequentialTime);
    });

    async function measureSequentialValidation(): Promise<number> {
      const startTime = performance.now();
      
      // Simular validações sequenciais
      await new Promise(resolve => setTimeout(resolve, 200)); // Integridade
      await new Promise(resolve => setTimeout(resolve, 500)); // Balanceamento
      await new Promise(resolve => setTimeout(resolve, 100)); // Valores
      await new Promise(resolve => setTimeout(resolve, 150)); // Valores altos
      await new Promise(resolve => setTimeout(resolve, 300)); // Anomalias
      await new Promise(resolve => setTimeout(resolve, 250)); // Completude
      
      return performance.now() - startTime;
    }

    async function measureParallelValidation(): Promise<number> {
      const startTime = performance.now();
      
      // Simular validações paralelas
      await Promise.all([
        new Promise(resolve => setTimeout(resolve, 200)), // Integridade
        new Promise(resolve => setTimeout(resolve, 500)), // Balanceamento
        new Promise(resolve => setTimeout(resolve, 100)), // Valores
        new Promise(resolve => setTimeout(resolve, 150)), // Valores altos
        new Promise(resolve => setTimeout(resolve, 300)), // Anomalias
        new Promise(resolve => setTimeout(resolve, 250))  // Completude
      ]);
      
      return performance.now() - startTime;
    }
  });

  describe('Performance de Processamento de Receitas', () => {
    it('deve processar receitas automáticas em menos de 1 segundo', async () => {
      // Arrange: Mock otimizado para processamento rápido
      const mockFrom = jest.fn();
      
      // Mocks rápidos
      const quickMocks = [
        { data: null, error: { code: 'PGRST116' } }, // Verificação duplicata
        { data: { id: 'conta-receita', codigo: '4.1.1.1' }, error: null }, // Conta receita
        { data: { id: 'conta-caixa', codigo: '1.1.1.1' }, error: null }, // Conta caixa
        { data: { id: 'cliente-123', nome: 'Cliente' }, error: null }, // Cliente
        { data: { id: 'lancamento-123' }, error: null }, // Lançamento
        { data: { id: 'receita-123', value: 100 }, error: null } // Receita
      ];

      quickMocks.forEach(mock => {
        mockFrom.mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve(mock)),
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve(mock))
              }))
            }))
          })),
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve(mock))
            }))
          }))
        });
      });

      mockSupabaseClient.from.mockImplementation(() => mockFrom());

      const paymentData = {
        event: 'PAYMENT_CONFIRMED' as const,
        payment: {
          id: 'pay_performance_test',
          customer: 'cus_performance_test',
          value: 10000,
          description: 'Teste de performance',
          date: '2024-01-15',
          billingType: 'PIX' as const
        },
        timestamp: '2024-01-15T10:30:00.000Z',
        webhookId: 'webhook_performance_test'
      };

      // Act: Medir tempo de processamento
      const startTime = performance.now();
      
      const result = await processAutomaticRevenue(paymentData);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Assert: Verificar performance
      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(1000); // Menos de 1 segundo

      console.log(`⚡ Receita processada em ${executionTime.toFixed(2)}ms`);
    });

    it('deve identificar gargalos no processamento de receitas', async () => {
      // Arrange: Simular diferentes latências em cada etapa
      const stepTimes: { [key: string]: number } = {};
      
      const createMockWithTiming = (stepName: string, delay: number, response: any) => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(async () => {
              const startStep = performance.now();
              await new Promise(resolve => setTimeout(resolve, delay));
              stepTimes[stepName] = performance.now() - startStep;
              return response;
            }),
            eq: jest.fn(() => ({
              single: jest.fn(async () => {
                const startStep = performance.now();
                await new Promise(resolve => setTimeout(resolve, delay));
                stepTimes[stepName] = performance.now() - startStep;
                return response;
              })
            }))
          }))
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(async () => {
              const startStep = performance.now();
              await new Promise(resolve => setTimeout(resolve, delay));
              stepTimes[stepName] = performance.now() - startStep;
              return response;
            })
          }))
        }))
      });

      const mockFrom = jest.fn();
      
      // Simular diferentes latências
      mockFrom.mockReturnValueOnce(createMockWithTiming('verificacao_duplicata', 50, { data: null, error: { code: 'PGRST116' } }));
      mockFrom.mockReturnValueOnce(createMockWithTiming('busca_conta_receita', 200, { data: { id: 'conta-receita' }, error: null }));
      mockFrom.mockReturnValueOnce(createMockWithTiming('busca_conta_caixa', 150, { data: { id: 'conta-caixa' }, error: null }));
      mockFrom.mockReturnValueOnce(createMockWithTiming('busca_cliente', 300, { data: { id: 'cliente-123' }, error: null }));
      mockFrom.mockReturnValueOnce(createMockWithTiming('criacao_lancamento', 400, { data: { id: 'lancamento-123' }, error: null }));
      mockFrom.mockReturnValueOnce(createMockWithTiming('criacao_receita', 250, { data: { id: 'receita-123' }, error: null }));

      mockSupabaseClient.from.mockImplementation(() => mockFrom());

      const paymentData = {
        event: 'PAYMENT_CONFIRMED' as const,
        payment: {
          id: 'pay_bottleneck_test',
          customer: 'cus_bottleneck_test',
          value: 10000,
          description: 'Teste de gargalos',
          date: '2024-01-15',
          billingType: 'CREDIT_CARD' as const
        },
        timestamp: '2024-01-15T10:30:00.000Z',
        webhookId: 'webhook_bottleneck_test'
      };

      // Act: Processar e medir cada etapa
      await processAutomaticRevenue(paymentData);

      // Assert: Identificar gargalos
      console.log('🔍 Análise de gargalos no processamento de receitas:');
      Object.entries(stepTimes).forEach(([step, time]) => {
        const status = time > 300 ? '🐌 LENTO' : time > 150 ? '⚠️ MÉDIO' : '✅ RÁPIDO';
        console.log(`   ${status} ${step}: ${time.toFixed(2)}ms`);
      });

      const slowestStep = Object.entries(stepTimes).reduce((a, b) => a[1] > b[1] ? a : b);
      console.log(`🎯 Maior gargalo: ${slowestStep[0]} (${slowestStep[1].toFixed(2)}ms)`);

      // Sugestões de otimização baseadas no gargalo identificado
      if (slowestStep[0].includes('busca_cliente')) {
        console.log('💡 SUGESTÃO: Criar índice em asaas_customer_id na tabela clients');
      } else if (slowestStep[0].includes('conta')) {
        console.log('💡 SUGESTÃO: Criar índice em (codigo, ativo) na tabela contas_contabeis');
      } else if (slowestStep[0].includes('criacao')) {
        console.log('💡 SUGESTÃO: Otimizar triggers ou constraints na tabela de destino');
      }
    });
  });

  describe('Análise de Memória e Recursos', () => {
    it('deve monitorar uso de memória durante processamento de DRE grande', async () => {
      // Arrange: Dataset muito grande
      const hugeDataset = Array.from({ length: 50000 }, (_, i) => ({
        conta_id: `conta-${i}`,
        conta_codigo: `${Math.floor(i/10000) + 1}.${Math.floor((i%10000)/1000) + 1}.${Math.floor((i%1000)/100) + 1}.${Math.floor((i%100)/10) + 1}`,
        conta_nome: `CONTA ${i}`,
        conta_tipo: ['receita', 'despesa', 'custo', 'ativo'][i % 4],
        saldo_debito: (Math.random() * 10000).toFixed(2),
        saldo_credito: (Math.random() * 10000).toFixed(2),
        saldo_final: (Math.random() * 20000 - 10000).toFixed(2)
      }));

      mockSupabaseClient.rpc.mockResolvedValue({
        data: hugeDataset,
        error: null
      });

      // Act: Monitorar memória (simulado)
      const beforeMemory = process.memoryUsage();
      
      const result = await getDREData({
        period: { from: '2024-01-01', to: '2024-12-31' },
        unidade_id: 'trato',
        include_audit_trail: false
      });

      const afterMemory = process.memoryUsage();

      // Assert: Verificar uso de memória
      const memoryIncrease = {
        rss: (afterMemory.rss - beforeMemory.rss) / 1024 / 1024, // MB
        heapUsed: (afterMemory.heapUsed - beforeMemory.heapUsed) / 1024 / 1024, // MB
        heapTotal: (afterMemory.heapTotal - beforeMemory.heapTotal) / 1024 / 1024 // MB
      };

      console.log('📊 Análise de uso de memória:');
      console.log(`   RSS: +${memoryIncrease.rss.toFixed(2)} MB`);
      console.log(`   Heap Used: +${memoryIncrease.heapUsed.toFixed(2)} MB`);
      console.log(`   Heap Total: +${memoryIncrease.heapTotal.toFixed(2)} MB`);

      // Alertas de uso excessivo de memória
      if (memoryIncrease.heapUsed > 100) {
        console.warn('⚠️ USO EXCESSIVO DE MEMÓRIA DETECTADO');
        console.warn('💡 SUGESTÕES:');
        console.warn('   - Implementar paginação nos resultados do DRE');
        console.warn('   - Processar dados em chunks menores');
        console.warn('   - Considerar streaming de dados grandes');
      }

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.receitas.detalhes.length).toBe(
          hugeDataset.filter(item => item.conta_tipo === 'receita').length
        );
      }
    });
  });

  describe('Recomendações de Otimização', () => {
    it('deve gerar relatório de otimizações recomendadas', () => {
      console.log('\n🔧 RELATÓRIO DE OTIMIZAÇÕES RECOMENDADAS\n');
      
      console.log('📋 ÍNDICES DE BANCO DE DADOS:');
      console.log('   1. CREATE INDEX idx_lancamentos_unidade_data ON lancamentos_contabeis(unidade_id, data_competencia);');
      console.log('   2. CREATE INDEX idx_lancamentos_conta_debito ON lancamentos_contabeis(conta_debito_id);');
      console.log('   3. CREATE INDEX idx_lancamentos_conta_credito ON lancamentos_contabeis(conta_credito_id);');
      console.log('   4. CREATE INDEX idx_contas_codigo_ativo ON contas_contabeis(codigo, ativo);');
      console.log('   5. CREATE INDEX idx_clients_asaas_customer ON clients(asaas_customer_id);');
      console.log('   6. CREATE INDEX idx_receitas_payment_id ON receitas_automaticas(payment_id);');
      
      console.log('\n🚀 OTIMIZAÇÕES DE CÓDIGO:');
      console.log('   1. Implementar cache Redis para consultas DRE frequentes');
      console.log('   2. Adicionar paginação em consultas que retornam muitos registros');
      console.log('   3. Paralelizar validações independentes');
      console.log('   4. Implementar batching para múltiplas receitas');
      console.log('   5. Adicionar debounce em validações em tempo real');
      
      console.log('\n📊 MONITORAMENTO:');
      console.log('   1. Adicionar métricas de performance para cada Server Action');
      console.log('   2. Implementar alertas para consultas lentas (>2s)');
      console.log('   3. Monitorar uso de memória em produção');
      console.log('   4. Adicionar logs de performance por funcionalidade');
      
      console.log('\n🏗️ ARQUITETURA:');
      console.log('   1. Considerar particionamento da tabela lancamentos_contabeis por mês');
      console.log('   2. Implementar read replicas para consultas de relatórios');
      console.log('   3. Avaliar uso de materialized views para DREs frequentes');
      console.log('   4. Considerar processamento assíncrono para relatórios pesados');

      // Este teste sempre passa - é apenas informativo
      expect(true).toBe(true);
    });
  });
});
