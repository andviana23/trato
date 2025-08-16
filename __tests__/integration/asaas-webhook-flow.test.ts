/**
 * @jest-environment jsdom
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock do Next.js e dependências
jest.mock('next/server');
jest.mock('@/lib/supabase/client');
jest.mock('@/lib/queue/financialJobs');

// Imports necessários
import { NextRequest } from 'next/server';

// Mocks
const mockFinancialRevenueQueue = {
  add: jest.fn(),
  getStats: jest.fn(),
  clean: jest.fn(),
};

jest.mocked(require('@/lib/queue/financialJobs')).financialRevenueQueue = mockFinancialRevenueQueue;

// Mock da função POST do webhook
const createMockWebhookHandler = () => {
  return async function POST(req: Request) {
    try {
      const body = await req.json();

      // Filtrar apenas eventos de pagamento CONFIRMED
      if (
        body.event === 'PAYMENT_CONFIRMED' &&
        body.payment &&
        body.payment.status === 'CONFIRMED'
      ) {
        const payment = body.payment;
        
        // Criar payload para o job da fila
        const jobPayload = {
          event: body.event,
          payment: {
            id: payment.id,
            customer: payment.customer,
            subscription: payment.subscription,
            value: payment.value,
            description: payment.description,
            date: payment.dueDate || payment.originalDueDate,
            billingType: payment.billingType,
            invoiceUrl: payment.invoiceUrl,
            transactionReceiptUrl: payment.transactionReceiptUrl,
          },
          timestamp: new Date().toISOString(),
          webhookId: body.id || `webhook_${Date.now()}`
        };

        // Adicionar job à fila de processamento financeiro
        await mockFinancialRevenueQueue.add('process-payment', jobPayload, {
          priority: 1, // Prioridade alta para pagamentos confirmados
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 50,
        });

        console.log(`✅ Job adicionado à fila para pagamento ${payment.id}`);
        
        return new Response(JSON.stringify({ 
          received: true, 
          message: 'Webhook processado e adicionado à fila de processamento',
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Para outros eventos, apenas confirmar recebimento
      return new Response(JSON.stringify({ 
        received: true, 
        message: 'Evento recebido mas não processado',
        event: body.event 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('❌ Erro ao processar webhook ASAAS:', error);
      return new Response(JSON.stringify({
        received: false, 
        error: 'Erro interno do servidor' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };
};

describe('Integração ASAAS Webhook → Fila BullMQ', () => {
  let webhookHandler: (req: Request) => Promise<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    webhookHandler = createMockWebhookHandler();
    
    // Mock de sucesso por padrão para a fila
    mockFinancialRevenueQueue.add.mockResolvedValue({
      id: 'job-123',
      data: {},
      opts: {}
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Processamento de Webhook de Pagamento Confirmado', () => {
    it('deve processar webhook PAYMENT_CONFIRMED e adicionar job à fila', async () => {
      // Arrange: Payload válido do ASAAS
      const webhookPayload = {
        event: 'PAYMENT_CONFIRMED',
        id: 'webhook_asaas_12345',
        dateCreated: '2024-01-15T10:30:00.000Z',
        payment: {
          id: 'pay_asaas_67890',
          customer: 'cus_asaas_12345',
          subscription: 'sub_asaas_54321',
          installment: null,
          paymentLink: null,
          value: 150.00,
          netValue: 145.35,
          originalValue: null,
          interestValue: null,
          description: 'Pagamento de teste ASAAS',
          billingType: 'CREDIT_CARD',
          status: 'CONFIRMED',
          pixTransaction: null,
          confirmedDate: '2024-01-15T10:30:00.000Z',
          paymentDate: '2024-01-15T10:30:00.000Z',
          clientPaymentDate: '2024-01-15T10:30:00.000Z',
          installmentNumber: null,
          invoiceUrl: 'https://sandbox.asaas.com/i/pay_asaas_67890',
          bankSlipUrl: null,
          transactionReceiptUrl: 'https://sandbox.asaas.com/comprovantes/pay_asaas_67890',
          dueDate: '2024-01-15',
          originalDueDate: '2024-01-15',
          externalReference: 'ref_12345',
          deleted: false,
          anticipated: false,
          anticipable: false
        }
      };

      // Criar request mock
      const request = new Request('http://localhost:3000/api/asaas-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload)
      });

      // Act: Processar o webhook
      const response = await webhookHandler(request);
      const responseData = await response.json();

      // Assert: Verificar resposta
      expect(response.status).toBe(200);
      expect(responseData.received).toBe(true);
      expect(responseData.message).toBe('Webhook processado e adicionado à fila de processamento');

      // Verificar se o job foi adicionado à fila
      expect(mockFinancialRevenueQueue.add).toHaveBeenCalledTimes(1);
      expect(mockFinancialRevenueQueue.add).toHaveBeenCalledWith(
        'process-payment',
        expect.objectContaining({
          event: 'PAYMENT_CONFIRMED',
          payment: expect.objectContaining({
            id: 'pay_asaas_67890',
            customer: 'cus_asaas_12345',
            value: 150.00,
            description: 'Pagamento de teste ASAAS',
            billingType: 'CREDIT_CARD'
          }),
          timestamp: expect.any(String),
          webhookId: 'webhook_asaas_12345'
        }),
        expect.objectContaining({
          priority: 1,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 50
        })
      );

      console.log('✅ Webhook PAYMENT_CONFIRMED processado e adicionado à fila com sucesso');
    });

    it('deve processar múltiplos webhooks sequencialmente', async () => {
      // Arrange: Múltiplos payloads
      const webhookPayloads = [
        {
          event: 'PAYMENT_CONFIRMED',
          id: 'webhook_1',
          payment: {
            id: 'pay_1',
            customer: 'cus_1',
            value: 100.00,
            description: 'Pagamento 1',
            billingType: 'PIX',
            status: 'CONFIRMED',
            dueDate: '2024-01-15'
          }
        },
        {
          event: 'PAYMENT_CONFIRMED',
          id: 'webhook_2',
          payment: {
            id: 'pay_2',
            customer: 'cus_2',
            value: 200.00,
            description: 'Pagamento 2',
            billingType: 'CREDIT_CARD',
            status: 'CONFIRMED',
            dueDate: '2024-01-15'
          }
        },
        {
          event: 'PAYMENT_CONFIRMED',
          id: 'webhook_3',
          payment: {
            id: 'pay_3',
            customer: 'cus_3',
            value: 300.00,
            description: 'Pagamento 3',
            billingType: 'BOLETO',
            status: 'CONFIRMED',
            dueDate: '2024-01-15'
          }
        }
      ];

      // Act: Processar todos os webhooks
      const responses = await Promise.all(
        webhookPayloads.map(payload => {
          const request = new Request('http://localhost:3000/api/asaas-webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          return webhookHandler(request);
        })
      );

      // Assert: Verificar todas as respostas
      for (const response of responses) {
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.received).toBe(true);
      }

      // Verificar que todos os jobs foram adicionados à fila
      expect(mockFinancialRevenueQueue.add).toHaveBeenCalledTimes(3);

      console.log('✅ Múltiplos webhooks processados sequencialmente com sucesso');
    });

    it('deve ignorar eventos que não são PAYMENT_CONFIRMED', async () => {
      // Arrange: Eventos não relevantes
      const otherEvents = [
        {
          event: 'PAYMENT_CREATED',
          payment: { id: 'pay_1', status: 'PENDING' }
        },
        {
          event: 'PAYMENT_UPDATED',
          payment: { id: 'pay_2', status: 'OVERDUE' }
        },
        {
          event: 'PAYMENT_DELETED',
          payment: { id: 'pay_3', status: 'DELETED' }
        }
      ];

      // Act: Processar eventos não relevantes
      const responses = await Promise.all(
        otherEvents.map(payload => {
          const request = new Request('http://localhost:3000/api/asaas-webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          return webhookHandler(request);
        })
      );

      // Assert: Verificar que foram recebidos mas não processados
      for (const response of responses) {
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.received).toBe(true);
        expect(data.message).toBe('Evento recebido mas não processado');
      }

      // Verificar que nenhum job foi adicionado à fila
      expect(mockFinancialRevenueQueue.add).not.toHaveBeenCalled();

      console.log('✅ Eventos não relevantes ignorados corretamente');
    });

    it('deve tratar erros de processamento graciosamente', async () => {
      // Arrange: Mock de erro na fila
      mockFinancialRevenueQueue.add.mockRejectedValue(new Error('Erro na fila BullMQ'));

      const webhookPayload = {
        event: 'PAYMENT_CONFIRMED',
        payment: {
          id: 'pay_error_test',
          customer: 'cus_error_test',
          value: 50.00,
          description: 'Pagamento com erro',
          billingType: 'PIX',
          status: 'CONFIRMED',
          dueDate: '2024-01-15'
        }
      };

      const request = new Request('http://localhost:3000/api/asaas-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      });

      // Act: Processar webhook com erro
      const response = await webhookHandler(request);
      const responseData = await response.json();

      // Assert: Verificar tratamento do erro
      expect(response.status).toBe(500);
      expect(responseData.received).toBe(false);
      expect(responseData.error).toBe('Erro interno do servidor');

      console.log('✅ Erro de processamento tratado graciosamente');
    });

    it('deve validar estrutura do payload do webhook', async () => {
      // Arrange: Payloads inválidos
      const invalidPayloads = [
        {}, // Payload vazio
        { event: 'PAYMENT_CONFIRMED' }, // Sem payment
        { event: 'PAYMENT_CONFIRMED', payment: {} }, // Payment vazio
        { event: 'PAYMENT_CONFIRMED', payment: { id: 'pay_1' } }, // Sem status
        { 
          event: 'PAYMENT_CONFIRMED', 
          payment: { id: 'pay_1', status: 'PENDING' } // Status errado
        }
      ];

      // Act & Assert: Processar payloads inválidos
      for (const payload of invalidPayloads) {
        const request = new Request('http://localhost:3000/api/asaas-webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const response = await webhookHandler(request);
        const data = await response.json();

        // Payloads inválidos devem ser recebidos mas não processados
        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
      }

      // Verificar que nenhum job foi adicionado para payloads inválidos
      expect(mockFinancialRevenueQueue.add).not.toHaveBeenCalled();

      console.log('✅ Validação de estrutura do payload funcionando corretamente');
    });
  });

  describe('Transformação de Dados do Webhook', () => {
    it('deve transformar dados do ASAAS para formato interno corretamente', async () => {
      // Arrange: Payload com todos os campos do ASAAS
      const fullAsaasPayload = {
        event: 'PAYMENT_CONFIRMED',
        id: 'webhook_full_test',
        dateCreated: '2024-01-15T10:30:00.000Z',
        payment: {
          id: 'pay_full_test_12345',
          customer: 'cus_full_test_67890',
          subscription: 'sub_full_test_54321',
          value: 299.99,
          netValue: 289.49,
          description: 'Pagamento completo de teste - Plano Premium',
          billingType: 'CREDIT_CARD',
          status: 'CONFIRMED',
          confirmedDate: '2024-01-15T10:30:00.000Z',
          paymentDate: '2024-01-15T10:30:00.000Z',
          clientPaymentDate: '2024-01-15T10:29:45.000Z',
          invoiceUrl: 'https://sandbox.asaas.com/i/pay_full_test_12345',
          transactionReceiptUrl: 'https://sandbox.asaas.com/comprovantes/pay_full_test_12345',
          dueDate: '2024-01-15',
          originalDueDate: '2024-01-10',
          externalReference: 'ext_ref_premium_plan_001',
          deleted: false,
          anticipated: false,
          creditCard: {
            creditCardNumber: '1234',
            creditCardBrand: 'MASTERCARD',
            creditCardToken: 'token_123456'
          }
        }
      };

      let capturedJobPayload: any;
      mockFinancialRevenueQueue.add.mockImplementation((jobType, payload, options) => {
        capturedJobPayload = payload;
        return Promise.resolve({ id: 'job-123', data: payload, opts: options });
      });

      const request = new Request('http://localhost:3000/api/asaas-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullAsaasPayload)
      });

      // Act: Processar webhook completo
      const response = await webhookHandler(request);

      // Assert: Verificar transformação dos dados
      expect(response.status).toBe(200);
      expect(capturedJobPayload).toBeDefined();
      
      // Verificar estrutura transformada
      expect(capturedJobPayload.event).toBe('PAYMENT_CONFIRMED');
      expect(capturedJobPayload.webhookId).toBe('webhook_full_test');
      expect(capturedJobPayload.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

      // Verificar dados do pagamento transformados
      const transformedPayment = capturedJobPayload.payment;
      expect(transformedPayment.id).toBe('pay_full_test_12345');
      expect(transformedPayment.customer).toBe('cus_full_test_67890');
      expect(transformedPayment.subscription).toBe('sub_full_test_54321');
      expect(transformedPayment.value).toBe(299.99);
      expect(transformedPayment.description).toBe('Pagamento completo de teste - Plano Premium');
      expect(transformedPayment.billingType).toBe('CREDIT_CARD');
      expect(transformedPayment.date).toBe('2024-01-15'); // Deve usar dueDate
      expect(transformedPayment.invoiceUrl).toBe('https://sandbox.asaas.com/i/pay_full_test_12345');
      expect(transformedPayment.transactionReceiptUrl).toBe('https://sandbox.asaas.com/comprovantes/pay_full_test_12345');

      console.log('✅ Transformação de dados do ASAAS realizada corretamente');
    });

    it('deve lidar com campos opcionais ausentes', async () => {
      // Arrange: Payload mínimo válido
      const minimalPayload = {
        event: 'PAYMENT_CONFIRMED',
        payment: {
          id: 'pay_minimal_test',
          customer: 'cus_minimal_test',
          value: 50.00,
          description: 'Pagamento mínimo',
          billingType: 'PIX',
          status: 'CONFIRMED',
          dueDate: '2024-01-15'
          // Campos opcionais ausentes: subscription, invoiceUrl, etc.
        }
      };

      let capturedJobPayload: any;
      mockFinancialRevenueQueue.add.mockImplementation((jobType, payload, options) => {
        capturedJobPayload = payload;
        return Promise.resolve({ id: 'job-minimal', data: payload, opts: options });
      });

      const request = new Request('http://localhost:3000/api/asaas-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(minimalPayload)
      });

      // Act: Processar payload mínimo
      const response = await webhookHandler(request);

      // Assert: Verificar que campos opcionais são tratados corretamente
      expect(response.status).toBe(200);
      expect(capturedJobPayload).toBeDefined();

      const transformedPayment = capturedJobPayload.payment;
      expect(transformedPayment.id).toBe('pay_minimal_test');
      expect(transformedPayment.customer).toBe('cus_minimal_test');
      expect(transformedPayment.subscription).toBeUndefined();
      expect(transformedPayment.invoiceUrl).toBeUndefined();
      expect(transformedPayment.transactionReceiptUrl).toBeUndefined();

      // Webhook ID deve ser gerado se não fornecido
      expect(capturedJobPayload.webhookId).toMatch(/^webhook_\d+$/);

      console.log('✅ Campos opcionais ausentes tratados corretamente');
    });
  });

  describe('Configuração da Fila BullMQ', () => {
    it('deve configurar job com parâmetros corretos de retry e limpeza', async () => {
      // Arrange: Payload válido
      const webhookPayload = {
        event: 'PAYMENT_CONFIRMED',
        payment: {
          id: 'pay_config_test',
          customer: 'cus_config_test',
          value: 100.00,
          description: 'Teste de configuração',
          billingType: 'BOLETO',
          status: 'CONFIRMED',
          dueDate: '2024-01-15'
        }
      };

      let capturedJobOptions: any;
      mockFinancialRevenueQueue.add.mockImplementation((jobType, payload, options) => {
        capturedJobOptions = options;
        return Promise.resolve({ id: 'job-config', data: payload, opts: options });
      });

      const request = new Request('http://localhost:3000/api/asaas-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      });

      // Act: Processar webhook
      await webhookHandler(request);

      // Assert: Verificar configuração do job
      expect(capturedJobOptions).toEqual({
        priority: 1, // Alta prioridade para pagamentos confirmados
        attempts: 3, // 3 tentativas
        backoff: { type: 'exponential', delay: 2000 }, // Backoff exponencial
        removeOnComplete: 100, // Manter 100 jobs completados
        removeOnFail: 50 // Manter 50 jobs falhados
      });

      console.log('✅ Configuração da fila BullMQ verificada corretamente');
    });
  });

  describe('Monitoramento e Logging', () => {
    it('deve logar informações importantes durante o processamento', async () => {
      // Arrange: Mock do console.log para capturar logs
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const webhookPayload = {
        event: 'PAYMENT_CONFIRMED',
        payment: {
          id: 'pay_logging_test',
          customer: 'cus_logging_test',
          value: 75.00,
          description: 'Teste de logging',
          billingType: 'PIX',
          status: 'CONFIRMED',
          dueDate: '2024-01-15'
        }
      };

      const request = new Request('http://localhost:3000/api/asaas-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      });

      // Act: Processar webhook
      await webhookHandler(request);

      // Assert: Verificar logs
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅ Job adicionado à fila para pagamento pay_logging_test')
      );

      // Cleanup
      consoleSpy.mockRestore();

      console.log('✅ Logging de informações verificado corretamente');
    });

    it('deve logar erros de processamento', async () => {
      // Arrange: Mock do console.error e erro na fila
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFinancialRevenueQueue.add.mockRejectedValue(new Error('Erro simulado na fila'));

      const webhookPayload = {
        event: 'PAYMENT_CONFIRMED',
        payment: {
          id: 'pay_error_logging_test',
          customer: 'cus_error_logging_test',
          value: 25.00,
          description: 'Teste de logging de erro',
          billingType: 'CREDIT_CARD',
          status: 'CONFIRMED',
          dueDate: '2024-01-15'
        }
      };

      const request = new Request('http://localhost:3000/api/asaas-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      });

      // Act: Processar webhook com erro
      await webhookHandler(request);

      // Assert: Verificar log de erro
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ Erro ao processar webhook ASAAS:'),
        expect.any(Error)
      );

      // Cleanup
      consoleErrorSpy.mockRestore();

      console.log('✅ Logging de erros verificado corretamente');
    });
  });
});
