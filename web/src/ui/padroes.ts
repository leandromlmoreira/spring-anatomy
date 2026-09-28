import { Diagrama } from './diagrama';

export type IdPadrao = 'facade' | 'builder' | 'strategy' | 'observer' | 'factory' | 'adapter' | 'template' | 'singleton';

export interface Padrao {
  readonly id: IdPadrao;
  readonly nome: string;
  readonly categoria: 'Criacional' | 'Estrutural' | 'Comportamental';
  readonly peca: string;
  readonly intencao: string;
  readonly problema: string;
  readonly solucao: string;
  readonly arquivos: readonly string[];
  readonly diagrama: Diagrama;
  readonly atalhosDeCodigo?: Readonly<Record<string, readonly [string, string]>>;
}

const NOTIFICACAO_EM_DIANTE = [
  'NotificacaoObserver',
  'AuditoriaObserver',
  'NotificacaoFactory',
  'DespachanteNotificacao',
  'EmailNotificacaoAdapter',
  'SmsNotificacaoAdapter',
  'PushNotificacaoAdapter',
  'ServidorSmtp',
  'OperadoraSms',
  'ProvedorPush',
];

export const PADROES: readonly Padrao[] = [
  {
    id: 'facade',
    nome: 'Facade',
    categoria: 'Estrutural',
    peca: 'ClienteRestController',
    intencao: 'Uma porta simples na frente de um subsistema complicado.',
    problema:
      'Cadastrar um cliente envolve validar a entrada, montar o objeto, consultar o CEP, gravar endereço e cliente e avisar quem se interessa pelo cadastro. Se cada tela ou integração orquestrasse esses passos sozinha, qualquer mudança espalharia bugs pelo sistema.',
    solucao:
      'O ClienteRestController expõe poucas rotas REST e esconde o resto. Quem chama POST /clientes não sabe que existe ViaCEP, cache de endereço ou observers: manda nome e CEP e recebe o cliente pronto.',
    arquivos: ['ClienteRestController', 'ClienteServiceImpl', 'ClienteRequest'],
    diagrama: {
      largura: 580,
      altura: 340,
      nos: [
        { id: 'Cliente HTTP', x: 78, y: 170, tipo: 'externo' },
        { id: 'ClienteRestController', x: 290, y: 170 },
        { id: 'ClienteBuilder', x: 485, y: 46, apelidos: ['ClienteRequest'] },
        { id: 'ClienteServiceImpl', x: 485, y: 124 },
        { id: 'ConsultaEndereco', x: 485, y: 212, tipo: 'interface', apelidos: ['ViaCepConsultaEndereco', 'ConsultaEnderecoOffline'] },
        { id: 'Repositories', x: 250, y: 296, apelidos: ['EnderecoRepository', 'ClienteRepository'] },
        { id: 'PublicadorEventosCliente', x: 468, y: 300, apelidos: NOTIFICACAO_EM_DIANTE },
      ],
      arestas: [
        { de: 'Cliente HTTP', para: 'ClienteRestController' },
        { de: 'ClienteRestController', para: 'ClienteBuilder' },
        { de: 'ClienteRestController', para: 'ClienteServiceImpl' },
        { de: 'ClienteServiceImpl', para: 'ConsultaEndereco' },
        { de: 'ClienteServiceImpl', para: 'Repositories' },
        { de: 'ClienteServiceImpl', para: 'PublicadorEventosCliente' },
      ],
    },
  },
  {
    id: 'builder',
    nome: 'Builder',
    categoria: 'Criacional',
    peca: 'ClienteBuilder',
    intencao: 'Montar um objeto com muitos campos opcionais sem um construtor gigante.',
    problema:
      'Cliente e Endereco somam oito campos, quase todos opcionais. Um construtor com oito Strings é fácil de chamar na ordem errada, e setters soltos deixam objetos pela metade circulando pelo sistema.',
    solucao:
      'ClienteBuilder encadeia comNome, comCep, comBairro e companhia, e só entrega o objeto em build(), que recusa cliente sem nome. O ClienteRequest da API usa o mesmo builder para virar entidade.',
    arquivos: ['ClienteBuilder', 'ClienteRequest'],
    diagrama: {
      largura: 580,
      altura: 320,
      nos: [
        { id: 'ClienteRequest', x: 110, y: 64, apelidos: ['ClienteRestController'] },
        { id: 'ClienteBuilder', x: 290, y: 164 },
        { id: 'Cliente', x: 480, y: 84 },
        { id: 'Endereco', x: 480, y: 250 },
        { id: 'build()', x: 110, y: 264, tipo: 'externo' },
      ],
      arestas: [
        { de: 'ClienteRequest', para: 'ClienteBuilder' },
        { de: 'ClienteBuilder', para: 'Cliente' },
        { de: 'ClienteBuilder', para: 'Endereco' },
        { de: 'ClienteBuilder', para: 'build()' },
      ],
    },
  },
  {
    id: 'strategy',
    nome: 'Strategy',
    categoria: 'Comportamental',
    peca: 'ConsultaEndereco',
    intencao: 'Trocar o algoritmo sem mexer em quem o usa.',
    problema:
      'Em produção o endereço vem do ViaCEP. Em teste, num trem sem sinal ou numa demo offline, depender da rede quebra tudo. Um if espalhado pelo serviço resolveria hoje e viraria dívida amanhã.',
    solucao:
      'ClienteServiceImpl conhece só a interface ConsultaEndereco. A propriedade anatomy.endereco.estrategia decide qual implementação o Spring injeta: ViaCepConsultaEndereco ou ConsultaEnderecoOffline.',
    arquivos: ['ConsultaEndereco', 'ViaCepConsultaEndereco', 'ConsultaEnderecoOffline', 'ViaCepClient', 'ClienteServiceImpl'],
    diagrama: {
      largura: 580,
      altura: 350,
      nos: [
        { id: 'ClienteServiceImpl', x: 110, y: 70 },
        { id: 'ConsultaEndereco', x: 370, y: 70, tipo: 'interface' },
        { id: 'ViaCepConsultaEndereco', x: 190, y: 200 },
        { id: 'ConsultaEnderecoOffline', x: 460, y: 200 },
        { id: 'viacep.com.br', x: 190, y: 300, tipo: 'externo' },
      ],
      arestas: [
        { de: 'ClienteServiceImpl', para: 'ConsultaEndereco' },
        { de: 'ViaCepConsultaEndereco', para: 'ConsultaEndereco', tipo: 'implementa' },
        { de: 'ConsultaEnderecoOffline', para: 'ConsultaEndereco', tipo: 'implementa' },
        { de: 'ViaCepConsultaEndereco', para: 'viacep.com.br' },
      ],
    },
  },
  {
    id: 'observer',
    nome: 'Observer',
    categoria: 'Comportamental',
    peca: 'PublicadorEventosCliente',
    intencao: 'Avisar vários interessados sem que o emissor conheça cada um.',
    problema:
      'Quando um cliente é criado, alguém precisa mandar boas-vindas, alguém precisa auditar e amanhã alguém vai querer avisar o CRM. Chamar tudo direto do serviço acopla o cadastro a cada regra nova.',
    solucao:
      'O serviço publica CRIADO, ATUALIZADO ou REMOVIDO no PublicadorEventosCliente. O Spring injeta todos os ClienteObserver; cada um reage do seu jeito, e a falha de um não derruba os outros.',
    arquivos: ['PublicadorEventosCliente', 'EventoCliente', 'ClienteObserver', 'NotificacaoObserver', 'AuditoriaObserver'],
    diagrama: {
      largura: 580,
      altura: 350,
      nos: [
        { id: 'ClienteServiceImpl', x: 100, y: 58, apelidos: ['ClienteRestController', 'ClienteBuilder', 'EnderecoRepository', 'ClienteRepository', 'ConsultaEnderecoOffline', 'ViaCepConsultaEndereco'] },
        { id: 'PublicadorEventosCliente', x: 380, y: 58 },
        { id: 'NotificacaoObserver', x: 170, y: 190, apelidos: NOTIFICACAO_EM_DIANTE.filter((classe) => classe !== 'AuditoriaObserver') },
        { id: 'AuditoriaObserver', x: 450, y: 190 },
        { id: 'ClienteObserver', x: 310, y: 300, tipo: 'interface' },
      ],
      arestas: [
        { de: 'ClienteServiceImpl', para: 'PublicadorEventosCliente' },
        { de: 'PublicadorEventosCliente', para: 'NotificacaoObserver' },
        { de: 'PublicadorEventosCliente', para: 'AuditoriaObserver' },
        { de: 'NotificacaoObserver', para: 'ClienteObserver', tipo: 'implementa' },
        { de: 'AuditoriaObserver', para: 'ClienteObserver', tipo: 'implementa' },
      ],
    },
  },
  {
    id: 'factory',
    nome: 'Factory',
    categoria: 'Criacional',
    peca: 'NotificacaoFactory',
    intencao: 'Centralizar a criação de objetos e as regras de cada variação.',
    problema:
      'Cada evento do cliente gera uma notificação diferente, com canal e texto próprios. Espalhar new Notificacao(...) pelo código duplica mensagens e deixa passar tipos que nenhum canal entende.',
    solucao:
      'NotificacaoFactory decide canal e texto de boas-vindas, atualização, remoção e premium, e valida o tipo quando ele chega como texto pela API. É uma factory estática; o Factory Method do GoF delegaria essa decisão a subclasses.',
    arquivos: ['NotificacaoFactory', 'TipoNotificacao', 'Notificacao'],
    diagrama: {
      largura: 580,
      altura: 330,
      nos: [
        { id: 'NotificacaoObserver', x: 126, y: 60 },
        { id: 'ProcessamentoClientePremium', x: 126, y: 165 },
        { id: 'NotificacaoRestController', x: 126, y: 270 },
        { id: 'NotificacaoFactory', x: 440, y: 165 },
        { id: 'TipoNotificacao', x: 440, y: 56, tipo: 'enum' },
        { id: 'Notificacao', x: 440, y: 278 },
      ],
      arestas: [
        { de: 'NotificacaoObserver', para: 'NotificacaoFactory' },
        { de: 'ProcessamentoClientePremium', para: 'NotificacaoFactory' },
        { de: 'NotificacaoRestController', para: 'NotificacaoFactory' },
        { de: 'NotificacaoFactory', para: 'TipoNotificacao' },
        { de: 'NotificacaoFactory', para: 'Notificacao' },
      ],
    },
  },
  {
    id: 'adapter',
    nome: 'Adapter',
    categoria: 'Estrutural',
    peca: 'CanalNotificacao',
    intencao: 'Fazer interfaces incompatíveis conversarem.',
    problema:
      'O servidor de e-mail quer destinatário, assunto e HTML. A operadora de SMS aceita no máximo 160 caracteres. O provedor de push exige um mapa com título e corpo. Nenhum deles entende uma Notificacao.',
    solucao:
      'Cada adapter implementa CanalNotificacao e traduz a Notificacao para a API do seu gateway. O DespachanteNotificacao só pergunta quem suporta o tipo; WHATSAPP não tem adapter e fica pendente.',
    arquivos: [
      'DespachanteNotificacao',
      'CanalNotificacao',
      'EmailNotificacaoAdapter',
      'SmsNotificacaoAdapter',
      'PushNotificacaoAdapter',
      'ServidorSmtp',
      'OperadoraSms',
      'ProvedorPush',
    ],
    diagrama: {
      largura: 650,
      altura: 360,
      nos: [
        { id: 'DespachanteNotificacao', x: 325, y: 42 },
        { id: 'CanalNotificacao', x: 325, y: 132, tipo: 'interface' },
        { id: 'EmailNotificacaoAdapter', x: 112, y: 228 },
        { id: 'SmsNotificacaoAdapter', x: 325, y: 228 },
        { id: 'PushNotificacaoAdapter', x: 540, y: 228 },
        { id: 'ServidorSmtp', x: 112, y: 318, tipo: 'externo' },
        { id: 'OperadoraSms', x: 325, y: 318, tipo: 'externo' },
        { id: 'ProvedorPush', x: 540, y: 318, tipo: 'externo' },
      ],
      arestas: [
        { de: 'DespachanteNotificacao', para: 'CanalNotificacao' },
        { de: 'EmailNotificacaoAdapter', para: 'CanalNotificacao', tipo: 'implementa' },
        { de: 'SmsNotificacaoAdapter', para: 'CanalNotificacao', tipo: 'implementa' },
        { de: 'PushNotificacaoAdapter', para: 'CanalNotificacao', tipo: 'implementa' },
        { de: 'EmailNotificacaoAdapter', para: 'ServidorSmtp' },
        { de: 'SmsNotificacaoAdapter', para: 'OperadoraSms' },
        { de: 'PushNotificacaoAdapter', para: 'ProvedorPush' },
      ],
    },
  },
  {
    id: 'template',
    nome: 'Template Method',
    categoria: 'Comportamental',
    peca: 'ProcessamentoClienteTemplate',
    intencao: 'Fixar o esqueleto de um algoritmo e deixar só alguns passos variarem.',
    problema:
      'Todo plano segue a mesma ordem: validar, aplicar benefícios, notificar e registrar. Copiar esse fluxo para cada plano novo abre espaço para alguém pular a validação ou inverter os passos.',
    solucao:
      'ProcessamentoClienteTemplate.processar é final e chama os ganchos na ordem. O plano padrão sobrescreve só aplicarBeneficios; o premium sobrescreve também notificar e registrarLog.',
    arquivos: ['ProcessamentoClienteTemplate', 'ProcessamentoClientePadrao', 'ProcessamentoClientePremium', 'CatalogoProcessamentos'],
    diagrama: {
      largura: 600,
      altura: 360,
      nos: [
        { id: 'CatalogoProcessamentos', x: 300, y: 42 },
        { id: 'ProcessamentoClienteTemplate', x: 300, y: 142, tipo: 'abstrata' },
        { id: 'ProcessamentoClientePadrao', x: 140, y: 250 },
        { id: 'ProcessamentoClientePremium', x: 450, y: 250 },
        { id: 'DespachanteNotificacao', x: 450, y: 326, apelidos: ['NotificacaoFactory', 'EmailNotificacaoAdapter', 'ServidorSmtp'] },
      ],
      arestas: [
        { de: 'CatalogoProcessamentos', para: 'ProcessamentoClienteTemplate' },
        { de: 'ProcessamentoClientePadrao', para: 'ProcessamentoClienteTemplate', tipo: 'estende' },
        { de: 'ProcessamentoClientePremium', para: 'ProcessamentoClienteTemplate', tipo: 'estende' },
        { de: 'ProcessamentoClientePremium', para: 'DespachanteNotificacao' },
      ],
    },
  },
  {
    id: 'singleton',
    nome: 'Singleton',
    categoria: 'Criacional',
    peca: 'ApplicationContext',
    intencao: 'Uma única instância compartilhada pela aplicação inteira.',
    problema:
      'Serviços sem estado, como o de clientes ou o despachante, não precisam de cópias. Criar um novo a cada uso desperdiça memória e, pior, espalha estado quando alguém guarda cache dentro deles.',
    solucao:
      'O escopo padrão de um bean Spring é singleton: o ApplicationContext cria uma vez e devolve a mesma referência em cada getBean ou injeção. O SingletonTest prova isso com isSameAs, e @Scope("prototype") mudaria a regra.',
    arquivos: ['SingletonTest', 'ClienteServiceImpl', 'DespachanteNotificacao'],
    atalhosDeCodigo: { ApplicationContext: ['SingletonTest', 'oContainerDevolveSempreAMesmaInstancia'] },
    diagrama: {
      largura: 650,
      altura: 330,
      nos: [
        { id: 'SingletonTest', x: 325, y: 44 },
        { id: 'ApplicationContext', x: 325, y: 146 },
        { id: 'ClienteServiceImpl', x: 110, y: 270 },
        { id: 'DespachanteNotificacao', x: 325, y: 270 },
        { id: 'PublicadorEventosCliente', x: 548, y: 270 },
      ],
      arestas: [
        { de: 'SingletonTest', para: 'ApplicationContext' },
        { de: 'ApplicationContext', para: 'ClienteServiceImpl' },
        { de: 'ApplicationContext', para: 'DespachanteNotificacao' },
        { de: 'ApplicationContext', para: 'PublicadorEventosCliente' },
      ],
    },
  },
];

