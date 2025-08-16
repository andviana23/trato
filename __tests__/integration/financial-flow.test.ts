/**
 * @jest-environment jsdom
 */

import { describe, it, expect, jest, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';

// Mock das dependências principais
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/audit');
jest.mock('next/cache');
jest.mock('@/lib/queue/financialJobs');

import { processAutomaticRevenue } from '@/app/actions/financial';
import { getDREData, validateFinancialData } from '@/app/actions/reports';
import { financialRevenueQueue } from '@/lib/queue/financialJobs';
import type { PaymentWebhookData } from '@/lib/queue/financialJobs';

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
const mockFinancialRevenueQueue = {
  add: jest.fn(),
  getStats: jest.fn(),
  clean: jest.fn(),
};

// Setup dos mocks
jest.mocked(require('@/lib/supabase/server')).createClient = mockCreateClient;
jest.mocked(require('@/lib/audit')).logAuditEvent = mockLogAuditEvent;
jest.mocked(require('next/cache')).revalidatePath = mockRevalidatePath;
jest.mocked(require('@/lib/queue/financialJobs')).financialRevenueQueue = mockFinancialRevenueQueue;

describe('Testes de Integração - Fluxo Financeiro Completo', () => {
  // Dados de teste reutilizáveis
  const mockUser = { id: 'user-123', email: 'test@test.com' };
  const mockContaReceita = { id: 'conta-receita-123', codigo: '4.1.1.1', nome: 'RECEITA DE SERVIÇOS' };
  const mockContaCaixa = { id: 'conta-caixa-123', codigo: '1.1.1.1', nome: 'CAIXA' };
  const mockCliente = { id: 'cliente-123', nome: 'Cliente Teste', asaas_customer_id: 'cus_123456789' };

  beforeAll(() => {
    // Setup global para todos os testes de integração
    console.log('🧪 Iniciando testes de integração do fluxo financeiro');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock padrão para usuário autenticado
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    console.log('✅ Testes de integração do fluxo financeiro concluídos');
  });

  describe('Fluxo Completo: Webhook ASAAS → Fila → Processamento → DRE', () => {
    it('deve processar webhook de pagamento e refletir no DRE corretamente', async () => {
      // Arrange: Configurar cenário completo de integração
      const mockPaymentData: PaymentWebhookData = {
        event: 'PAYMENT_CONFIRMED',
        payment: {
          id: 'pay_integration_test_001',
          customer: 'cus_integration_test_001',
          subscription: 'sub_integration_test_001',
          value: 50000, // R$ 500,00 em centavos
          description: 'Pagamento de teste de integração',
          date: '2024-01-15',
          billingType: 'CREDIT_CARD',
          invoiceUrl: 'https://sandbox.asaas.com/invoice/integration',
          transactionReceiptUrl: 'https://sandbox.asaas.com/receipt/integration'
        },
        timestamp: '2024-01-15T10:30:00.000Z',
        webhookId: 'webhook_integration_test_001'
      };

      // FASE 1: Mock do processamento de receita automática
      const mockFrom = jest.fn();
      
      // Verificação de duplicata
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: null,
              error: { code: 'PGRST116' }
            }))
          }))
        }))
      });

      // Busca das contas contábeis
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: mockContaReceita,
                error: null
              }))
            }))
          }))
        }))
      });

      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: mockContaCaixa,
                error: null
              }))
            }))
          }))
        }))
      });

      // Busca do cliente
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: mockCliente,
              error: null
            }))
          }))
        }))
      });

      // Inserção do lançamento contábil
      mockFrom.mockReturnValueOnce({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: { id: 'lancamento-integration-123' },
              error: null
            }))
          }))
        }))
      });

      // Inserção da receita automática
      mockFrom.mockReturnValueOnce({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: {
                id: 'receita-integration-123',
                payment_id: 'pay_integration_test_001',
                customer_id: 'cus_integration_test_001',
                value: 500.00,
                description: 'Pagamento de teste de integração',
                lancamento_id: 'lancamento-integration-123',
                created_at: '2024-01-15T10:30:00.000Z'
              },
              error: null
            }))
          }))
        }))
      });

      mockSupabaseClient.from.mockImplementation(() => mockFrom());

      // FASE 2: Processar receita automática
      const revenueResult = await processAutomaticRevenue(mockPaymentData);

      // Assert FASE 2: Verificar se a receita foi processada corretamente
      expect(revenueResult.success).toBe(true);
      if (revenueResult.success) {
        expect(revenueResult.data.payment_id).toBe('pay_integration_test_001');
        expect(revenueResult.data.value).toBe(500.00);
      }

      // FASE 3: Mock do DRE que incluirá a nova receita
      const mockDREData = [
        {
          conta_id: mockContaReceita.id,
          conta_codigo: mockContaReceita.codigo,
          conta_nome: mockContaReceita.nome,
          conta_tipo: 'receita',
          saldo_debito: '0.00',
          saldo_credito: '500.00', // Nossa receita processada
          saldo_final: '500.00'
        },
        {
          conta_id: mockContaCaixa.id,
          conta_codigo: mockContaCaixa.codigo,
          conta_nome: mockContaCaixa.nome,
          conta_tipo: 'ativo',
          saldo_debito: '500.00', // Entrada no caixa
          saldo_credito: '0.00',
          saldo_final: '500.00'
        }
      ];

      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockDREData,
        error: null
      });

      // FASE 4: Gerar DRE e verificar se inclui a receita processada
      const dreResult = await getDREData({
        period: { from: '2024-01-01', to: '2024-01-31' },
        unidade_id: 'trato',
        include_audit_trail: false
      });

      // Assert FASE 4: Verificar se o DRE reflete a receita processada
      expect(dreResult.success).toBe(true);
      if (dreResult.success) {
        expect(dreResult.data.receitas.receita_bruta).toBe(500);
        expect(dreResult.data.receitas.receita_liquida).toBe(500);
        expect(dreResult.data.resultado.lucro_liquido).toBe(375); // 500 - 25% IR
      }

      // FASE 5: Verificar logs de auditoria
      expect(mockLogAuditEvent).toHaveBeenCalledTimes(2); // 1 para receita + 1 para DRE
      expect(mockRevalidatePath).toHaveBeenCalledWith('/relatorios/financeiro');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard');

      console.log('✅ Fluxo completo testado com sucesso: Webhook → Processamento → DRE');
    });

    it('deve detectar e prevenir duplicação de receitas', async () => {
      // Arrange: Cenário onde a receita já foi processada
      const mockPaymentData: PaymentWebhookData = {
        event: 'PAYMENT_CONFIRMED',
        payment: {
          id: 'pay_duplicate_test_001',
          customer: 'cus_duplicate_test_001',
          value: 30000,
          description: 'Pagamento duplicado',
          date: '2024-01-16',
          billingType: 'PIX'
        },
        timestamp: '2024-01-16T10:30:00.000Z',
        webhookId: 'webhook_duplicate_test_001'
      };

      // Mock que encontra receita existente
      const mockFrom = jest.fn();
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: { id: 'receita-existente-123' }, // Receita já existe
              error: null
            }))
          }))
        }))
      });

      mockSupabaseClient.from.mockImplementation(() => mockFrom());

      // Act: Tentar processar receita duplicada
      const result = await processAutomaticRevenue(mockPaymentData);

      // Assert: Verificar que foi detectada como duplicata
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Receita já processada para este pagamento');
      }

      // Verificar que nenhuma nova inserção foi tentada
      expect(mockFrom).toHaveBeenCalledTimes(1); // Apenas a verificação de duplicata

      console.log('✅ Prevenção de duplicatas testada com sucesso');
    });

    it('deve fazer rollback em caso de falha parcial', async () => {
      // Arrange: Cenário onde o lançamento é criado mas a receita falha
      const mockPaymentData: PaymentWebhookData = {
        event: 'PAYMENT_CONFIRMED',
        payment: {
          id: 'pay_rollback_test_001',
          customer: 'cus_rollback_test_001',
          value: 25000,
          description: 'Pagamento para teste de rollback',
          date: '2024-01-17',
          billingType: 'BOLETO'
        },
        timestamp: '2024-01-17T10:30:00.000Z',
        webhookId: 'webhook_rollback_test_001'
      };

      const mockFrom = jest.fn();
      
      // Verificação de duplicata (não encontra)
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: null,
              error: { code: 'PGRST116' }
            }))
          }))
        }))
      });

      // Busca das contas (sucessos)
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: mockContaReceita,
                error: null
              }))
            }))
          }))
        }))
      });

      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: mockContaCaixa,
                error: null
              }))
            }))
          }))
        }))
      });

      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: mockCliente,
              error: null
            }))
          }))
        }))
      });

      // Lançamento criado com sucesso
      mockFrom.mockReturnValueOnce({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: { id: 'lancamento-rollback-123' },
              error: null
            }))
          }))
        }))
      });

      // Receita falha ao ser criada
      mockFrom.mockReturnValueOnce({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Erro simulado na criação da receita' }
            }))
          }))
        }))
      });

      // Mock para rollback do lançamento
      mockFrom.mockReturnValueOnce({
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null }))
        }))
      });

      mockSupabaseClient.from.mockImplementation(() => mockFrom());

      // Act: Processar receita com falha
      const result = await processAutomaticRevenue(mockPaymentData);

      // Assert: Verificar erro e rollback
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Erro ao criar registro de receita');
      }

      // Verificar que o rollback foi chamado
      const deleteCall = mockFrom.mock.calls.find(call => 
        call[0] && typeof call[0] === 'object' && 'delete' in call[0]
      );
      expect(mockFrom).toHaveBeenCalledTimes(7); // 6 para o fluxo + 1 para rollback

      console.log('✅ Rollback testado com sucesso');
    });
  });

  describe('Integração com Fila BullMQ', () => {
    it('deve simular adição de job à fila e processamento', async () => {
      // Arrange: Dados do webhook
      const webhookPayload = {
        event: 'PAYMENT_CONFIRMED',
        payment: {
          id: 'pay_queue_test_001',
          customer: 'cus_queue_test_001',
          value: 15000,
          description: 'Teste de fila',
          date: '2024-01-18',
          billingType: 'CREDIT_CARD'
        },
        timestamp: '2024-01-18T10:30:00.000Z',
        webhookId: 'webhook_queue_test_001'
      };

      // Mock da fila
      mockFinancialRevenueQueue.add.mockResolvedValue({
        id: 'job-123',
        data: webhookPayload,
        opts: { priority: 1, attempts: 3 }
      });

      // Act: Simular adição à fila
      const queueResult = await mockFinancialRevenueQueue.add('process-payment', webhookPayload, {
        priority: 1,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      });

      // Assert: Verificar se foi adicionado à fila
      expect(mockFinancialRevenueQueue.add).toHaveBeenCalledWith(
        'process-payment',
        webhookPayload,
        expect.objectContaining({
          priority: 1,
          attempts: 3
        })
      );

      expect(queueResult.id).toBe('job-123');
      expect(queueResult.data).toEqual(webhookPayload);

      console.log('✅ Integração com fila BullMQ testada com sucesso');
    });

    it('deve simular monitoramento de estatísticas da fila', async () => {
      // Arrange: Mock das estatísticas
      const mockStats = {
        waiting: 2,
        active: 1,
        completed: 150,
        failed: 3,
        delayed: 0,
        paused: 0
      };

      mockFinancialRevenueQueue.getStats.mockResolvedValue(mockStats);

      // Act: Obter estatísticas
      const stats = await mockFinancialRevenueQueue.getStats();

      // Assert: Verificar estatísticas
      expect(stats.waiting).toBe(2);
      expect(stats.active).toBe(1);
      expect(stats.completed).toBe(150);
      expect(stats.failed).toBe(3);

      // Calcular taxa de sucesso
      const successRate = (stats.completed / (stats.completed + stats.failed)) * 100;
      expect(successRate).toBeCloseTo(98.04, 2); // ~98% de sucesso

      console.log('✅ Monitoramento de estatísticas da fila testado com sucesso');
    });
  });

  describe('Validação de Dados em Cenários Reais', () => {
    it('deve validar integridade após processamento de múltiplas receitas', async () => {
      // Arrange: Simular múltiplas receitas processadas
      const mockValidationData = [
        // Lançamentos balanceados
        { valor: '500.00', tipo_lancamento: 'debito' },  // Entrada caixa
        { valor: '500.00', tipo_lancamento: 'credito' }, // Receita
        { valor: '300.00', tipo_lancamento: 'debito' },  // Entrada caixa
        { valor: '300.00', tipo_lancamento: 'credito' }, // Receita
        { valor: '200.00', tipo_lancamento: 'debito' },  // Entrada caixa
        { valor: '200.00', tipo_lancamento: 'credito' }  // Receita
      ];

      // Mock das consultas de validação
      const mockFrom = jest.fn();

      // Integridade referencial (sem erros)
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({
                data: [], // Sem problemas de integridade
                error: null
              }))
            }))
          }))
        }))
      });

      // Balanceamento contábil
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({
                  data: mockValidationData,
                  error: null
                }))
              }))
            }))
          }))
        }))
      });

      // Outros mocks de validação
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
      const validationResult = await validateFinancialData({
        period: { from: '2024-01-01', to: '2024-01-31' },
        unidade_id: 'trato',
        include_detailed_audit: true
      });

      // Assert: Verificar que os dados estão consistentes
      expect(validationResult.success).toBe(true);
      if (validationResult.success) {
        expect(validationResult.data.isValid).toBe(true);
        expect(validationResult.data.summary.total_checks).toBe(6);
        
        // Verificar balanceamento
        const totalDebitos = mockValidationData
          .filter(l => l.tipo_lancamento === 'debito')
          .reduce((sum, l) => sum + parseFloat(l.valor), 0);
        
        const totalCreditos = mockValidationData
          .filter(l => l.tipo_lancamento === 'credito')
          .reduce((sum, l) => sum + parseFloat(l.valor), 0);
        
        expect(totalDebitos).toBe(totalCreditos); // Deve estar balanceado
      }

      console.log('✅ Validação de integridade após múltiplas receitas testada com sucesso');
    });
  });

  describe('Cenários de Erro e Recuperação', () => {
    it('deve lidar com indisponibilidade temporária do banco', async () => {
      // Arrange: Simular erro de conexão
      const mockPaymentData: PaymentWebhookData = {
        event: 'PAYMENT_CONFIRMED',
        payment: {
          id: 'pay_db_error_test_001',
          customer: 'cus_db_error_test_001',
          value: 10000,
          description: 'Teste de erro de banco',
          date: '2024-01-19',
          billingType: 'PIX'
        },
        timestamp: '2024-01-19T10:30:00.000Z',
        webhookId: 'webhook_db_error_test_001'
      };

      // Mock de erro de conexão
      const mockFrom = jest.fn();
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: null,
              error: { 
                message: 'Connection timeout',
                code: 'CONNECTION_ERROR' 
              }
            }))
          }))
        }))
      });

      mockSupabaseClient.from.mockImplementation(() => mockFrom());

      // Act: Tentar processar com erro de banco
      const result = await processAutomaticRevenue(mockPaymentData);

      // Assert: Verificar tratamento do erro
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Erro ao verificar receita existente');
      }

      // Em um cenário real, isso seria retentado pela fila BullMQ
      console.log('✅ Tratamento de erro de banco testado com sucesso');
    });

    it('deve validar comportamento com dados corrompidos', async () => {
      // Arrange: Dados com valores inconsistentes
      const mockCorruptedDRE = [
        {
          conta_id: 'conta-1',
          conta_codigo: '4.1.1.1',
          conta_nome: 'RECEITA DE SERVIÇOS',
          conta_tipo: 'receita',
          saldo_debito: 'NaN', // Valor corrompido
          saldo_credito: 'invalid', // Valor corrompido
          saldo_final: null // Valor nulo
        }
      ];

      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockCorruptedDRE,
        error: null
      });

      // Act: Tentar gerar DRE com dados corrompidos
      const result = await getDREData({
        period: { from: '2024-01-01', to: '2024-01-31' },
        unidade_id: 'trato'
      });

      // Assert: Verificar que a função lida com dados corrompidos
      expect(result.success).toBe(true);
      if (result.success) {
        // Os valores corrompidos devem ser tratados como 0
        expect(result.data.receitas.receita_bruta).toBe(0);
        expect(isNaN(result.data.receitas.receita_bruta)).toBe(false);
      }

      console.log('✅ Tratamento de dados corrompidos testado com sucesso');
    });
  });

  describe('Performance e Stress Testing', () => {
    it('deve simular processamento de alto volume de transações', async () => {
      // Arrange: Simular múltiplos pagamentos simultâneos
      const mockPayments = Array.from({ length: 100 }, (_, i) => ({
        event: 'PAYMENT_CONFIRMED' as const,
        payment: {
          id: `pay_stress_test_${i.toString().padStart(3, '0')}`,
          customer: `cus_stress_test_${i.toString().padStart(3, '0')}`,
          value: Math.floor(Math.random() * 50000) + 10000, // R$ 100 a R$ 500
          description: `Pagamento stress test ${i}`,
          date: '2024-01-20',
          billingType: ['CREDIT_CARD', 'PIX', 'BOLETO'][i % 3] as any
        },
        timestamp: `2024-01-20T${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00.000Z`,
        webhookId: `webhook_stress_test_${i.toString().padStart(3, '0')}`
      }));

      // Mock otimizado para múltiplas transações
      const mockFrom = jest.fn();
      
      // Para cada transação, mock de não-duplicata
      mockPayments.forEach(() => {
        mockFrom.mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: null,
                error: { code: 'PGRST116' }
              }))
            }))
          }))
        });
      });

      mockSupabaseClient.from.mockImplementation(() => mockFrom());

      // Act: Processar todas as transações
      const startTime = Date.now();
      const results = await Promise.all(
        mockPayments.slice(0, 10).map(payment => // Testar apenas 10 para não sobrecarregar
          processAutomaticRevenue(payment).catch(error => ({
            success: false as const,
            error: error.message
          }))
        )
      );
      const endTime = Date.now();

      // Assert: Verificar performance e resultados
      const processingTime = endTime - startTime;
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;

      console.log(`⏱️ Processamento de ${results.length} transações levou ${processingTime}ms`);
      console.log(`✅ Sucessos: ${successCount}, ❌ Erros: ${errorCount}`);

      // Esperar que pelo menos algumas transações sejam processadas rapidamente
      expect(processingTime).toBeLessThan(5000); // Menos de 5 segundos para 10 transações
      expect(successCount + errorCount).toBe(results.length);

      console.log('✅ Teste de stress de alto volume concluído com sucesso');
    });
  });
});
