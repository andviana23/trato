import { test, expect } from '@playwright/test';

test.describe('Fluxo da Fila de Atendimento', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página da fila
    await page.goto('/fila');
    
    // Aguardar carregamento da página
    await page.waitForSelector('[data-testid="queue-container"]', { timeout: 10000 });
  });

  test('deve adicionar cliente à fila', async ({ page }) => {
    // Clicar no botão de adicionar à fila
    await page.click('[data-testid="add-to-queue-btn"]');
    
    // Preencher formulário
    await page.fill('[data-testid="client-name-input"]', 'Maria Santos');
    await page.fill('[data-testid="client-phone-input"]', '(11) 88888-8888');
    await page.selectOption('[data-testid="service-select"]', 'corte');
    await page.selectOption('[data-testid="priority-select"]', 'normal');
    
    // Adicionar observações
    await page.fill('[data-testid="observations-input"]', 'Cliente preferencial');
    
    // Salvar
    await page.click('[data-testid="save-queue-item-btn"]');
    
    // Verificar sucesso
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('text=Cliente adicionado à fila com sucesso')).toBeVisible();
  });

  test('deve atender próximo cliente', async ({ page }) => {
    // Verificar se há clientes na fila
    const queueItems = page.locator('[data-testid="queue-item"]');
    const itemCount = await queueItems.count();
    
    if (itemCount > 0) {
      // Clicar no botão de atender próximo
      await page.click('[data-testid="attend-next-btn"]');
      
      // Confirmar atendimento
      await page.click('[data-testid="confirm-attendance-btn"]');
      
      // Verificar sucesso
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('text=Cliente atendido com sucesso')).toBeVisible();
    } else {
      // Se não há clientes, verificar mensagem apropriada
      await expect(page.locator('text=Fila vazia')).toBeVisible();
    }
  });

  test('deve remover cliente da fila', async ({ page }) => {
    // Clicar em um item da fila
    await page.click('[data-testid="queue-item"]');
    
    // Clicar em remover
    await page.click('[data-testid="remove-from-queue-btn"]');
    
    // Confirmar remoção
    await page.click('[data-testid="confirm-removal-btn"]');
    
    // Verificar sucesso
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('text=Cliente removido da fila com sucesso')).toBeVisible();
  });

  test('deve alterar prioridade do cliente', async ({ page }) => {
    // Clicar em um item da fila
    await page.click('[data-testid="queue-item"]');
    
    // Clicar em alterar prioridade
    await page.click('[data-testid="change-priority-btn"]');
    
    // Selecionar nova prioridade
    await page.selectOption('[data-testid="priority-select"]', 'alta');
    
    // Salvar alteração
    await page.click('[data-testid="save-priority-btn"]');
    
    // Verificar sucesso
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('text=Prioridade alterada com sucesso')).toBeVisible();
  });
});

