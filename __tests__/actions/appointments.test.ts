/**
 * Testes de Agendamentos
 * 
 * Objetivo: Garantir que o sistema de agendamentos lida corretamente com conflitos e validações.
 * 
 * Cenários testados:
 * 1. Validação de Dados: Testa se a função retorna erro ao receber dados inválidos
 * 2. Conflito de Horário: Testa se a função retorna erro de conflito para horários ocupados
 * 3. Sucesso: Testa criação bem-sucedida de agendamento e revalidação de cache
 */

import { createAppointment, checkConflicts } from '@/actions/appointments'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}))

// Mock Next.js cache
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

// Mock Google Calendar sync functions
jest.mock('@/actions/calendar-sync', () => ({
  createGoogleCalendarEvent: jest.fn(),
}))

describe('createAppointment', () => {
  let mockSupabase: any
  let mockRevalidatePath: jest.MockedFunction<typeof revalidatePath>

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
    
    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
    }
    
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
    
    // Mock revalidatePath
    mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>
  })

  describe('Validação de Dados', () => {
    it('deve retornar erro ao receber dados inválidos (data no passado)', async () => {
      // Arrange: Criar FormData com data no passado
      const formData = new FormData()
      formData.append('clientId', 'client-123')
      formData.append('professionalId', 'prof-123')
      formData.append('serviceId', 'service-123')
      formData.append('startTime', '2023-01-01T10:00:00Z') // Data no passado
      formData.append('endTime', '2023-01-01T11:00:00Z')
      formData.append('unidadeId', 'unit-123')

      // Act: Chamar createAppointment
      const result = await createAppointment(formData, 'user-123')

      // Assert: Verificar que retornou erro de validação
      expect(result.success).toBe(false)
      expect(result.error).toContain('Data de início deve ser no futuro')
      expect(mockSupabase.insert).not.toHaveBeenCalled()
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('deve retornar erro ao receber campos obrigatórios ausentes', async () => {
      // Arrange: Criar FormData sem campos obrigatórios
      const formData = new FormData()
      formData.append('clientId', 'client-123')
      // Faltando: professionalId, serviceId, startTime, endTime, unidadeId

      // Act: Chamar createAppointment
      const result = await createAppointment(formData, 'user-123')

      // Assert: Verificar que retornou erro de validação
      expect(result.success).toBe(false)
      expect(result.error).toContain('Campos obrigatórios')
      expect(mockSupabase.insert).not.toHaveBeenCalled()
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('deve retornar erro quando endTime é anterior a startTime', async () => {
      // Arrange: Criar FormData com horário de fim anterior ao início
      const formData = new FormData()
      formData.append('clientId', 'client-123')
      formData.append('professionalId', 'prof-123')
      formData.append('serviceId', 'service-123')
      formData.append('startTime', '2024-12-25T10:00:00Z')
      formData.append('endTime', '2024-12-25T09:00:00Z') // Antes do startTime
      formData.append('unidadeId', 'unit-123')

      // Act: Chamar createAppointment
      const result = await createAppointment(formData, 'user-123')

      // Assert: Verificar que retornou erro de validação
      expect(result.success).toBe(false)
      expect(result.error).toContain('Horário de fim deve ser posterior ao início')
      expect(mockSupabase.insert).not.toHaveBeenCalled()
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })
  })

  describe('Conflito de Horário', () => {
    it('deve retornar erro ao tentar agendar horário já ocupado por outro agendamento', async () => {
      // Arrange: Mock de conflito existente
      const mockConflictData = [
        {
          id: 'appointment-123',
          startTime: '2024-12-25T10:00:00Z',
          endTime: '2024-12-25T11:00:00Z',
          status: 'agendado',
          client: [{ name: 'João Silva' }],
          type: 'appointment'
        }
      ]

      mockSupabase.select.mockReturnValue({
        gte: jest.fn().mockReturnValue({
          lte: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockConflictData,
                error: null
              })
            })
          })
        })
      })

      const formData = new FormData()
      formData.append('clientId', 'client-456')
      formData.append('professionalId', 'prof-123')
      formData.append('serviceId', 'service-123')
      formData.append('startTime', '2024-12-25T10:30:00Z') // Sobreposição
      formData.append('endTime', '2024-12-25T11:30:00Z')
      formData.append('unidadeId', 'unit-123')

      // Act: Chamar createAppointment
      const result = await createAppointment(formData, 'user-123')

      // Assert: Verificar que retornou erro de conflito
      expect(result.success).toBe(false)
      expect(result.error).toContain('Horário indisponível devido a conflito')
      expect(mockSupabase.insert).not.toHaveBeenCalled()
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('deve retornar erro ao tentar agendar horário bloqueado', async () => {
      // Arrange: Mock de horário bloqueado
      const mockBlockedData = [
        {
          id: 'block-123',
          startTime: '2024-12-25T12:00:00Z',
          endTime: '2024-12-25T13:00:00Z',
          reason: 'Almoço',
          professional: [{ name: 'Dr. Silva' }],
          type: 'block'
        }
      ]

      mockSupabase.select.mockReturnValue({
        gte: jest.fn().mockReturnValue({
          lte: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockBlockedData,
                error: null
              })
            })
          })
        })
      })

      const formData = new FormData()
      formData.append('clientId', 'client-789')
      formData.append('professionalId', 'prof-123')
      formData.append('serviceId', 'service-123')
      formData.append('startTime', '2024-12-25T12:30:00Z') // Sobreposição com bloqueio
      formData.append('endTime', '2024-12-25T13:30:00Z')
      formData.append('unidadeId', 'unit-123')

      // Act: Chamar createAppointment
      const result = await createAppointment(formData, 'user-123')

      // Assert: Verificar que retornou erro de conflito
      expect(result.success).toBe(false)
      expect(result.error).toContain('Horário indisponível devido a conflito')
      expect(mockSupabase.insert).not.toHaveBeenCalled()
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })
  })

  describe('Sucesso', () => {
    it('deve criar agendamento com sucesso e revalidar cache quando não há conflitos', async () => {
      // Arrange: Mock sem conflitos
      mockSupabase.select.mockReturnValue({
        gte: jest.fn().mockReturnValue({
          lte: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [], // Sem conflitos
                error: null
              })
            })
          })
        })
      })

      // Mock de inserção bem-sucedida
      const mockNewAppointment = {
        id: 'new-appointment-123',
        clientId: 'client-123',
        professionalId: 'prof-123',
        serviceId: 'service-123',
        startTime: '2024-12-25T14:00:00Z',
        endTime: '2024-12-25T15:00:00Z',
        status: 'agendado',
        unidadeId: 'unit-123',
        createdAt: '2024-12-24T10:00:00Z',
        updatedAt: '2024-12-24T10:00:00Z'
      }

      mockSupabase.insert.mockResolvedValue({
        data: mockNewAppointment,
        error: null
      })

      const formData = new FormData()
      formData.append('clientId', 'client-123')
      formData.append('professionalId', 'prof-123')
      formData.append('serviceId', 'service-123')
      formData.append('startTime', '2024-12-25T14:00:00Z')
      formData.append('endTime', '2024-12-25T15:00:00Z')
      formData.append('unidadeId', 'unit-123')

      // Act: Chamar createAppointment
      const result = await createAppointment(formData, 'user-123')

      // Assert: Verificar sucesso
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockNewAppointment)
      
      // Verificar que foi inserido no banco
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        clientId: 'client-123',
        professionalId: 'prof-123',
        serviceId: 'service-123',
        startTime: '2024-12-25T14:00:00Z',
        endTime: '2024-12-25T15:00:00Z',
        status: 'agendado',
        unidadeId: 'unit-123',
        notes: undefined
      })
      
      // Verificar que o cache foi revalidado
      expect(mockRevalidatePath).toHaveBeenCalledWith('/appointments')
    })

    it('deve lidar com erro de banco de dados graciosamente', async () => {
      // Arrange: Mock sem conflitos mas com erro na inserção
      mockSupabase.select.mockReturnValue({
        gte: jest.fn().mockReturnValue({
          lte: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [], // Sem conflitos
                error: null
              })
            })
          })
        })
      })

      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: { message: 'Erro de conexão com banco' }
      })

      const formData = new FormData()
      formData.append('clientId', 'client-123')
      formData.append('professionalId', 'prof-123')
      formData.append('serviceId', 'service-123')
      formData.append('startTime', '2024-12-25T16:00:00Z')
      formData.append('endTime', '2024-12-25T17:00:00Z')
      formData.append('unidadeId', 'unit-123')

      // Act: Chamar createAppointment
      const result = await createAppointment(formData, 'user-123')

      // Assert: Verificar que retornou erro
      expect(result.success).toBe(false)
      expect(result.error).toContain('Erro ao criar agendamento')
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })
  })
})

