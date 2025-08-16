/**
 * Testes de Pagamentos - ASAAS Webhook
 * 
 * Objetivo: Validar o processamento dos webhooks do ASAAS.
 * 
 * Cenários testados:
 * 1. Assinatura Inválida: Testa se a rota retorna HTTP 401 para assinaturas inválidas
 * 2. Eventos Válidos: Testa se eventos de pagamento são processados corretamente
 * 3. Logs de Auditoria: Testa se todos os webhooks são registrados no sistema de logs
 */

import { NextRequest, NextResponse } from 'next/server'
import { POST, GET } from '@/api/asaas/webhook/route'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}))

// Mock environment variables
const originalEnv = process.env

describe('ASAAS Webhook Route', () => {
  let mockSupabase: any
  let mockRequest: NextRequest

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv }
    process.env.ASAAS_WEBHOOK_SECRET = 'test-webhook-secret'
    process.env.ASAAS_API_KEY = 'test-api-key'
    
    // Reset all mocks
    jest.clearAllMocks()
    
    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    }
    
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
    
    // Mock request
    mockRequest = {
      headers: new Map([
        ['asaas-access-token', 'test-access-token']
      ]),
      json: jest.fn(),
    } as any
  })

  afterEach(() => {
    // Restore environment variables
    process.env = originalEnv
  })

  describe('GET - Health Check', () => {
    it('deve retornar status 200 para verificação de saúde', async () => {
      // Act: Chamar GET endpoint
      const response = await GET()

      // Assert: Verificar resposta de sucesso
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual({ status: 'OK', message: 'ASAAS Webhook endpoint ativo' })
    })
  })

  describe('POST - Processamento de Webhook', () => {
    describe('Validação de Assinatura', () => {
      it('deve retornar HTTP 401 para assinatura inválida', async () => {
        // Arrange: Criar payload e assinatura inválida
        const payload = {
          event: 'PAYMENT_CONFIRMED',
          payment: {
            id: 'pay_123',
            status: 'CONFIRMED',
            value: 100.00
          }
        }

        const invalidSignature = 'assinatura-invalida'
        
        mockRequest.headers.set('asaas-signature', invalidSignature)
        mockRequest.json = jest.fn().mockResolvedValue(payload)

        // Act: Chamar POST endpoint
        const response = await POST(mockRequest)

        // Assert: Verificar que retornou erro de autenticação
        expect(response.status).toBe(401)
        const data = await response.json()
        expect(data.error).toContain('Assinatura inválida')
        
        // Verificar que o evento não foi processado
        expect(mockSupabase.insert).not.toHaveBeenCalled()
      })

      it('deve retornar HTTP 401 quando assinatura está ausente', async () => {
        // Arrange: Criar payload sem assinatura
        const payload = {
          event: 'PAYMENT_CONFIRMED',
          payment: {
            id: 'pay_123',
            status: 'CONFIRMED',
            value: 100.00
          }
        }

        mockRequest.json = jest.fn().mockResolvedValue(payload)
        // Não definir asaas-signature header

        // Act: Chamar POST endpoint
        const response = await POST(mockRequest)

        // Assert: Verificar que retornou erro de autenticação
        expect(response.status).toBe(401)
        const data = await response.json()
        expect(data.error).toContain('Assinatura ausente')
      })

      it('deve aceitar assinatura válida', async () => {
        // Arrange: Criar payload e assinatura válida
        const payload = {
          event: 'PAYMENT_CONFIRMED',
          payment: {
            id: 'pay_123',
            status: 'CONFIRMED',
            value: 100.00
          }
        }

        const payloadString = JSON.stringify(payload)
        const validSignature = crypto
          .createHmac('sha256', 'test-webhook-secret')
          .update(payloadString)
          .digest('hex')

        mockRequest.headers.set('asaas-signature', validSignature)
        mockRequest.json = jest.fn().mockResolvedValue(payload)

        // Mock de inserção bem-sucedida para webhook_logs
        mockSupabase.insert.mockResolvedValue({
          data: { id: 'log-123' },
          error: null
        })

        // Mock de atualização bem-sucedida para appointments
        mockSupabase.update.mockResolvedValue({
          data: { id: 'appointment-123' },
          error: null
        })

        // Act: Chamar POST endpoint
        const response = await POST(mockRequest)

        // Assert: Verificar que retornou sucesso
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.message).toContain('Webhook processado com sucesso')
      })
    })

    describe('Processamento de Eventos', () => {
      it('deve processar evento PAYMENT_CONFIRMED e atualizar status de pagamento', async () => {
        // Arrange: Criar payload de pagamento confirmado
        const payload = {
          event: 'PAYMENT_CONFIRMED',
          payment: {
            id: 'pay_123',
            status: 'CONFIRMED',
            value: 150.00,
            dueDate: '2024-12-25',
            customer: 'cus_456',
            subscription: null
          }
        }

        const payloadString = JSON.stringify(payload)
        const validSignature = crypto
          .createHmac('sha256', 'test-webhook-secret')
          .update(payloadString)
          .digest('hex')

        mockRequest.headers.set('asaas-signature', validSignature)
        mockRequest.json = jest.fn().mockResolvedValue(payload)

        // Mock de inserção bem-sucedida para webhook_logs
        mockSupabase.insert.mockResolvedValue({
          data: { id: 'log-123' },
          error: null
        })

        // Mock de busca de agendamento
        mockSupabase.select.mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{
              id: 'appointment-123',
              clientId: 'client-123',
              professionalId: 'prof-123',
              serviceId: 'service-123',
              startTime: '2024-12-25T10:00:00Z',
              endTime: '2024-12-25T11:00:00Z',
              status: 'agendado',
              paymentStatus: 'pending'
            }],
            error: null
          })
        })

        // Mock de atualização bem-sucedida
        mockSupabase.update.mockResolvedValue({
          data: { id: 'appointment-123' },
          error: null
        })

        // Act: Chamar POST endpoint
        const response = await POST(mockRequest)

        // Assert: Verificar que retornou sucesso
        expect(response.status).toBe(200)
        
        // Verificar que o webhook foi logado
        expect(mockSupabase.insert).toHaveBeenCalledWith({
          event: 'PAYMENT_CONFIRMED',
          payload: payload,
          signature: validSignature,
          processed: true,
          processedAt: expect.any(String)
        })

        // Verificar que o status do agendamento foi atualizado
        expect(mockSupabase.update).toHaveBeenCalledWith({
          paymentStatus: 'confirmed',
          status: 'confirmado',
          updatedAt: expect.any(String)
        })
      })

      it('deve processar evento PAYMENT_RECEIVED', async () => {
        // Arrange: Criar payload de pagamento recebido
        const payload = {
          event: 'PAYMENT_RECEIVED',
          payment: {
            id: 'pay_124',
            status: 'RECEIVED',
            value: 200.00,
            dueDate: '2024-12-26',
            customer: 'cus_789',
            subscription: null
          }
        }

        const payloadString = JSON.stringify(payload)
        const validSignature = crypto
          .createHmac('sha256', 'test-webhook-secret')
          .update(payloadString)
          .digest('hex')

        mockRequest.headers.set('asaas-signature', validSignature)
        mockRequest.json = jest.fn().mockResolvedValue(payload)

        // Mock de inserção bem-sucedida para webhook_logs
        mockSupabase.insert.mockResolvedValue({
          data: { id: 'log-124' },
          error: null
        })

        // Mock de busca de agendamento
        mockSupabase.select.mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{
              id: 'appointment-124',
              clientId: 'client-789',
              professionalId: 'prof-123',
              serviceId: 'service-123',
              startTime: '2024-12-26T14:00:00Z',
              endTime: '2024-12-26T15:00:00Z',
              status: 'agendado',
              paymentStatus: 'pending'
            }],
            error: null
          })
        })

        // Mock de atualização bem-sucedida
        mockSupabase.update.mockResolvedValue({
          data: { id: 'appointment-124' },
          error: null
        })

        // Act: Chamar POST endpoint
        const response = await POST(mockRequest)

        // Assert: Verificar que retornou sucesso
        expect(response.status).toBe(200)
        
        // Verificar que o status do agendamento foi atualizado
        expect(mockSupabase.update).toHaveBeenCalledWith({
          paymentStatus: 'received',
          updatedAt: expect.any(String)
        })
      })

      it('deve processar evento de assinatura SUBSCRIPTION_CREATED', async () => {
        // Arrange: Criar payload de assinatura criada
        const payload = {
          event: 'SUBSCRIPTION_CREATED',
          subscription: {
            id: 'sub_123',
            status: 'ACTIVE',
            value: 99.90,
            customer: 'cus_456',
            billingType: 'CREDIT_CARD'
          }
        }

        const payloadString = JSON.stringify(payload)
        const validSignature = crypto
          .createHmac('sha256', 'test-webhook-secret')
          .update(payloadString)
          .digest('hex')

        mockRequest.headers.set('asaas-signature', validSignature)
        mockRequest.json = jest.fn().mockResolvedValue(payload)

        // Mock de inserção bem-sucedida para webhook_logs
        mockSupabase.insert.mockResolvedValue({
          data: { id: 'log-125' },
          error: null
        })

        // Mock de inserção bem-sucedida para subscriptions
        mockSupabase.insert.mockResolvedValue({
          data: { id: 'subscription-123' },
          error: null
        })

        // Act: Chamar POST endpoint
        const response = await POST(mockRequest)

        // Assert: Verificar que retornou sucesso
        expect(response.status).toBe(200)
        
        // Verificar que a assinatura foi criada
        expect(mockSupabase.insert).toHaveBeenCalledWith({
          asaasId: 'sub_123',
          status: 'ACTIVE',
          value: 99.90,
          customerId: 'cus_456',
          billingType: 'CREDIT_CARD',
          createdAt: expect.any(String)
        })
      })
    })

    describe('Logs de Auditoria', () => {
      it('deve registrar todos os webhooks recebidos, independentemente do resultado', async () => {
        // Arrange: Criar payload com assinatura inválida (que causará erro)
        const payload = {
          event: 'PAYMENT_CONFIRMED',
          payment: {
            id: 'pay_125',
            status: 'CONFIRMED',
            value: 100.00
          }
        }

        const invalidSignature = 'assinatura-invalida'
        
        mockRequest.headers.set('asaas-signature', invalidSignature)
        mockRequest.json = jest.fn().mockResolvedValue(payload)

        // Mock de inserção bem-sucedida para webhook_logs
        mockSupabase.insert.mockResolvedValue({
          data: { id: 'log-126' },
          error: null
        })

        // Act: Chamar POST endpoint
        const response = await POST(mockRequest)

        // Assert: Verificar que retornou erro de autenticação
        expect(response.status).toBe(401)
        
        // Verificar que o webhook foi logado mesmo com erro
        expect(mockSupabase.insert).toHaveBeenCalledWith({
          event: 'PAYMENT_CONFIRMED',
          payload: payload,
          signature: invalidSignature,
          processed: false,
          processedAt: null,
          error: expect.stringContaining('Assinatura inválida')
        })
      })

      it('deve registrar webhook com erro quando falha no processamento', async () => {
        // Arrange: Criar payload válido mas com erro no processamento
        const payload = {
          event: 'PAYMENT_CONFIRMED',
          payment: {
            id: 'pay_126',
            status: 'CONFIRMED',
            value: 100.00
          }
        }

        const payloadString = JSON.stringify(payload)
        const validSignature = crypto
          .createHmac('sha256', 'test-webhook-secret')
          .update(payloadString)
          .digest('hex')

        mockRequest.headers.set('asaas-signature', validSignature)
        mockRequest.json = jest.fn().mockResolvedValue(payload)

        // Mock de inserção bem-sucedida para webhook_logs
        mockSupabase.insert.mockResolvedValue({
          data: { id: 'log-127' },
          error: null
        })

        // Mock de erro na busca de agendamento
        mockSupabase.select.mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Erro de conexão com banco' }
          })
        })

        // Act: Chamar POST endpoint
        const response = await POST(mockRequest)

        // Assert: Verificar que retornou erro de processamento
        expect(response.status).toBe(500)
        
        // Verificar que o webhook foi logado com erro
        expect(mockSupabase.insert).toHaveBeenCalledWith({
          event: 'PAYMENT_CONFIRMED',
          payload: payload,
          signature: validSignature,
          processed: false,
          processedAt: null,
          error: expect.stringContaining('Erro ao processar evento')
        })
      })
    })

    describe('Tratamento de Erros', () => {
      it('deve retornar HTTP 400 para payload inválido', async () => {
        // Arrange: Criar payload inválido
        const invalidPayload = 'payload-invalido-json'
        
        mockRequest.json = jest.fn().mockRejectedValue(new Error('JSON inválido'))

        // Act: Chamar POST endpoint
        const response = await POST(mockRequest)

        // Assert: Verificar que retornou erro de payload inválido
        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toContain('Payload inválido')
      })

      it('deve retornar HTTP 500 para erro interno do servidor', async () => {
        // Arrange: Criar payload válido mas com erro no Supabase
        const payload = {
          event: 'PAYMENT_CONFIRMED',
          payment: {
            id: 'pay_127',
            status: 'CONFIRMED',
            value: 100.00
          }
        }

        const payloadString = JSON.stringify(payload)
        const validSignature = crypto
          .createHmac('sha256', 'test-webhook-secret')
          .update(payloadString)
          .digest('hex')

        mockRequest.headers.set('asaas-signature', validSignature)
        mockRequest.json = jest.fn().mockResolvedValue(payload)

        // Mock de erro na inserção de logs
        mockSupabase.insert.mockResolvedValue({
          data: null,
          error: { message: 'Erro de banco de dados' }
        })

        // Act: Chamar POST endpoint
        const response = await POST(mockRequest)

        // Assert: Verificar que retornou erro interno
        expect(response.status).toBe(500)
        const data = await response.json()
        expect(data.error).toContain('Erro interno do servidor')
      })
    })
  })
})
