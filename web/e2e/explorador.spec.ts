import { expect, Page, test } from '@playwright/test';

const PRACA_DA_SE = {
  cep: '01001-000',
  logradouro: 'Praça da Sé',
  complemento: 'lado ímpar',
  bairro: 'Sé',
  localidade: 'São Paulo',
  uf: 'SP',
};

async function prepararViaCep(page: Page): Promise<void> {
  await page.route('https://viacep.com.br/ws/**', (rota) => {
    const corpo = rota.request().url().includes('99999999') ? { erro: 'true' } : PRACA_DA_SE;
    return rota.fulfill({ json: corpo });
  });
}

const errosDoConsole = (page: Page): string[] => {
  const erros: string[] = [];
  page.on('console', (mensagem) => mensagem.type() === 'error' && erros.push(mensagem.text()));
  page.on('pageerror', (erro) => erros.push(erro.message));
  return erros;
};

test.beforeEach(async ({ page }) => prepararViaCep(page));

test('abre sem erros e sem rolagem horizontal', async ({ page }) => {
  const erros = errosDoConsole(page);
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Uma API Spring aberta');
  await expect(page.getByRole('heading', { name: /Facade/, level: 2 })).toBeVisible();
  const larguras = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(larguras[0]).toBeLessThanOrEqual(larguras[1]);
  expect(erros).toEqual([]);
});

test('facade cadastra cliente e resolve o CEP pelo ViaCEP', async ({ page }) => {
  await page.goto('./#facade');
  await page.getByRole('button', { name: 'POST /clientes' }).click();
  await expect(page.getByText('201 Created')).toBeVisible();
  await expect(page.locator('.ficha').getByText('Praça da Sé')).toBeVisible();
  await expect(page.locator('.registro__lista')).toContainText('ViaCepConsultaEndereco');
  await expect(page.locator('.registro__lista')).toContainText('AuditoriaObserver', { timeout: 15_000 });
  await expect(page.locator('.estado')).toContainText('1 (1 enviadas)');
});

test('CEP inexistente vira 422 com mensagem clara', async ({ page }) => {
  await page.goto('./#facade');
  await page.getByRole('button', { name: /99999-999/ }).click();
  await page.getByRole('button', { name: 'POST /clientes' }).click();
  await expect(page.getByRole('alert')).toContainText('422 Unprocessable Entity');
  await expect(page.getByRole('alert')).toContainText('não existe');
});

test('adapter traduz SMS e recusa WhatsApp sem adapter', async ({ page }) => {
  await page.goto('./#adapter');
  await page.getByRole('button', { name: 'despachante.enviar(notificacao)' }).click();
  await expect(page.getByText('Saída: OperadoraSms.dispararTexto')).toBeVisible();
  await page.getByRole('radio', { name: 'WHATSAPP' }).click();
  await page.getByRole('button', { name: 'despachante.enviar(notificacao)' }).click();
  await expect(page.getByRole('alert')).toContainText('Nenhum CanalNotificacao suporta WHATSAPP');
});

test('builder recusa cliente sem nome', async ({ page }) => {
  await page.goto('./#builder');
  await page.getByLabel(/Nome/).fill('');
  await page.getByRole('button', { name: 'build()' }).click();
  await expect(page.getByRole('alert')).toContainText('precisa de nome');
});

test('strategy offline devolve só o CEP', async ({ page }) => {
  await page.goto('./#strategy');
  await page.getByRole('radio', { name: 'ConsultaEnderecoOffline' }).click();
  await expect(page.locator('.propriedade')).toHaveText('anatomy.endereco.estrategia=offline');
  await page.getByRole('button', { name: 'consultar(cep)' }).click();
  await expect(page.getByText('Endereco via ConsultaEnderecoOffline')).toBeVisible();
});

test('template mostra ganchos herdados e sobrescritos', async ({ page }) => {
  await page.goto('./#template');
  await page.getByRole('button', { name: 'processar(cliente)' }).click();
  await expect(page.locator('.esqueleto-template li')).toHaveCount(4);
  await expect(page.getByText('sobrescrito em Premium').first()).toBeVisible();
  await page.getByRole('radio', { name: 'ProcessamentoClientePadrao' }).click();
  await page.getByRole('button', { name: 'processar(cliente)' }).click();
  await expect(page.locator('.esqueleto-template')).toContainText('Plano sem aviso extra.');
});

test('singleton devolve sempre a mesma instância e prototype não', async ({ page }) => {
  await page.goto('./#singleton');
  await page.getByRole('button', { name: 'Pedir 4 vezes' }).click();
  await expect(page.getByText('4 chamadas a getBean, 1 instância distinta.')).toBeVisible();
  await page.getByRole('radio', { name: '@Scope("prototype")' }).click();
  await page.getByRole('button', { name: 'Pedir 4 vezes' }).click();
  await expect(page.getByText('4 chamadas a getBean, 4 instâncias distintas.')).toBeVisible();
});

test('observer reage a cadastro, atualização e remoção', async ({ page }) => {
  await page.goto('./#observer');
  await page.getByRole('button', { name: 'Cadastrar' }).click();
  await expect(page.locator('.lista-clientes')).toContainText('Lívia Prado');
  await page.getByRole('button', { name: 'Atualizar' }).click();
  await expect(page.locator('.coluna-observer').first()).toContainText('SMS');
  await page.getByRole('button', { name: 'Remover' }).click();
  await expect(page.locator('.coluna-observer').last()).toContainText('REMOVIDO');
});
