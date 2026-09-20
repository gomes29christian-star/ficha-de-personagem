import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// CORS e Headers flexíveis para conexões de múltiplos dispositivos e redes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// Gerenciador de Salas de Campanhas em Memória
const salasCampanhas = new Map();

function obterOuCriarSala(codigo, nomeCampanha = null, criadorId = null, criadorNome = null) {
  const cod = String(codigo || '').trim().toUpperCase();
  if (!cod) return null;

  if (!salasCampanhas.has(cod)) {
    salasCampanhas.set(cod, {
      codigo: cod,
      nome: nomeCampanha || `Campanha ${cod}`,
      criadorId: criadorId || 'anon',
      criadorNome: criadorNome || 'Mestre',
      criadoEm: Date.now(),
      membros: new Map(), // jogadorId -> dados do membro
      conquistasEquipe: new Set(), // Set de ids de conquistas de equipe desbloqueadas
      diarioSessao: '',
      historico: [] // histórico de eventos e feitos
    });
  }
  return salasCampanhas.get(cod);
}

function serializarSala(sala) {
  if (!sala) return null;
  const membrosArr = [];
  sala.membros.forEach((membro) => {
    membrosArr.push({
      id: membro.id,
      nomePersonagem: membro.nomePersonagem,
      nomeJogador: membro.nomeJogador,
      avatar: membro.avatar,
      isMestre: !!membro.isMestre,
      classe1: membro.classe1 || '',
      classe2: membro.classe2 || '',
      nivel: membro.nivel || '',
      corTema: membro.corTema || '#c9b183',
      vidaAtual: membro.vidaAtual ?? 100,
      vidaMax: membro.vidaMax ?? 100,
      vidaTemp: membro.vidaTemp ?? 0,
      estaminaAtual: membro.estaminaAtual ?? 80,
      estaminaMax: membro.estaminaMax ?? 80,
      estaminaTemp: membro.estaminaTemp ?? 0,
      mentalAtual: membro.mentalAtual ?? 50,
      mentalMax: membro.mentalMax ?? 50,
      mentalTemp: membro.mentalTemp ?? 0,
      auraAtual: membro.auraAtual ?? 30,
      auraMax: membro.auraMax ?? 30,
      auraTemp: membro.auraTemp ?? 0,
      sanidadeAtual: membro.sanidadeAtual ?? (membro.mentalAtual ?? 50),
      sanidadeMax: membro.sanidadeMax ?? (membro.mentalMax ?? 50),
      recursoAtual: membro.recursoAtual ?? (membro.estaminaAtual ?? 80),
      recursoMax: membro.recursoMax ?? (membro.estaminaMax ?? 80),
      recursoNome: membro.recursoNome || 'Estamina',
      atributos: membro.atributos || { HPR: 1, PRX: 1, PSI: 1, QI: 1 },
      periciasTop: Array.isArray(membro.periciasTop) ? membro.periciasTop : [],
      condicoes: Array.isArray(membro.condicoes) ? membro.condicoes : [],
      conquistasIndividuais: Array.isArray(membro.conquistasIndividuais) ? membro.conquistasIndividuais : [],
      conquistasSecretas: Array.isArray(membro.conquistasSecretas) ? membro.conquistasSecretas : [],
      conquistasEquipe: Array.isArray(membro.conquistasEquipe) ? membro.conquistasEquipe : [],
      trocarPorCodinome: !!membro.trocarPorCodinome,
      identidadeReal: membro.identidadeReal || '',
      codinomeOriginal: membro.codinomeOriginal || '',
      reveladoPara: Array.isArray(membro.reveladoPara) ? membro.reveladoPara : [],
      online: !!membro.online,
      ultimoVisto: membro.ultimoVisto || Date.now()
    });
  });

  return {
    codigo: sala.codigo,
    nome: sala.nome,
    criadorId: sala.criadorId,
    criadorNome: sala.criadorNome,
    criadoEm: sala.criadoEm,
    totalMembros: membrosArr.length,
    membrosOnline: membrosArr.filter(m => m.online).length,
    membros: membrosArr,
    conquistasEquipe: Array.from(sala.conquistasEquipe),
    diarioSessao: sala.diarioSessao || '',
    historico: sala.historico.slice(-100)
  };
}

// REST endpoints para consulta e fallback de sincronização
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), totalSalas: salasCampanhas.size });
});

app.get('/api/campanhas/:codigo', (req, res) => {
  const sala = salasCampanhas.get(String(req.params.codigo).toUpperCase());
  if (!sala) {
    return res.status(404).json({ erro: 'Campanha não encontrada.' });
  }
  res.json(serializarSala(sala));
});

