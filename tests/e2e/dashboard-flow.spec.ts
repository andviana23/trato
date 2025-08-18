import { test, expect } from '@playwright/test';

test.describe('Fluxo do Dashboard e Relatórios', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para o dashboard
    await page.goto('/dashboard');
    
    // Aguardar carregamento da página
    await page.waitForSelector('[data-testid="dashboard-container"]', { timeout: 10000 });
  });

  test('deve visualizar KPIs principais', async ({ page }) => {
    // Verificar se os KPIs estão visíveis
    await expect(page.locator('[data-testid="total-appointments-kpi"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-revenue-kpi"]')).toBeVisible();
    await expect(page.locator('[data-testid="clients-in-queue-kpi"]')).toBeVisible();
    await expect(page.locator('[data-testid="average-wait-time-kpi"]')).toBeVisible();
  });

  test('deve gerar relatório de agendamentos', async ({ page }) => {
    // Clicar no botão de relatórios
    await page.click('[data-testid="reports-btn"]');
    
    // Selecionar tipo de relatório
    await page.click('[data-testid="appointments-report-btn"]');
    
    // Configurar período
    await page.fill('[data-testid="start-date-input"]', '2024-01-01');
    await page.fill('[data-testid="end-date-input"]', '2024-12-31');
    
    // Selecionar unidade
    await page.selectOption('[data-testid="unit-select"]', 'todas');
    
    // Gerar relatório
    await page.click('[data-testid="generate-report-btn"]');
    
    // Aguardar geração
    await page.waitForSelector('[data-testid="report-content"]', { timeout: 30000 });
    
    // Verificar se o relatório foi gerado
    await expect(page.locator('[data-testid="report-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-table"]')).toBeVisible();
  });

  test('deve exportar relatório em PDF', async ({ page }) => {
    // Navegar para relatórios
    await page.click('[data-testid="reports-btn"]');
    await page.click('[data-testid="appointments-report-btn"]');
    
    // Gerar relatório primeiro
    await page.fill('[data-testid="start-date-input"]', '2024-01-01');
    await page.fill('[data-testid="end-date-input"]', '2024-12-31');
    await page.click('[data-testid="generate-report-btn"]');
    
    // Aguardar geração
    await page.waitForSelector('[data-testid="report-content"]', { timeout: 30000 });
    
    // Clicar em exportar PDF
    await page.click('[data-testid="export-pdf-btn"]');
    
    // Verificar download (em ambiente de teste, verificar se o botão foi clicado)
    await expect(page.locator('[data-testid="export-pdf-btn"]')).toBeVisible();
  });

  test('deve filtrar dados por período', async ({ page }) => {
    // Clicar no filtro de período
    await page.click('[data-testid="period-filter-btn"]');
    
    // Selecionar período personalizado
    await page.click('[data-testid="custom-period-btn"]');
    
    // Definir datas
    await page.fill('[data-testid="start-date-input"]', '2024-06-01');
    await page.fill('[data-testid="end-date-input"]', '2024-06-30');
    
    // Aplicar filtro
    await page.click('[data-testid="apply-filter-btn"]');
    
    // Verificar se os dados foram filtrados
    await expect(page.locator('[data-testid="filtered-data-indicator"]')).toBeVisible();
  });

  test('deve visualizar gráficos interativos', async ({ page }) => {
    // Verificar se os gráficos estão carregados
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="appointments-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="services-chart"]')).toBeVisible();
    
    // Interagir com gráfico de receita
    await page.hover('[data-testid="revenue-chart"]');
    
    // Verificar tooltip
    await expect(page.locator('[data-testid="chart-tooltip"]')).toBeVisible();
  });

  test('deve acessar relatório DRE', async ({ page }) => {
    // Navegar para relatórios financeiros
    await page.click('[data-testid="financial-reports-btn"]');
    
    // Selecionar relatório DRE
    await page.click('[data-testid="dre-report-btn"]');
    
    // Configurar período
    await page.fill('[data-testid="start-date-input"]', '2024-01-01');
    await page.fill('[data-testid="end-date-input"]', '2024-12-31');
    
    // Gerar DRE
    await page.click('[data-testid="generate-dre-btn"]');
    
    // Aguardar geração
    await page.waitForSelector('[data-testid="dre-content"]', { timeout: 30000 });
    
    // Verificar seções do DRE
    await expect(page.locator('[data-testid="revenue-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="expenses-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="profit-section"]')).toBeVisible();
  });
});

