/**
 * Teste de Configuração
 * 
 * Este arquivo testa se a configuração básica do Jest está funcionando corretamente.
 * É útil para verificar se todos os mocks e configurações estão funcionando.
 */

describe('Configuração de Testes', () => {
  it('deve executar teste básico com sucesso', () => {
    expect(1 + 1).toBe(2)
  })

  it('deve ter FormData disponível', () => {
    const formData = new FormData()
    formData.append('test', 'value')
    expect(formData.get('test')).toBe('value')
  })

  it('deve ter console disponível', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    console.log('test')
    expect(consoleSpy).toHaveBeenCalledWith('test')
    consoleSpy.mockRestore()
  })

  it('deve ter setTimeout disponível', () => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve()
      }, 0)
    })
  })
})