app.post('/api/campanhas/:codigo/entrar', (req, res) => {
  const cod = String(req.params.codigo || '').trim().toUpperCase();
  const { jogador, nomeCampanha } = req.body || {};
  if (!cod) return res.status(400).json({ erro: 'Código inválido' });

  const sala = obterOuCriarSala(cod, nomeCampanha, jogador?.id, jogador?.nomeJogador || jogador?.nomePersonagem);
  if (!sala) return res.status(500).json({ erro: 'Falha ao obter sala' });

  const jogadorId = jogador?.id || ('ply_' + Math.random().toString(36).substr(2, 9));
  const ehCriadorOriginal = (sala.criadorId === jogadorId);
  let mestrePermitido = ehCriadorOriginal;
  if (!mestrePermitido && sala.membros.has(jogadorId)) {
    mestrePermitido = !!sala.membros.get(jogadorId)?.isMestre;
  }

  const jogadorInfo = {
    id: jogadorId,
    nomePersonagem: jogador?.nomePersonagem || 'Personagem',
    nomeJogador: jogador?.nomeJogador || 'Jogador',
    avatar: jogador?.avatar || '',
    isMestre: mestrePermitido,
    classe1: jogador?.classe1 || '',
    classe2: jogador?.classe2 || '',
    nivel: jogador?.nivel || '',
    corTema: jogador?.corTema || '#c9b183',
    vidaAtual: jogador?.vidaAtual ?? 100,
    vidaMax: jogador?.vidaMax ?? 100,
    vidaTemp: jogador?.vidaTemp ?? 0,
    estaminaAtual: jogador?.estaminaAtual ?? 80,
    estaminaMax: jogador?.estaminaMax ?? 80,
    estaminaTemp: jogador?.estaminaTemp ?? 0,
    mentalAtual: jogador?.mentalAtual ?? 50,
    mentalMax: jogador?.mentalMax ?? 50,
    mentalTemp: jogador?.mentalTemp ?? 0,
    auraAtual: jogador?.auraAtual ?? 30,
    auraMax: jogador?.auraMax ?? 30,
    auraTemp: jogador?.auraTemp ?? 0,
    sanidadeAtual: jogador?.sanidadeAtual ?? (jogador?.mentalAtual ?? 50),
    sanidadeMax: jogador?.sanidadeMax ?? (jogador?.mentalMax ?? 50),
    recursoAtual: jogador?.recursoAtual ?? (jogador?.estaminaAtual ?? 80),
    recursoMax: jogador?.recursoMax ?? (jogador?.estaminaMax ?? 80),
    recursoNome: jogador?.recursoNome || 'Estamina',
    atributos: jogador?.atributos || { HPR: 1, PRX: 1, PSI: 1, QI: 1 },
    periciasTop: Array.isArray(jogador?.periciasTop) ? jogador.periciasTop : [],
    condicoes: Array.isArray(jogador?.condicoes) ? jogador.condicoes : [],
    conquistasIndividuais: Array.isArray(jogador?.conquistasIndividuais) ? jogador.conquistasIndividuais : [],
    conquistasSecretas: Array.isArray(jogador?.conquistasSecretas) ? jogador.conquistasSecretas : [],
    conquistasEquipe: Array.isArray(jogador?.conquistasEquipe) ? jogador.conquistasEquipe : [],
    trocarPorCodinome: !!jogador?.trocarPorCodinome,
    identidadeReal: jogador?.identidadeReal || '',
    codinomeOriginal: jogador?.codinomeOriginal || '',
    reveladoPara: Array.isArray(jogador?.reveladoPara) ? jogador.reveladoPara : [],
    online: true,
    ultimoVisto: Date.now()
  };

  sala.membros.set(jogadorId, jogadorInfo);

  if (Array.isArray(jogador?.conquistasEquipe)) {
    jogador.conquistasEquipe.forEach(cqId => sala.conquistasEquipe.add(cqId));
  }

  res.json({
    type: 'sala_conectada',
    sala: serializarSala(sala),
    conquistasEquipeParaSincronizar: Array.from(sala.conquistasEquipe)
  });
});

app.post('/api/campanhas/:codigo/sync', (req, res) => {
  const cod = String(req.params.codigo || '').trim().toUpperCase();
  const { jogador } = req.body || {};
  if (!cod) return res.status(400).json({ erro: 'Código inválido' });

  let sala = salasCampanhas.get(cod);
  if (!sala) {
    sala = obterOuCriarSala(cod, null, jogador?.id, jogador?.nomeJogador || jogador?.nomePersonagem);
  }

  if (jogador && jogador.id) {
    if (sala.membros.has(jogador.id)) {
      const membro = sala.membros.get(jogador.id);
      Object.assign(membro, jogador, { online: true, ultimoVisto: Date.now() });
    } else {
      sala.membros.set(jogador.id, {
        id: jogador.id,
        nomePersonagem: jogador.nomePersonagem || 'Personagem',
        nomeJogador: jogador.nomeJogador || 'Jogador',
        avatar: jogador.avatar || '',
        isMestre: (sala.criadorId === jogador.id),
        classe1: jogador.classe1 || '',
        classe2: jogador.classe2 || '',
        nivel: jogador.nivel || '',
        corTema: jogador.corTema || '#c9b183',
        vidaAtual: jogador.vidaAtual ?? 100,
        vidaMax: jogador.vidaMax ?? 100,
        vidaTemp: jogador.vidaTemp ?? 0,
        estaminaAtual: jogador.estaminaAtual ?? 80,
        estaminaMax: jogador.estaminaMax ?? 80,
        estaminaTemp: jogador.estaminaTemp ?? 0,
        mentalAtual: jogador.mentalAtual ?? 50,
        mentalMax: jogador.mentalMax ?? 50,
        mentalTemp: jogador.mentalTemp ?? 0,
        auraAtual: jogador.auraAtual ?? 30,
        auraMax: jogador.auraMax ?? 30,
        auraTemp: jogador.auraTemp ?? 0,
        sanidadeAtual: jogador.sanidadeAtual ?? 50,
        sanidadeMax: jogador.sanidadeMax ?? 50,
        recursoAtual: jogador.recursoAtual ?? 80,
        recursoMax: jogador.recursoMax ?? 80,
        recursoNome: jogador.recursoNome || 'Estamina',
        atributos: jogador.atributos || { HPR: 1, PRX: 1, PSI: 1, QI: 1 },
        periciasTop: Array.isArray(jogador.periciasTop) ? jogador.periciasTop : [],
        condicoes: Array.isArray(jogador.condicoes) ? jogador.condicoes : [],
        conquistasIndividuais: Array.isArray(jogador.conquistasIndividuais) ? jogador.conquistasIndividuais : [],
        conquistasSecretas: Array.isArray(jogador.conquistasSecretas) ? jogador.conquistasSecretas : [],
        conquistasEquipe: Array.isArray(jogador.conquistasEquipe) ? jogador.conquistasEquipe : [],
        trocarPorCodinome: !!jogador.trocarPorCodinome,
        identidadeReal: jogador.identidadeReal || '',
        codinomeOriginal: jogador.codinomeOriginal || '',
        reveladoPara: Array.isArray(jogador.reveladoPara) ? jogador.reveladoPara : [],
        online: true,
        ultimoVisto: Date.now()
      });
    }
  }

  if (Array.isArray(jogador?.conquistasEquipe)) {
    jogador.conquistasEquipe.forEach(cqId => sala.conquistasEquipe.add(cqId));
  }

  broadcastParaSala(cod, {
    type: 'sala_atualizada',
    sala: serializarSala(sala)
  });

  res.json({
    sala: serializarSala(sala),
    conquistasEquipe: Array.from(sala.conquistasEquipe)
  });
});