export const DIAGRAMA_GERAL: Diagrama = {
  largura: 760,
  altura: 540,
  nos: [
    { id: 'POST /clientes', x: 84, y: 60, tipo: 'externo' },
    { id: 'ClienteRestController', x: 330, y: 60 },
    { id: 'ClienteBuilder', x: 610, y: 60 },
    { id: 'ClienteServiceImpl', x: 330, y: 170 },
    { id: 'ConsultaEndereco', x: 610, y: 170, tipo: 'interface' },
    { id: 'PublicadorEventosCliente', x: 330, y: 282 },
    { id: 'ProcessamentoClientePremium', x: 612, y: 300 },
    { id: 'NotificacaoObserver', x: 180, y: 392 },
    { id: 'AuditoriaObserver', x: 420, y: 392 },
    { id: 'NotificacaoFactory', x: 180, y: 492 },
    { id: 'DespachanteNotificacao', x: 470, y: 492 },
  ],
  arestas: [
    { de: 'POST /clientes', para: 'ClienteRestController' },
    { de: 'ClienteRestController', para: 'ClienteBuilder' },
    { de: 'ClienteRestController', para: 'ClienteServiceImpl' },
    { de: 'ClienteRestController', para: 'ProcessamentoClientePremium' },
    { de: 'ClienteServiceImpl', para: 'ConsultaEndereco' },
    { de: 'ClienteServiceImpl', para: 'PublicadorEventosCliente' },
    { de: 'PublicadorEventosCliente', para: 'NotificacaoObserver' },
    { de: 'PublicadorEventosCliente', para: 'AuditoriaObserver' },
    { de: 'NotificacaoObserver', para: 'NotificacaoFactory' },
    { de: 'NotificacaoObserver', para: 'DespachanteNotificacao' },
    { de: 'ProcessamentoClientePremium', para: 'DespachanteNotificacao' },
  ],
  chamadas: [
    { padrao: 'facade', rotulo: 'Facade', alvo: 'ClienteRestController', x: 150, y: 126 },
    { padrao: 'builder', rotulo: 'Builder', alvo: 'ClienteBuilder', x: 660, y: 118 },
    { padrao: 'singleton', rotulo: 'Singleton', alvo: 'ClienteServiceImpl', x: 120, y: 214 },
    { padrao: 'strategy', rotulo: 'Strategy', alvo: 'ConsultaEndereco', x: 690, y: 236 },
    { padrao: 'observer', rotulo: 'Observer', alvo: 'PublicadorEventosCliente', x: 110, y: 312 },
    { padrao: 'template', rotulo: 'Template Method', alvo: 'ProcessamentoClientePremium', x: 640, y: 372 },
    { padrao: 'factory', rotulo: 'Factory', alvo: 'NotificacaoFactory', x: 60, y: 446 },
    { padrao: 'adapter', rotulo: 'Adapter', alvo: 'DespachanteNotificacao', x: 680, y: 452 },
  ],
};

export const ROTEIRO_GERAL: readonly string[] = [
  'POST /clientes',
  'ClienteRestController',
  'ClienteBuilder',
  'ClienteRestController',
  'ClienteServiceImpl',
  'ConsultaEndereco',
  'ClienteServiceImpl',
  'PublicadorEventosCliente',
  'NotificacaoObserver',
  'NotificacaoFactory',
  'NotificacaoObserver',
  'DespachanteNotificacao',
  'PublicadorEventosCliente',
  'AuditoriaObserver',
];

export function padraoPorId(id: string): Padrao | undefined {
  return PADROES.find((padrao) => padrao.id === id);
}
