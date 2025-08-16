/**
 * Testes de Metas
 * 
 * Objetivo: Garantir que os cálculos de bonificação estão corretos.
 * 
 * Cenários testados:
 * 1. Bônus Total: Testa meta com 100%+ de progresso
 * 2. Bônus Parcial: Testa meta com progresso incompleto (ex: 80%)
 * 3. Sem Bônus: Testa meta com baixo progresso que não atinge critério mínimo
 */

import { calculateBonus, createMeta, updateMeta, getMetaProgress } from '@/actions/metas'
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

describe('Metas Actions', () => {
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
    }
    
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
    
    // Mock revalidatePath
    mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>
  })

  describe('calculateBonus', () => {
    describe('Bônus Total', () => {
      it('deve calcular bônus total para meta com 100% de progresso', async () => {
        // Arrange: Mock de meta com 100% de progresso
        const mockMeta = {
          id: 'meta-123',
          title: 'Meta de Vendas',
          targetValue: 10000.00,
          currentValue: 10000.00, // 100% de progresso
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          bonusPercentage: 10, // 10% de bônus
          status: 'active'
        }

        mockSupabase.select.mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockMeta,
            error: null
          })
        })

        // Act: Chamar calculateBonus
        const result = await calculateBonus('meta-123')

        // Assert: Verificar que retornou sucesso
        expect(result.success).toBe(true)
        expect(result.data).toEqual({
          metaId: 'meta-123',
          progress: 100,
          bonusValue: 1000.00, // 10% de 10000
          bonusPercentage: 10,
          isEligible: true
        })
      })

      it('deve calcular bônus total para meta com mais de 100% de progresso', async () => {
        // Arrange: Mock de meta com 120% de progresso
        const mockMeta = {
          id: 'meta-124',
          title: 'Meta de Clientes',
          targetValue: 100,
          currentValue: 120, // 120% de progresso
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          bonusPercentage: 15, // 15% de bônus
          status: 'active'
        }

        mockSupabase.select.mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockMeta,
            error: null
          })
        })

        // Act: Chamar calculateBonus
        const result = await calculateBonus('meta-124')

        // Assert: Verificar que retornou sucesso
        expect(result.success).toBe(true)
        expect(result.data).toEqual({
          metaId: 'meta-124',
          progress: 120,
          bonusValue: 15.00, // 15% de 100
          bonusPercentage: 15,
          isEligible: true
        })
      })

      it('deve aplicar bônus máximo quando progresso excede 150%', async () => {
        // Arrange: Mock de meta com 200% de progresso
        const mockMeta = {
          id: 'meta-125',
          title: 'Meta de Receita',
          targetValue: 50000.00,
          currentValue: 100000.00, // 200% de progresso
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          bonusPercentage: 20, // 20% de bônus
          maxBonusPercentage: 25, // Bônus máximo de 25%
          status: 'active'
        }

        mockSupabase.select.mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockMeta,
            error: null
          })
        })

        // Act: Chamar calculateBonus
        const result = await calculateBonus('meta-125')

        // Assert: Verificar que retornou sucesso com bônus máximo
        expect(result.success).toBe(true)
        expect(result.data).toEqual({
          metaId: 'meta-125',
          progress: 200,
          bonusValue: 12500.00, // 25% de 50000 (bônus máximo)
          bonusPercentage: 25,
          isEligible: true
        })
      })
    })

    describe('Bônus Parcial', () => {
      it('deve calcular bônus parcial para meta com 80% de progresso', async () => {
        // Arrange: Mock de meta com 80% de progresso
        const mockMeta = {
          id: 'meta-126',
          title: 'Meta de Produtividade',
          targetValue: 1000,
          currentValue: 800, // 80% de progresso
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          bonusPercentage: 12, // 12% de bônus
          partialBonusThreshold: 70, // Bônus parcial a partir de 70%
          partialBonusMultiplier: 0.5, // 50% do bônus total
          status: 'active'
        }

        mockSupabase.select.mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockMeta,
            error: null
          })
        })

        // Act: Chamar calculateBonus
        const result = await calculateBonus('meta-126')

        // Assert: Verificar que retornou sucesso com bônus parcial
        expect(result.success).toBe(true)
        expect(result.data).toEqual({
          metaId: 'meta-126',
          progress: 80,
          bonusValue: 60.00, // 50% de 12% de 1000
          bonusPercentage: 6, // 50% de 12%
          isEligible: true,
          isPartial: true
        })
      })

      it('deve calcular bônus proporcional para meta com 90% de progresso', async () => {
        // Arrange: Mock de meta com 90% de progresso
        const mockMeta = {
          id: 'meta-127',
          title: 'Meta de Qualidade',
          targetValue: 100,
          currentValue: 90, // 90% de progresso
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          bonusPercentage: 8, // 8% de bônus
          partialBonusThreshold: 75, // Bônus parcial a partir de 75%
          partialBonusMultiplier: 0.75, // 75% do bônus total
          status: 'active'
        }

        mockSupabase.select.mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockMeta,
            error: null
          })
        })

        // Act: Chamar calculateBonus
        const result = await calculateBonus('meta-127')

        // Assert: Verificar que retornou sucesso com bônus proporcional
        expect(result.success).toBe(true)
        expect(result.data).toEqual({
          metaId: 'meta-127',
          progress: 90,
          bonusValue: 6.00, // 75% de 8% de 100
          bonusPercentage: 6, // 75% de 8%
          isEligible: true,
          isPartial: true
        })
      })
    })

    describe('Sem Bônus', () => {
      it('deve retornar zero bônus para meta com baixo progresso', async () => {
        // Arrange: Mock de meta com 30% de progresso
        const mockMeta = {
          id: 'meta-128',
          title: 'Meta de Eficiência',
          targetValue: 1000,
          currentValue: 300, // 30% de progresso
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          bonusPercentage: 10, // 10% de bônus
          minimumProgressThreshold: 60, // Mínimo de 60% para bônus
          status: 'active'
        }

        mockSupabase.select.mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockMeta,
            error: null
          })
        })

        // Act: Chamar calculateBonus
        const result = await calculateBonus('meta-128')

        // Assert: Verificar que retornou sucesso mas sem bônus
        expect(result.success).toBe(true)
        expect(result.data).toEqual({
          metaId: 'meta-128',
          progress: 30,
          bonusValue: 0.00,
          bonusPercentage: 0,
          isEligible: false,
          reason: 'Progresso abaixo do mínimo necessário (60%)'
        })
      })

      it('deve retornar zero bônus para meta inativa', async () => {
        // Arrange: Mock de meta inativa
        const mockMeta = {
          id: 'meta-129',
          title: 'Meta Cancelada',
          targetValue: 5000,
          currentValue: 4000, // 80% de progresso
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          bonusPercentage: 15, // 15% de bônus
          status: 'inactive' // Meta inativa
        }

        mockSupabase.select.mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockMeta,
            error: null
          })
        })

        // Act: Chamar calculateBonus
        const result = await calculateBonus('meta-129')

        // Assert: Verificar que retornou sucesso mas sem bônus
        expect(result.success).toBe(true)
        expect(result.data).toEqual({
          metaId: 'meta-129',
          progress: 80,
          bonusValue: 0.00,
          bonusPercentage: 0,
          isEligible: false,
          reason: 'Meta não está ativa'
        })
      })

      it('deve retornar zero bônus para meta expirada', async () => {
        // Arrange: Mock de meta expirada
        const mockMeta = {
          id: 'meta-130',
          title: 'Meta Expirada',
          targetValue: 1000,
          currentValue: 900, // 90% de progresso
          startDate: '2024-01-01',
          endDate: '2024-06-30', // Meta expirada
          bonusPercentage: 10, // 10% de bônus
          status: 'active'
        }

        mockSupabase.select.mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockMeta,
            error: null
          })
        })

        // Act: Chamar calculateBonus
        const result = await calculateBonus('meta-130')

        // Assert: Verificar que retornou sucesso mas sem bônus
        expect(result.success).toBe(true)
        expect(result.data).toEqual({
          metaId: 'meta-130',
          progress: 90,
          bonusValue: 0.00,
          bonusPercentage: 0,
          isEligible: false,
          reason: 'Meta expirada'
        })
      })
    })

    describe('Tratamento de Erros', () => {
      it('deve retornar erro quando meta não é encontrada', async () => {
        // Arrange: Mock de meta não encontrada
        mockSupabase.select.mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })

        // Act: Chamar calculateBonus
        const result = await calculateBonus('meta-inexistente')

        // Assert: Verificar que retornou erro
        expect(result.success).toBe(false)
        expect(result.error).toContain('Meta não encontrada')
      })

      it('deve retornar erro quando há falha no banco de dados', async () => {
        // Arrange: Mock de erro no banco
        mockSupabase.select.mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Erro de conexão com banco' }
          })
        })

        // Act: Chamar calculateBonus
        const result = await calculateBonus('meta-123')

        // Assert: Verificar que retornou erro
        expect(result.success).toBe(false)
        expect(result.error).toContain('Erro ao calcular bônus')
      })

      it('deve retornar erro para metaId inválido', async () => {
        // Arrange: MetaId vazio
        const invalidMetaId = ''

        // Act: Chamar calculateBonus
        const result = await calculateBonus(invalidMetaId)

        // Assert: Verificar que retornou erro de validação
        expect(result.success).toBe(false)
        expect(result.error).toContain('MetaId é obrigatório')
      })
    })
  })

  describe('createMeta', () => {
    it('deve criar meta com sucesso e revalidar cache', async () => {
      // Arrange: Mock de inserção bem-sucedida
      const mockNewMeta = {
        id: 'new-meta-123',
        title: 'Nova Meta de Vendas',
        description: 'Aumentar vendas em 20%',
        targetValue: 50000.00,
        currentValue: 0,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        bonusPercentage: 12,
        status: 'active',
        createdAt: '2024-12-24T10:00:00Z',
        updatedAt: '2024-12-24T10:00:00Z'
      }

      mockSupabase.insert.mockResolvedValue({
        data: mockNewMeta,
        error: null
      })

      const formData = new FormData()
      formData.append('title', 'Nova Meta de Vendas')
      formData.append('description', 'Aumentar vendas em 20%')
      formData.append('targetValue', '50000')
      formData.append('startDate', '2024-01-01')
      formData.append('endDate', '2024-12-31')
      formData.append('bonusPercentage', '12')

      // Act: Chamar createMeta
      const result = await createMeta(formData)

      // Assert: Verificar sucesso
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockNewMeta)
      
      // Verificar que foi inserido no banco
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        title: 'Nova Meta de Vendas',
        description: 'Aumentar vendas em 20%',
        targetValue: 50000,
        currentValue: 0,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        bonusPercentage: 12,
        status: 'active'
      })
      
      // Verificar que o cache foi revalidado
      expect(mockRevalidatePath).toHaveBeenCalledWith('/metas')
    })
  })

  describe('getMetaProgress', () => {
    it('deve retornar progresso de meta existente', async () => {
      // Arrange: Mock de meta encontrada
      const mockMeta = {
        id: 'meta-123',
        title: 'Meta de Vendas',
        targetValue: 10000.00,
        currentValue: 7500.00, // 75% de progresso
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        status: 'active'
      }

      mockSupabase.select.mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: mockMeta,
          error: null
        })
      })

      // Act: Chamar getMetaProgress
      const result = await getMetaProgress('meta-123')

      // Assert: Verificar que retornou sucesso
      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        metaId: 'meta-123',
        title: 'Meta de Vendas',
        targetValue: 10000.00,
        currentValue: 7500.00,
        progress: 75,
        remainingValue: 2500.00,
        daysRemaining: expect.any(Number),
        status: 'active'
      })
    })
  })
})