app.post('/api/campanhas/:codigo/rolagem', (req, res) => {
  const cod = String(req.params.codigo || '').trim().toUpperCase();
  const { rolagem, jogadorNome } = req.body || {};
  const sala = salasCampanhas.get(cod);
  if (!sala || !rolagem) return res.status(400).json({ erro: 'Dados inválidos' });

  const logRolagem = {
    id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    tipo: 'rolagem',
    texto: `🎲 ${jogadorNome || 'Jogador'} rolou ${rolagem.pericia || 'Atributo'}: ${rolagem.resultadoFinal} (${rolagem.faixaNome})`,
    rolagem: rolagem,
    autor: jogadorNome || 'Jogador',
    data: Date.now()
  };
  sala.historico.push(logRolagem);

  broadcastParaSala(cod, {
    type: 'rolagem_recebida',
    rolagem: rolagem,
    jogadorNome: jogadorNome || 'Jogador',
    evento: logRolagem,
    sala: serializarSala(sala)
  });

  res.json({ ok: true, evento: logRolagem });
});

app.post('/api/campanhas/:codigo/chat', (req, res) => {
  const cod = String(req.params.codigo || '').trim().toUpperCase();
  const { texto, autor } = req.body || {};
  const sala = salasCampanhas.get(cod);
  if (!sala || !texto) return res.status(400).json({ erro: 'Dados inválidos' });

  const logMsg = {
    id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    tipo: 'chat',
    texto: texto.slice(0, 500),
    autor: autor || 'Jogador',
    data: Date.now()
  };
  sala.historico.push(logMsg);

  broadcastParaSala(cod, {
    type: 'mensagem_chat_recebida',
    mensagem: logMsg,
    sala: serializarSala(sala)
  });

  res.json({ ok: true, mensagem: logMsg });
});

app.post('/api/campanhas/:codigo/alerta', (req, res) => {
  const cod = String(req.params.codigo || '').trim().toUpperCase();
  const { alerta, autor } = req.body || {};
  const sala = salasCampanhas.get(cod);
  if (!sala || !alerta) return res.status(400).json({ erro: 'Dados inválidos' });

  const logAlerta = {
    id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    tipo: 'alerta_mestre',
    texto: `⚠️ [ALERTA DO MESTRE] ${alerta.titulo}: ${alerta.msg}`,
    alerta: alerta,
    autor: autor || 'Mestre',
    data: Date.now()
  };
  sala.historico.push(logAlerta);

  broadcastParaSala(cod, {
    type: 'alerta_mestre_recebido',
    alerta: alerta,
    autor: autor || 'Mestre',
    evento: logAlerta,
    sala: serializarSala(sala)
  });

  res.json({ ok: true, evento: logAlerta });
});

app.post('/api/campanhas/:codigo/diario', (req, res) => {
  const cod = String(req.params.codigo || '').trim().toUpperCase();
  const { texto, autor } = req.body || {};
  const sala = salasCampanhas.get(cod);
  if (!sala) return res.status(404).json({ erro: 'Sala não encontrada' });

  sala.diarioSessao = texto || '';
  const logDiario = {
    id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    tipo: 'diario_atualizado',
    texto: `📖 Diário de sessão atualizado por ${autor || 'Mestre'}.`,
    data: Date.now()
  };
  sala.historico.push(logDiario);

  broadcastParaSala(cod, {
    type: 'diario_sessao_atualizado',
    texto: sala.diarioSessao,
    autor: autor || 'Mestre',
    sala: serializarSala(sala)
  });

  res.json({ ok: true });
});

app.post('/api/campanhas/:codigo/conquista-equipe', (req, res) => {
  const cod = String(req.params.codigo || '').trim().toUpperCase();
  const { conquista, desbloqueadoPor } = req.body || {};
  const sala = salasCampanhas.get(cod);
  if (!sala || !conquista || !conquista.id) return res.status(400).json({ erro: 'Dados inválidos' });

  sala.conquistasEquipe.add(conquista.id);
  const logConq = {
    id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    tipo: 'conquista_equipe',
    texto: `🤝 FEITO DE EQUIPE DESBLOQUEADO: "${conquista.titulo}" por ${desbloqueadoPor || 'Equipe'}! (+${conquista.pontos || 0} pts)`,
    conquista: conquista,
    data: Date.now()
  };
  sala.historico.push(logConq);

  broadcastParaSala(cod, {
    type: 'conquista_equipe_recebida',
    conquista: conquista,
    desbloqueadoPor: desbloqueadoPor || 'Equipe',
    sala: serializarSala(sala),
    evento: logConq
  });

  res.json({ ok: true, sala: serializarSala(sala) });
});

