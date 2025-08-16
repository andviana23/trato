/**
 * Testes de Fila de Atendimento
 * 
 * Objetivo: Garantir que a fila de atendimento se reorganiza de forma correta.
 * 
 * Cenários testados:
 * 1. Passar a Vez: Testa se cliente é movido para última posição mantendo ordem dos outros
 * 2. Reorganização Manual: Testa se nova ordem de IDs é refletida no banco de dados
 */

import { passaTurn, reorganizeQueue, addToQueue, getQueueStatus } from '@/actions/queue'
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

describe('Queue Actions', () => {
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
      gte: jest.fn().mockReturnValue({
        lte: jest.fn().mockReturnThis()
      }),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
      in: jest.fn().mockReturnThis(),
    }
    
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
    
    // Mock revalidatePath
    mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>
  })

  describe('passaTurn', () => {
    it('deve mover cliente para última posição da fila mantendo ordem dos outros', async () => {
      // Arrange: Mock de fila existente
      const mockQueueItems = [
        { id: 'queue-1', clientId: 'client-1', position: 1, status: 'em espera', createdAt: '2024-12-24T10:00:00Z' },
        { id: 'queue-2', clientId: 'client-2', position: 2, status: 'em espera', createdAt: '2024-12-24T10:01:00Z' },
        { id: 'queue-3', clientId: 'client-3', position: 3, status: 'em espera', createdAt: '2024-12-24T10:02:00Z' },
        { id: 'queue-4', clientId: 'client-4', position: 4, status: 'em espera', createdAt: '2024-12-24T10:03:00Z' }
      ]

      // Mock de busca da fila atual
      mockSupabase.select.mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: mockQueueItems,
          error: null
        })
      })

      // Mock de atualização bem-sucedida
      mockSupabase.update.mockResolvedValue({
        data: { id: 'queue-2' },
        error: null
      })

      const formData = new FormData()
      formData.append('queueId', 'queue-2')

      // Act: Chamar passaTurn
      const result = await passaTurn(formData)

      // Assert: Verificar que retornou sucesso
      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        message: 'Cliente passou a vez com sucesso',
        newPosition: 4,
        previousPosition: 2
      })
      
      // Verificar que o cliente foi movido para a última posição
      expect(mockSupabase.update).toHaveBeenCalledWith({
        position: 4,
        updatedAt: expect.any(String)
      })
      
      // Verificar que o cache foi revalidado
      expect(mockRevalidatePath).toHaveBeenCalledWith('/queue')
    })

    it('deve lidar com cliente que já está na última posição', async () => {
      // Arrange: Mock de fila onde o cliente já está na última posição
      const mockQueueItems = [
        { id: 'queue-1', clientId: 'client-1', position: 1, status: 'em espera', createdAt: '2024-12-24T10:00:00Z' },
        { id: 'queue-2', clientId: 'client-2', position: 2, status: 'em espera', createdAt: '2024-12-24T10:01:00Z' },
        { id: 'queue-3', clientId: 'client-3', position: 3, status: 'em espera', createdAt: '2024-12-24T10:02:00Z' }
      ]

      mockSupabase.select.mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: mockQueueItems,
          error: null
        })
      })

      const formData = new FormData()
      formData.append('queueId', 'queue-3') // Cliente já na última posição

      // Act: Chamar passaTurn
      const result = await passaTurn(formData)

      // Assert: Verificar que retornou sucesso mas não alterou posição
      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        message: 'Cliente já está na última posição da fila',
        position: 3
      })
      
      // Verificar que não foi feita atualização no banco
      expect(mockSupabase.update).not.toHaveBeenCalled()
      
      // Verificar que o cache foi revalidado mesmo assim
      expect(mockRevalidatePath).toHaveBeenCalledWith('/queue')
    })

    it('deve retornar erro quando cliente não é encontrado na fila', async () => {
      // Arrange: Mock de fila vazia
      mockSupabase.select.mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })

      const formData = new FormData()
      formData.append('queueId', 'queue-inexistente')

      // Act: Chamar passaTurn
      const result = await passaTurn(formData)

      // Assert: Verificar que retornou erro
      expect(result.success).toBe(false)
      expect(result.error).toContain('Cliente não encontrado na fila')
      
      // Verificar que não foi feita atualização no banco
      expect(mockSupabase.update).not.toHaveBeenCalled()
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('deve retornar erro quando há falha na atualização', async () => {
      // Arrange: Mock de fila existente mas com erro na atualização
      const mockQueueItems = [
        { id: 'queue-1', clientId: 'client-1', position: 1, status: 'em espera', createdAt: '2024-12-24T10:00:00Z' },
        { id: 'queue-2', clientId: 'client-2', position: 2, status: 'em espera', createdAt: '2024-12-24T10:01:00Z' }
      ]

      mockSupabase.select.mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: mockQueueItems,
          error: null
        })
      })

      mockSupabase.update.mockResolvedValue({
        data: null,
        error: { message: 'Erro de conexão com banco' }
      })

      const formData = new FormData()
      formData.append('queueId', 'queue-2')

      // Act: Chamar passaTurn
      const result = await passaTurn(formData)

      // Assert: Verificar que retornou erro
      expect(result.success).toBe(false)
      expect(result.error).toContain('Erro ao passar a vez')
      
      // Verificar que o cache não foi revalidado
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })
  })

  describe('reorganizeQueue', () => {
    it('deve reorganizar fila com nova ordem de IDs e refletir no banco', async () => {
      // Arrange: Mock de nova ordem de IDs
      const newOrder = ['queue-3', 'queue-1', 'queue-2', 'queue-4']

      // Mock de atualizações bem-sucedidas
      mockSupabase.update.mockResolvedValue({
        data: { id: 'queue-3' },
        error: null
      })

      const formData = new FormData()
      formData.append('queueIds', JSON.stringify(newOrder))

      // Act: Chamar reorganizeQueue
      const result = await reorganizeQueue(formData)

      // Assert: Verificar que retornou sucesso
      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        message: 'Fila reorganizada com sucesso',
        newOrder: newOrder,
        updatedItems: 4
      })
      
      // Verificar que cada item foi atualizado com a nova posição
      expect(mockSupabase.update).toHaveBeenCalledTimes(4)
      
      // Verificar as chamadas de atualização
      expect(mockSupabase.update).toHaveBeenNthCalledWith(1, {
        position: 1,
        updatedAt: expect.any(String)
      })
      expect(mockSupabase.update).toHaveBeenNthCalledWith(2, {
        position: 2,
        updatedAt: expect.any(String)
      })
      expect(mockSupabase.update).toHaveBeenNthCalledWith(3, {
        position: 3,
        updatedAt: expect.any(String)
      })
      expect(mockSupabase.update).toHaveBeenNthCalledWith(4, {
        position: 4,
        updatedAt: expect.any(String)
      })
      
      // Verificar que o cache foi revalidado
      expect(mockRevalidatePath).toHaveBeenCalledWith('/queue')
    })

    it('deve reorganizar fila com apenas um item', async () => {
      // Arrange: Mock de fila com apenas um item
      const newOrder = ['queue-1']

      mockSupabase.update.mockResolvedValue({
        data: { id: 'queue-1' },
        error: null
      })

      const formData = new FormData()
      formData.append('queueIds', JSON.stringify(newOrder))

      // Act: Chamar reorganizeQueue
      const result = await reorganizeQueue(formData)

      // Assert: Verificar que retornou sucesso
      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        message: 'Fila reorganizada com sucesso',
        newOrder: newOrder,
        updatedItems: 1
      })
      
      // Verificar que foi feita apenas uma atualização
      expect(mockSupabase.update).toHaveBeenCalledTimes(1)
      expect(mockSupabase.update).toHaveBeenCalledWith({
        position: 1,
        updatedAt: expect.any(String)
      })
    })

    it('deve retornar erro para lista de IDs vazia', async () => {
      // Arrange: Lista vazia de IDs
      const newOrder: string[] = []

      const formData = new FormData()
      formData.append('queueIds', JSON.stringify(newOrder))

      // Act: Chamar reorganizeQueue
      const result = await reorganizeQueue(formData)

      // Assert: Verificar que retornou erro
      expect(result.success).toBe(false)
      expect(result.error).toContain('Lista de IDs não pode estar vazia')
      
      // Verificar que não foi feita atualização no banco
      expect(mockSupabase.update).not.toHaveBeenCalled()
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('deve retornar erro para lista de IDs inválida', async () => {
      // Arrange: Lista com IDs inválidos
      const newOrder = ['queue-1', '', 'queue-3'] // ID vazio no meio

      const formData = new FormData()
      formData.append('queueIds', JSON.stringify(newOrder))

      // Act: Chamar reorganizeQueue
      const result = await reorganizeQueue(formData)

      // Assert: Verificar que retornou erro
      expect(result.success).toBe(false)
      expect(result.error).toContain('IDs inválidos na lista')
      
      // Verificar que não foi feita atualização no banco
      expect(mockSupabase.update).not.toHaveBeenCalled()
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('deve lidar com erro na atualização de um item específico', async () => {
      // Arrange: Mock de erro na segunda atualização
      const newOrder = ['queue-1', 'queue-2', 'queue-3']

      mockSupabase.update
        .mockResolvedValueOnce({ data: { id: 'queue-1' }, error: null }) // Primeira atualização OK
        .mockResolvedValueOnce({ data: null, error: { message: 'Erro na segunda atualização' } }) // Segunda falha

      const formData = new FormData()
      formData.append('queueIds', JSON.stringify(newOrder))

      // Act: Chamar reorganizeQueue
      const result = await reorganizeQueue(formData)

      // Assert: Verificar que retornou erro
      expect(result.success).toBe(false)
      expect(result.error).toContain('Erro ao reorganizar fila')
      
      // Verificar que o cache não foi revalidado
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })
  })

  describe('addToQueue', () => {
    it('deve adicionar cliente à fila com sucesso', async () => {
      // Arrange: Mock de inserção bem-sucedida
      const mockNewQueueItem = {
        id: 'new-queue-123',
        clientId: 'client-123',
        serviceId: 'service-123',
        position: 5,
        status: 'em espera',
        createdAt: '2024-12-24T10:00:00Z',
        updatedAt: '2024-12-24T10:00:00Z'
      }

      // Mock de busca da última posição
      mockSupabase.select.mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [{ position: 4 }],
          error: null
        })
      })

      mockSupabase.insert.mockResolvedValue({
        data: mockNewQueueItem,
        error: null
      })

      const formData = new FormData()
      formData.append('clientId', 'client-123')
      formData.append('serviceId', 'service-123')

      // Act: Chamar addToQueue
      const result = await addToQueue(formData)

      // Assert: Verificar que retornou sucesso
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockNewQueueItem)
      
      // Verificar que foi inserido no banco
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        clientId: 'client-123',
        serviceId: 'service-123',
        position: 5,
        status: 'em espera'
      })
      
      // Verificar que o cache foi revalidado
      expect(mockRevalidatePath).toHaveBeenCalledWith('/queue')
    })
  })

  describe('getQueueStatus', () => {
    it('deve retornar status atual da fila ordenado por posição', async () => {
      // Arrange: Mock de fila ordenada
      const mockQueueStatus = [
        { id: 'queue-1', clientId: 'client-1', position: 1, status: 'em espera', createdAt: '2024-12-24T10:00:00Z' },
        { id: 'queue-2', clientId: 'client-2', position: 2, status: 'em atendimento', createdAt: '2024-12-24T10:01:00Z' },
        { id: 'queue-3', clientId: 'client-3', position: 3, status: 'em espera', createdAt: '2024-12-24T10:02:00Z' }
      ]

      mockSupabase.select.mockReturnValue({
        in: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockQueueStatus,
            error: null
          })
        })
      })

      // Act: Chamar getQueueStatus
      const result = await getQueueStatus()

      // Assert: Verificar que retornou sucesso
      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        totalItems: 3,
        waitingItems: 2,
        inServiceItems: 1,
        queue: mockQueueStatus
      })
      
      // Verificar que foi feita consulta ordenada por posição
      expect(mockSupabase.select).toHaveBeenCalledWith('*')
      expect(mockSupabase.in).toHaveBeenCalledWith('status', ['em espera', 'em atendimento'])
      expect(mockSupabase.order).toHaveBeenCalledWith('position', { ascending: true })
    })
  })
})
