import { Cliente, Notificacao, TipoNotificacao, tipoNotificacaoDe } from './modelo';
import { criarLog } from './rastro';

const log = criarLog('NotificacaoFactory');

export const NotificacaoFactory = {
  criar(tipo: string, mensagem: string, cliente: Cliente): Notificacao {
    let tipoValido: TipoNotificacao;
    try {
      tipoValido = tipoNotificacaoDe(tipo);
    } catch (erro) {
      log.erro('criar', (erro as Error).message);
      throw erro;
    }
    if (mensagem.trim() === '') {
      log.erro('criar', 'A mensagem da notificação não pode ficar vazia.');
      throw new Error('A mensagem da notificação não pode ficar vazia.');
    }
    log.ok('criar', `new Notificacao(${tipoValido}, "${mensagem.trim()}")`);
    return new Notificacao(tipoValido, mensagem.trim(), cliente);
  },

  boasVindas(cliente: Cliente): Notificacao {
    return NotificacaoFactory.criar('EMAIL', `Bem-vindo(a), ${cliente.nome}! Seu cadastro foi realizado com sucesso.`, cliente);
  },

  atualizacao(cliente: Cliente): Notificacao {
    return NotificacaoFactory.criar('SMS', `Olá, ${cliente.nome}! Seus dados foram atualizados com sucesso.`, cliente);
  },

  remocao(cliente: Cliente): Notificacao {
    return NotificacaoFactory.criar('PUSH', `Olá, ${cliente.nome}! Seu cadastro foi removido da nossa base.`, cliente);
  },

  premium(cliente: Cliente): Notificacao {
    return NotificacaoFactory.criar(
      'EMAIL',
      `Parabéns, ${cliente.nome}! Agora você é cliente premium e tem benefícios exclusivos.`,
      cliente,
    );
  },
};