describe('checkConflicts', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    }
    
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  it('deve retornar sucesso quando não há conflitos', async () => {
    // Arrange: Mock sem conflitos
    mockSupabase.select.mockReturnValue({
      gte: jest.fn().mockReturnValue({
        lte: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [], // Sem conflitos
              error: null
            })
          })
        })
      })
    })

    const formData = new FormData()
    formData.append('startTime', '2024-12-25T18:00:00Z')
    formData.append('endTime', '2024-12-25T19:00:00Z')

    // Act: Chamar checkConflicts
    const result = await checkConflicts(formData)

    // Assert: Verificar que retornou sucesso
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ isAvailable: true })
  })

  it('deve retornar erro quando há conflitos', async () => {
    // Arrange: Mock com conflitos
    const mockConflictData = [
      {
        id: 'appointment-123',
        startTime: '2024-12-25T18:00:00Z',
        endTime: '2024-12-25T19:00:00Z',
        status: 'agendado',
        client: [{ name: 'João Silva' }],
        type: 'appointment'
      }
    ]

    mockSupabase.select.mockReturnValue({
      gte: jest.fn().mockReturnValue({
        lte: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockConflictData,
              error: null
            })
          })
        })
      })
    })

    const formData = new FormData()
    formData.append('startTime', '2024-12-25T18:30:00Z')
    formData.append('endTime', '2024-12-25T19:30:00Z')

    // Act: Chamar checkConflicts
    const result = await checkConflicts(formData)

    // Assert: Verificar que retornou erro de conflito
    expect(result.success).toBe(false)
    expect(result.error).toContain('Horário indisponível devido a conflito')
    expect(result.data).toEqual({
      conflicts: expect.arrayContaining([
        expect.objectContaining({
          type: 'appointment',
          id: 'appointment-123'
        })
      ])
    })
  })
})
