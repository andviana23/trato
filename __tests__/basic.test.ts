/**
 * Teste Básico
 * 
 * Este arquivo testa funcionalidades básicas sem dependências externas.
 * É útil para verificar se a configuração do Jest está funcionando.
 */

describe('Testes Básicos', () => {
  it('deve executar operações matemáticas básicas', () => {
    expect(2 + 2).toBe(4)
    expect(10 - 5).toBe(5)
    expect(3 * 4).toBe(12)
    expect(15 / 3).toBe(5)
  })

  it('deve trabalhar com strings', () => {
    const message = 'Hello World'
    expect(message).toContain('Hello')
    expect(message.length).toBe(11)
    expect(message.toUpperCase()).toBe('HELLO WORLD')
  })

  it('deve trabalhar com arrays', () => {
    const numbers = [1, 2, 3, 4, 5]
    expect(numbers).toHaveLength(5)
    expect(numbers[0]).toBe(1)
    expect(numbers).toContain(3)
    expect(numbers.filter(n => n > 3)).toEqual([4, 5])
  })

  it('deve trabalhar com objetos', () => {
    const person = { name: 'João', age: 30, city: 'São Paulo' }
    expect(person.name).toBe('João')
    expect(person.age).toBeGreaterThan(25)
    expect(person).toHaveProperty('city')
    expect(Object.keys(person)).toHaveLength(3)
  })

  it('deve trabalhar com funções', () => {
    const add = (a: number, b: number) => a + b
    const multiply = (a: number, b: number) => a * b
    
    expect(add(5, 3)).toBe(8)
    expect(multiply(4, 6)).toBe(24)
    expect(typeof add).toBe('function')
  })

  it('deve trabalhar com async/await', async () => {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
    
    const start = Date.now()
    await delay(10)
    const end = Date.now()
    
    expect(end - start).toBeGreaterThanOrEqual(5)
  })

  it('deve ter acesso ao ambiente de teste', () => {
    expect(process.env.NODE_ENV).toBe('test')
    expect(typeof global).toBe('object')
    expect(typeof window).toBe('object') // jsdom environment
  })
})