app.post('/api/campanhas/:codigo/transferir-item', (req, res) => {
  const cod = String(req.params.codigo || '').trim().toUpperCase();
  const { destinatarioId, item, remetenteNome } = req.body || {};
  const sala = salasCampanhas.get(cod);
  if (!sala || !destinatarioId || !item) return res.status(400).json({ erro: 'Dados inválidos' });

  const destMembro = sala.membros.get(destinatarioId);
  const nomeDest = destMembro ? (destMembro.nomePersonagem || destMembro.nomeJogador) : 'Aliado';

  const logTransf = {
    id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    tipo: 'item_transferido',
    texto: `📦 ${remetenteNome || 'Jogador'} transferiu "${item.nome || 'Item'}" para ${nomeDest}.`,
    data: Date.now()
  };
  sala.historico.push(logTransf);

  broadcastParaSala(cod, {
    type: 'item_transferido_recebido',
    destinatarioId: destinatarioId,
    remetenteNome: remetenteNome || 'Jogador',
    item: item,
    evento: logTransf,
    sala: serializarSala(sala)
  });

  res.json({ ok: true });
});

app.get(['/planta', '/planta.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'planta.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function broadcastParaSala(codigo, payload, excetoWsId = null) {
  const sala = salasCampanhas.get(codigo);
  if (!sala) return;
  const msg = JSON.stringify(payload);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client.salaCodigo === codigo) {
      if (!excetoWsId || client.id !== excetoWsId) {
        client.send(msg);
      }
    }
  });
}

// Heartbeat periódico a cada 20 segundos para manter conexões ativas e vivas em qualquer dispositivo/proxy
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach(ws => {
    if (ws.isAlive === false) {
      return ws.terminate();
    }
    ws.isAlive = false;
    try {
      ws.ping();
      ws.send(JSON.stringify({ type: 'server_ping', timestamp: Date.now() }));
    } catch(e) {}
  });
}, 20000);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});

