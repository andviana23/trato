import { test, expect } from '@playwright/test';

test.describe('Fluxo de Agendamentos', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página de agenda
    await page.goto('/agenda');
    
    // Aguardar carregamento da página
    await page.waitForSelector('[data-testid="agenda-container"]', { timeout: 10000 });
  });

  test('deve criar um novo agendamento', async ({ page }) => {
    // Clicar no botão de novo agendamento
    await page.click('[data-testid="new-appointment-btn"]');
    
    // Preencher formulário
    await page.fill('[data-testid="client-name-input"]', 'João Silva');
    await page.fill('[data-testid="client-phone-input"]', '(11) 99999-9999');
    await page.selectOption('[data-testid="service-select"]', 'corte-barba');
    await page.selectOption('[data-testid="barber-select"]', 'joao-silva');
    
    // Selecionar data e horário
    await page.click('[data-testid="date-picker"]');
    await page.click('[data-testid="time-slot-09:00"]');
    
    // Salvar agendamento
    await page.click('[data-testid="save-appointment-btn"]');
    
    // Verificar sucesso
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('text=Agendamento criado com sucesso')).toBeVisible();
  });

  test('deve editar um agendamento existente', async ({ page }) => {
    // Clicar em um agendamento existente
    await page.click('[data-testid="appointment-item"]');
    
    // Clicar em editar
    await page.click('[data-testid="edit-appointment-btn"]');
    
    // Modificar dados
    await page.fill('[data-testid="client-name-input"]', 'João Silva Atualizado');
    
    // Salvar alterações
    await page.click('[data-testid="save-appointment-btn"]');
    
    // Verificar sucesso
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('text=Agendamento atualizado com sucesso')).toBeVisible();
  });

  test('deve cancelar um agendamento', async ({ page }) => {
    // Clicar em um agendamento existente
    await page.click('[data-testid="appointment-item"]');
    
    // Clicar em cancelar
    await page.click('[data-testid="cancel-appointment-btn"]');
    
    // Confirmar cancelamento
    await page.click('[data-testid="confirm-cancel-btn"]');
    
    // Verificar sucesso
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('text=Agendamento cancelado com sucesso')).toBeVisible();
  });
});