wss.on('connection', (ws) => {
  ws.id = 'ws_' + Math.random().toString(36).substr(2, 9);
  ws.salaCodigo = null;
  ws.jogadorId = null;
  ws.jogadorInfo = null;
  ws.isAlive = true;

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      const { type } = msg;
      ws.isAlive = true;

      if (type === 'ping') {
        return ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      }

      if (type === 'client_pong') {
        return;
      }

      if (type === 'criar_ou_entrar_sala') {
        const { codigo, nomeCampanha, jogador } = msg;
        const cod = String(codigo || '').trim().toUpperCase();
        if (!cod) {
          return ws.send(JSON.stringify({ type: 'erro', mensagem: 'Código de campanha inválido.' }));
        }

        if (ws.salaCodigo && ws.salaCodigo !== cod) {
          const salaAntiga = salasCampanhas.get(ws.salaCodigo);
          if (salaAntiga && ws.jogadorId && salaAntiga.membros.has(ws.jogadorId)) {
            const membro = salaAntiga.membros.get(ws.jogadorId);
            membro.online = false;
            membro.ultimoVisto = Date.now();
            broadcastParaSala(ws.salaCodigo, {
              type: 'sala_atualizada',
              sala: serializarSala(salaAntiga)
            });
          }
        }

        const sala = obterOuCriarSala(cod, nomeCampanha, jogador?.id, jogador?.nomeJogador || jogador?.nomePersonagem);
        ws.salaCodigo = cod;
        const jogadorId = jogador?.id || ('ply_' + Math.random().toString(36).substr(2, 9));
        ws.jogadorId = jogadorId;
        
        const ehCriadorOriginal = (sala.criadorId === jogadorId);
        let mestrePermitido = ehCriadorOriginal;
        if (!mestrePermitido && sala.membros.has(jogadorId)) {
          mestrePermitido = !!sala.membros.get(jogadorId)?.isMestre;
        }

        ws.jogadorInfo = {
          id: jogadorId,
          nomePersonagem: jogador?.nomePersonagem || 'Personagem',
          nomeJogador: jogador?.nomeJogador || 'Jogador',
          avatar: jogador?.avatar || '',
          isMestre: mestrePermitido,
          classe1: jogador?.classe1 || '',
          classe2: jogador?.classe2 || '',
          nivel: jogador?.nivel || '',
          corTema: jogador?.corTema || '#c9b183',
          vidaAtual: jogador?.vidaAtual ?? 100,
          vidaMax: jogador?.vidaMax ?? 100,
          vidaTemp: jogador?.vidaTemp ?? 0,
          estaminaAtual: jogador?.estaminaAtual ?? 80,
          estaminaMax: jogador?.estaminaMax ?? 80,
          estaminaTemp: jogador?.estaminaTemp ?? 0,
          mentalAtual: jogador?.mentalAtual ?? 50,
          mentalMax: jogador?.mentalMax ?? 50,
          mentalTemp: jogador?.mentalTemp ?? 0,
          auraAtual: jogador?.auraAtual ?? 30,
          auraMax: jogador?.auraMax ?? 30,
          auraTemp: jogador?.auraTemp ?? 0,
          sanidadeAtual: jogador?.sanidadeAtual ?? (jogador?.mentalAtual ?? 50),
          sanidadeMax: jogador?.sanidadeMax ?? (jogador?.mentalMax ?? 50),
          recursoAtual: jogador?.recursoAtual ?? (jogador?.estaminaAtual ?? 80),
          recursoMax: jogador?.recursoMax ?? (jogador?.estaminaMax ?? 80),
          recursoNome: jogador?.recursoNome || 'Estamina',
          atributos: jogador?.atributos || { HPR: 1, PRX: 1, PSI: 1, QI: 1 },
          periciasTop: Array.isArray(jogador?.periciasTop) ? jogador.periciasTop : [],
          condicoes: Array.isArray(jogador?.condicoes) ? jogador.condicoes : [],
          conquistasIndividuais: Array.isArray(jogador?.conquistasIndividuais) ? jogador.conquistasIndividuais : [],
          conquistasSecretas: Array.isArray(jogador?.conquistasSecretas) ? jogador.conquistasSecretas : [],
          conquistasEquipe: Array.isArray(jogador?.conquistasEquipe) ? jogador.conquistasEquipe : [],
          trocarPorCodinome: !!jogador?.trocarPorCodinome,
          identidadeReal: jogador?.identidadeReal || '',
          codinomeOriginal: jogador?.codinomeOriginal || '',
          reveladoPara: Array.isArray(jogador?.reveladoPara) ? jogador.reveladoPara : [],
          online: true,
          ultimoVisto: Date.now()
        };

        sala.membros.set(jogadorId, ws.jogadorInfo);

        if (Array.isArray(jogador?.conquistasEquipe)) {
          jogador.conquistasEquipe.forEach(cqId => sala.conquistasEquipe.add(cqId));
        }

        const logEntrada = {
          id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          tipo: 'membro_conectou',
          texto: `${ws.jogadorInfo.nomePersonagem} (${ws.jogadorInfo.nomeJogador}) conectou-se à campanha.`,
          autor: ws.jogadorInfo.nomePersonagem,
          data: Date.now()
        };
        sala.historico.push(logEntrada);

        ws.send(JSON.stringify({
          type: 'sala_conectada',
          sala: serializarSala(sala),
          conquistasEquipeParaSincronizar: Array.from(sala.conquistasEquipe)
        }));

        broadcastParaSala(cod, {
          type: 'membro_entrou',
          membro: ws.jogadorInfo,
          sala: serializarSala(sala),
          evento: logEntrada
        }, ws.id);

      } else if (type === 'atualizar_meu_estado') {
        if (!ws.salaCodigo || !ws.jogadorId) return;
        const sala = salasCampanhas.get(ws.salaCodigo);
        if (!sala) return;

        const { jogador } = msg;
        if (ws.jogadorInfo && jogador) {
          Object.assign(ws.jogadorInfo, {
            nomePersonagem: jogador.nomePersonagem || ws.jogadorInfo.nomePersonagem,
            nomeJogador: jogador.nomeJogador || ws.jogadorInfo.nomeJogador,
            avatar: jogador.avatar !== undefined ? jogador.avatar : ws.jogadorInfo.avatar,
            isMestre: jogador.isMestre !== undefined ? !!jogador.isMestre : ws.jogadorInfo.isMestre,
            classe1: jogador.classe1 !== undefined ? jogador.classe1 : ws.jogadorInfo.classe1,
            classe2: jogador.classe2 !== undefined ? jogador.classe2 : ws.jogadorInfo.classe2,
            nivel: jogador.nivel !== undefined ? jogador.nivel : ws.jogadorInfo.nivel,
            corTema: jogador.corTema !== undefined ? jogador.corTema : ws.jogadorInfo.corTema,
            vidaAtual: jogador.vidaAtual !== undefined ? jogador.vidaAtual : ws.jogadorInfo.vidaAtual,
            vidaMax: jogador.vidaMax !== undefined ? jogador.vidaMax : ws.jogadorInfo.vidaMax,
            vidaTemp: jogador.vidaTemp !== undefined ? jogador.vidaTemp : ws.jogadorInfo.vidaTemp,
            estaminaAtual: jogador.estaminaAtual !== undefined ? jogador.estaminaAtual : ws.jogadorInfo.estaminaAtual,
            estaminaMax: jogador.estaminaMax !== undefined ? jogador.estaminaMax : ws.jogadorInfo.estaminaMax,
            estaminaTemp: jogador.estaminaTemp !== undefined ? jogador.estaminaTemp : ws.jogadorInfo.estaminaTemp,
            mentalAtual: jogador.mentalAtual !== undefined ? jogador.mentalAtual : ws.jogadorInfo.mentalAtual,
            mentalMax: jogador.mentalMax !== undefined ? jogador.mentalMax : ws.jogadorInfo.mentalMax,
            mentalTemp: jogador.mentalTemp !== undefined ? jogador.mentalTemp : ws.jogadorInfo.mentalTemp,
            auraAtual: jogador.auraAtual !== undefined ? jogador.auraAtual : ws.jogadorInfo.auraAtual,
            auraMax: jogador.auraMax !== undefined ? jogador.auraMax : ws.jogadorInfo.auraMax,
            auraTemp: jogador.auraTemp !== undefined ? jogador.auraTemp : ws.jogadorInfo.auraTemp,
            sanidadeAtual: jogador.sanidadeAtual !== undefined ? jogador.sanidadeAtual : ws.jogadorInfo.sanidadeAtual,
            sanidadeMax: jogador.sanidadeMax !== undefined ? jogador.sanidadeMax : ws.jogadorInfo.sanidadeMax,
            recursoAtual: jogador.recursoAtual !== undefined ? jogador.recursoAtual : ws.jogadorInfo.recursoAtual,
            recursoMax: jogador.recursoMax !== undefined ? jogador.recursoMax : ws.jogadorInfo.recursoMax,
            recursoNome: jogador.recursoNome || ws.jogadorInfo.recursoNome,
            atributos: jogador.atributos || ws.jogadorInfo.atributos,
            periciasTop: Array.isArray(jogador.periciasTop) ? jogador.periciasTop : ws.jogadorInfo.periciasTop,
            condicoes: Array.isArray(jogador.condicoes) ? jogador.condicoes : ws.jogadorInfo.condicoes,
            conquistasIndividuais: jogador.conquistasIndividuais || ws.jogadorInfo.conquistasIndividuais,
            conquistasSecretas: jogador.conquistasSecretas || ws.jogadorInfo.conquistasSecretas,
            conquistasEquipe: jogador.conquistasEquipe || ws.jogadorInfo.conquistasEquipe,
            trocarPorCodinome: jogador.trocarPorCodinome !== undefined ? !!jogador.trocarPorCodinome : ws.jogadorInfo.trocarPorCodinome,
            identidadeReal: jogador.identidadeReal !== undefined ? jogador.identidadeReal : ws.jogadorInfo.identidadeReal,
            codinomeOriginal: jogador.codinomeOriginal !== undefined ? jogador.codinomeOriginal : ws.jogadorInfo.codinomeOriginal,
            reveladoPara: Array.isArray(jogador.reveladoPara) ? jogador.reveladoPara : ws.jogadorInfo.reveladoPara,
            online: true,
            ultimoVisto: Date.now()
          });
          sala.membros.set(ws.jogadorId, ws.jogadorInfo);

          broadcastParaSala(ws.salaCodigo, {
            type: 'sala_atualizada',
            sala: serializarSala(sala)
          });
        }

      } else if (type === 'alterar_papel_membro') {
        if (!ws.salaCodigo) return;
        const sala = salasCampanhas.get(ws.salaCodigo);
        if (!sala) return;

        const { alvoId, novoIsMestre } = msg;
        if (!alvoId) return;

        const ehCriador = (sala.criadorId === ws.jogadorInfo?.id);
        const ehMestre = !!ws.jogadorInfo?.isMestre;

        if (!ehCriador && !ehMestre) {
          return ws.send(JSON.stringify({ type: 'erro', mensagem: 'Apenas o Mestre pode alterar papéis da sala.' }));
        }

        if (alvoId === sala.criadorId && !novoIsMestre) {
          return ws.send(JSON.stringify({ type: 'erro', mensagem: 'O criador original da sala permanece Mestre.' }));
        }

        let alterado = false;
        let nomeAlvo = 'Membro';
        sala.membros.forEach((membro) => {
          if (membro.id === alvoId) {
            membro.isMestre = !!novoIsMestre;
            nomeAlvo = membro.nomePersonagem || membro.nomeJogador || 'Membro';
            alterado = true;
          }
        });

        if (alterado) {
          const logPapel = {
            id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            tipo: 'alteracao_papel',
            texto: `🎭 ${nomeAlvo} foi ${novoIsMestre ? 'promovido(a) a Mestre' : 'rebaixado(a) a Jogador'} por ${ws.jogadorInfo?.nomePersonagem || 'Mestre'}.`,
            data: Date.now()
          };
          sala.historico.push(logPapel);

          broadcastParaSala(ws.salaCodigo, {
            type: 'sala_atualizada',
            sala: serializarSala(sala),
            evento: logPapel
          });
        }

      } else if (type === 'revelar_identidade_secreta') {
        if (!ws.salaCodigo) return;
        const sala = salasCampanhas.get(ws.salaCodigo);
        if (!sala) return;

        const { destinatarioId, remetenteId, identidadeReal, codinome } = msg;
        if (!destinatarioId) return;

        let socketDest = null;
        wss.clients.forEach(client => {
          if (client.salaCodigo === ws.salaCodigo && client.jogadorInfo?.id === destinatarioId) {
            socketDest = client;
          }
        });

        if (socketDest && socketDest.readyState === WebSocket.OPEN) {
          socketDest.send(JSON.stringify({
            type: 'revelar_identidade_secreta_recebido',
            remetenteId: remetenteId || ws.jogadorInfo?.id,
            remetenteNome: ws.jogadorInfo?.nomePersonagem || codinome || 'Aliado',
            identidadeReal: identidadeReal || 'Identidade Secreta',
            codinome: codinome || ws.jogadorInfo?.nomePersonagem || 'Codinome'
          }));
        }

      } else if (type === 'revogar_identidade_secreta') {
        if (!ws.salaCodigo) return;
        const sala = salasCampanhas.get(ws.salaCodigo);
        if (!sala) return;

        const { destinatarioId, remetenteId } = msg;
        if (!destinatarioId) return;

        let socketDest = null;
        wss.clients.forEach(client => {
          if (client.salaCodigo === ws.salaCodigo && client.jogadorInfo?.id === destinatarioId) {
            socketDest = client;
          }
        });

        if (socketDest && socketDest.readyState === WebSocket.OPEN) {
          socketDest.send(JSON.stringify({
            type: 'revogar_identidade_secreta_recebido',
            remetenteId: remetenteId || ws.jogadorInfo?.id
          }));
        }

      } else if (type === 'transmitir_rolagem') {
        if (!ws.salaCodigo) return;
        const sala = salasCampanhas.get(ws.salaCodigo);
        if (!sala) return;

        const { rolagem, jogadorNome } = msg;
        if (!rolagem) return;

        const nomeDoJogador = jogadorNome || ws.jogadorInfo?.nomePersonagem || 'Personagem';
        const resFinal = rolagem.resultadoFinal !== undefined ? rolagem.resultadoFinal : (rolagem.total !== undefined ? rolagem.total : 0);
        const logRolagem = {
          id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          tipo: 'rolagem_dado',
          jogador: nomeDoJogador,
          rolagem: rolagem,
          texto: `🎲 ${nomeDoJogador} rolou ${rolagem.pericia || 'Dados'}: Total ${resFinal} (${rolagem.faixaNome || ''})`,
          data: Date.now()
        };
        sala.historico.push(logRolagem);

        broadcastParaSala(ws.salaCodigo, {
          type: 'rolagem_recebida',
          evento: logRolagem,
          rolagem: rolagem,
          jogadorNome: nomeDoJogador,
          sala: serializarSala(sala)
        });

      } else if (type === 'transferir_item') {
        if (!ws.salaCodigo) return;
        const sala = salasCampanhas.get(ws.salaCodigo);
        if (!sala) return;

        const { item, destinatarioId } = msg;
        if (!item || !destinatarioId) return;

        let socketDestinatario = null;
        let nomeDestinatario = 'Outro jogador';

        wss.clients.forEach(client => {
          if (client.salaCodigo === ws.salaCodigo && client.jogadorInfo?.id === destinatarioId) {
            socketDestinatario = client;
            nomeDestinatario = client.jogadorInfo.nomePersonagem;
          }
        });

        const logTransf = {
          id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          tipo: 'transferencia_item',
          remetente: ws.jogadorInfo?.nomePersonagem || 'Um jogador',
          destinatario: nomeDestinatario,
          itemNome: item.nome,
          texto: `📦 ${ws.jogadorInfo?.nomePersonagem} entregou "${item.nome}" para ${nomeDestinatario}.`,
          data: Date.now()
        };
        sala.historico.push(logTransf);

        if (socketDestinatario && socketDestinatario.readyState === WebSocket.OPEN) {
          socketDestinatario.send(JSON.stringify({
            type: 'item_recebido',
            item: item,
            remetenteNome: ws.jogadorInfo?.nomePersonagem || 'Um aliado',
            evento: logTransf
          }));
        }

        broadcastParaSala(ws.salaCodigo, {
          type: 'sala_atualizada',
          sala: serializarSala(sala),
          evento: logTransf
        });

      } else if (type === 'alerta_mestre') {
        if (!ws.salaCodigo) return;
        const sala = salasCampanhas.get(ws.salaCodigo);
        if (!sala) return;

        const { alerta } = msg;
        if (!alerta || !alerta.trim()) return;

        const logAlerta = {
          id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          tipo: 'alerta_mestre',
          texto: alerta.trim(),
          autor: ws.jogadorInfo?.nomePersonagem || 'Mestre',
          data: Date.now()
        };
        sala.historico.push(logAlerta);

        broadcastParaSala(ws.salaCodigo, {
          type: 'alerta_mestre_recebido',
          alerta: alerta.trim(),
          autor: ws.jogadorInfo?.nomePersonagem || 'Mestre',
          evento: logAlerta,
          sala: serializarSala(sala)
        });

      } else if (type === 'atualizar_diario_sessao') {
        if (!ws.salaCodigo) return;
        const sala = salasCampanhas.get(ws.salaCodigo);
        if (!sala) return;

        const { texto } = msg;
        sala.diarioSessao = texto || '';

        broadcastParaSala(ws.salaCodigo, {
          type: 'diario_atualizado',
          diarioSessao: sala.diarioSessao,
          autor: ws.jogadorInfo?.nomePersonagem || 'Membro'
        }, ws.id);

      } else if (type === 'enviar_sussurro') {
        if (!ws.salaCodigo) return;
        const sala = salasCampanhas.get(ws.salaCodigo);
        if (!sala) return;

        const agora = Date.now();
        ws.chatTimestamps = (ws.chatTimestamps || []).filter(t => (agora - t) < 120000);
        if (ws.chatTimestamps.length >= 8) {
          return ws.send(JSON.stringify({
            type: 'erro_spam',
            mensagem: 'Limite anti-spam atingido no servidor (máx. 8 mensagens a cada 2 minutos).'
          }));
        }
        ws.chatTimestamps.push(agora);

        const { texto, destinatarioId } = msg;
        if (!texto || !texto.trim() || !destinatarioId) return;

        let socketDest = null;
        let nomeDest = 'Outro jogador';

        wss.clients.forEach(client => {
          if (client.salaCodigo === ws.salaCodigo && client.jogadorInfo?.id === destinatarioId) {
            socketDest = client;
            nomeDest = client.jogadorInfo.nomePersonagem;
          }
        });

        const eventoSussurro = {
          id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          tipo: 'sussurro',
          remetente: ws.jogadorInfo?.nomePersonagem || 'Membro',
          remetenteId: ws.jogadorInfo?.id,
          destinatario: nomeDest,
          destinatarioId: destinatarioId,
          texto: texto.trim(),
          data: Date.now()
        };

        ws.send(JSON.stringify({
          type: 'sussurro_recebido',
          evento: eventoSussurro
        }));

        if (socketDest && socketDest !== ws && socketDest.readyState === WebSocket.OPEN) {
          socketDest.send(JSON.stringify({
            type: 'sussurro_recebido',
            evento: eventoSussurro
          }));
        }

      } else if (type === 'desbloquear_conquista_equipe') {
        if (!ws.salaCodigo) return;
        const sala = salasCampanhas.get(ws.salaCodigo);
        if (!sala) return;

        const { conquista, desbloqueadoPor } = msg;
        if (!conquista || !conquista.id) return;

        sala.conquistasEquipe.add(conquista.id);

        const logEquipe = {
          id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          tipo: 'conquista_equipe_desbloqueada',
          conquista: conquista,
          desbloqueadoPor: desbloqueadoPor || ws.jogadorInfo?.nomePersonagem || 'Um membro da equipe',
          texto: `🎉 CONQUISTA DE EQUIPE DESBLOQUEADA: "${conquista.titulo}" por ${desbloqueadoPor || ws.jogadorInfo?.nomePersonagem || 'Membro'}! (+${conquista.pontos || 0} pts para todo o grupo)`,
          data: Date.now()
        };
        sala.historico.push(logEquipe);

        broadcastParaSala(ws.salaCodigo, {
          type: 'conquista_equipe_recebida',
          conquista: conquista,
          desbloqueadoPor: desbloqueadoPor || ws.jogadorInfo?.nomePersonagem || 'Um membro',
          sala: serializarSala(sala),
          evento: logEquipe
        });

      } else if (type === 'notificar_conquista_individual_ou_secreta') {
        if (!ws.salaCodigo) return;
        const sala = salasCampanhas.get(ws.salaCodigo);
        if (!sala) return;

        const { conquista, tipoConquista, jogadorNome } = msg;
        if (!conquista) return;

        const labelTipo = tipoConquista === 'secreta' ? '🔮 Conquista Secreta' : '👤 Conquista Individual';
        const logIndiv = {
          id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          tipo: tipoConquista === 'secreta' ? 'conquista_secreta' : 'conquista_individual',
          conquista: conquista,
          desbloqueadoPor: jogadorNome || ws.jogadorInfo?.nomePersonagem || 'Jogador',
          texto: `${labelTipo} "${conquista.titulo}" desbloqueada por ${jogadorNome || ws.jogadorInfo?.nomePersonagem}!`,
          data: Date.now()
        };
        sala.historico.push(logIndiv);

        if (ws.jogadorInfo) {
          if (tipoConquista === 'secreta') {
            if (!ws.jogadorInfo.conquistasSecretas.includes(conquista.id)) {
              ws.jogadorInfo.conquistasSecretas.push(conquista.id);
            }
          } else {
            if (!ws.jogadorInfo.conquistasIndividuais.includes(conquista.id)) {
              ws.jogadorInfo.conquistasIndividuais.push(conquista.id);
            }
          }
        }

        broadcastParaSala(ws.salaCodigo, {
          type: 'conquista_membro_notificada',
          conquista: conquista,
          tipoConquista: tipoConquista,
          jogadorNome: jogadorNome || ws.jogadorInfo?.nomePersonagem,
          sala: serializarSala(sala),
          evento: logIndiv
        });

      } else if (type === 'enviar_mensagem_chat') {
        if (!ws.salaCodigo) return;
        const sala = salasCampanhas.get(ws.salaCodigo);
        if (!sala) return;

        const agora = Date.now();
        ws.chatTimestamps = (ws.chatTimestamps || []).filter(t => (agora - t) < 120000);
        if (ws.chatTimestamps.length >= 8) {
          return ws.send(JSON.stringify({
            type: 'erro_spam',
            mensagem: 'Limite anti-spam atingido no servidor (máx. 8 mensagens a cada 2 minutos).'
          }));
        }
        ws.chatTimestamps.push(agora);

        const { texto, autor } = msg;
        if (!texto || !texto.trim()) return;

        const logMsg = {
          id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          tipo: 'mensagem_chat',
          texto: texto.trim(),
          autor: autor || ws.jogadorInfo?.nomePersonagem || 'Membro',
          data: Date.now()
        };
        sala.historico.push(logMsg);

        broadcastParaSala(ws.salaCodigo, {
          type: 'mensagem_chat_recebida',
          evento: logMsg,
          sala: serializarSala(sala)
        });

      } else if (type === 'sair_sala') {
        if (ws.salaCodigo && ws.jogadorId) {
          const cod = ws.salaCodigo;
          const sala = salasCampanhas.get(cod);
          if (sala) {
            const nomeSaiu = ws.jogadorInfo?.nomePersonagem || 'Um jogador';
            sala.membros.delete(ws.jogadorId);
            const logSaida = {
              id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
              tipo: 'membro_saiu',
              texto: `${nomeSaiu} saiu da campanha.`,
              data: Date.now()
            };
            sala.historico.push(logSaida);
            broadcastParaSala(cod, {
              type: 'sala_atualizada',
              sala: serializarSala(sala),
              evento: logSaida
            });
          }
          ws.salaCodigo = null;
          ws.jogadorId = null;
          ws.jogadorInfo = null;
          ws.send(JSON.stringify({ type: 'saiu_sala' }));
        }
      }
    } catch (err) {
      console.error('Erro no processamento da mensagem WS:', err);
    }
  });

  ws.on('close', () => {
    if (ws.salaCodigo && ws.jogadorId) {
      const sala = salasCampanhas.get(ws.salaCodigo);
      if (sala && sala.membros.has(ws.jogadorId)) {
        const membro = sala.membros.get(ws.jogadorId);
        membro.online = false;
        membro.ultimoVisto = Date.now();
        broadcastParaSala(ws.salaCodigo, {
          type: 'sala_atualizada',
          sala: serializarSala(sala)
        });
      }
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
