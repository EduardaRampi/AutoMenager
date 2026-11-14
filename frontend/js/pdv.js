
const API_BASE_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : 'https://automenager-production.up.railway.app/api';

const API_URL = `${API_BASE_URL}/vendas`;

const pontoSelect = document.getElementById('ponto_id');
const funcionarioSelect = document.getElementById('funcionario_id');
const clienteSelect = document.getElementById('cliente_id');
const veiculosLista = document.getElementById('veiculos-lista');
const buscaVeiculo = document.getElementById('busca-veiculo');
const valorInput = document.getElementById('valor_venda');
const pagamentoSelect = document.getElementById('forma_pagamento');
const btnFinalizar = document.getElementById('btn-finalizar');
const mensagem = document.getElementById('mensagem');

let opcoes = {
  clientes: [],
  veiculos: [],
  funcionarios: [],
  pontos: []
};

let veiculoSelecionado = null;

function escaparHTML(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[c]);
}

function moeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

async function requisicao(url, config = {}) {
  const resposta = await fetch(url, config);
  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new Error(dados.message || 'Não foi possível concluir a operação.');
  }

  return dados;
}

function mostrarMensagem(texto, sucesso = false) {
  mensagem.textContent = texto;
  mensagem.classList.toggle('success', sucesso);
}

function atualizarFuncionarios() {
  const pontoId = pontoSelect.value;

  funcionarioSelect.innerHTML =
    '<option value="">Selecione o vendedor</option>';

  const funcionarios = opcoes.funcionarios.filter(
    f => String(f.ponto_id) === String(pontoId)
  );

  funcionarios.forEach(f => {
    const option = document.createElement('option');

    option.value = f.funcionario_id;
    option.textContent = `${f.nome}${f.cargo ? ` - ${f.cargo}` : ''}`;

    funcionarioSelect.appendChild(option);
  });

  funcionarioSelect.disabled = !pontoId || funcionarios.length === 0;

  if (pontoId && !funcionarios.length) {
    funcionarioSelect.innerHTML =
      '<option value="">Nenhum vendedor ativo nesta filial</option>';
  }
}

function veiculosDisponiveis() {
  const pontoId = pontoSelect.value;
  const termo = buscaVeiculo.value.trim().toLowerCase();

  return opcoes.veiculos.filter(v => {
    const mesmaFilial = String(v.ponto_id) === String(pontoId);

    const texto =
      `${v.marca} ${v.modelo} ${v.placa} ${v.ano}`.toLowerCase();

    return mesmaFilial && texto.includes(termo);
  });
}

function renderizarVeiculos() {
  const disponiveis = veiculosDisponiveis();

  veiculosLista.replaceChildren();

  if (!pontoSelect.value) {
    veiculosLista.innerHTML =
      '<p class="muted">Selecione uma filial para visualizar os veículos.</p>';
    return;
  }

  if (!disponiveis.length) {
    veiculosLista.innerHTML =
      '<p class="muted">Nenhum veículo disponível encontrado nesta filial.</p>';
    return;
  }

  disponiveis.forEach(v => {
    const card = document.createElement('button');

    card.type = 'button';

    card.className =
      `vehicle-card${
        veiculoSelecionado &&
        String(veiculoSelecionado.veiculo_id) === String(v.veiculo_id)
          ? ' selected'
          : ''
      }`;

    card.innerHTML = `
      <span class="vehicle-icon">🚘</span>

      <span class="vehicle-info">
        <strong>${escaparHTML(v.marca)} ${escaparHTML(v.modelo)}</strong>

        <small>
          ${escaparHTML(v.ano)} ·
          ${escaparHTML(v.cor || 'Cor não informada')} ·
          ${escaparHTML(v.placa || 'Sem placa')}
        </small>
      </span>

      <strong class="vehicle-price">${moeda(v.preco)}</strong>
    `;

    card.addEventListener('click', () => selecionarVeiculo(v));

    veiculosLista.appendChild(card);
  });
}

function selecionarVeiculo(v) {
  veiculoSelecionado = v;

  valorInput.value = Number(v.preco).toFixed(2);

  document.getElementById('veiculo-resumo').className =
    'selected-vehicle';

  document.getElementById('veiculo-resumo').innerHTML = `
    <span class="summary-label">VEÍCULO SELECIONADO</span>

    <strong>
      ${escaparHTML(v.marca)} ${escaparHTML(v.modelo)}
    </strong>

    <span>
      ${escaparHTML(v.ano)} · ${escaparHTML(v.cor || '-')}
    </span>

    <span>
      Placa: ${escaparHTML(v.placa || '-')}
    </span>
  `;

  document.getElementById('total-venda').textContent =
    moeda(valorInput.value);

  renderizarVeiculos();
  validarFormulario();
}

function validarFormulario() {
  btnFinalizar.disabled = !(
    pontoSelect.value &&
    funcionarioSelect.value &&
    clienteSelect.value &&
    veiculoSelecionado &&
    valorInput.value &&
    Number(valorInput.value) > 0 &&
    pagamentoSelect.value
  );
}

async function carregarOpcoes() {
  opcoes = await requisicao(`${API_URL}/opcoes`);

  pontoSelect.innerHTML =
    '<option value="">Selecione a filial</option>';

  opcoes.pontos.forEach(p => {
    const o = document.createElement('option');

    o.value = p.ponto_id;
    o.textContent = p.nome;

    pontoSelect.appendChild(o);
  });

  clienteSelect.innerHTML =
    '<option value="">Selecione o cliente</option>';

  opcoes.clientes.forEach(c => {
    const o = document.createElement('option');

    o.value = c.cliente_id;

    o.textContent =
      `${c.nome} ${c.sobrenome}${c.cpf ? ` · ${c.cpf}` : ''}`;

    clienteSelect.appendChild(o);
  });

  renderizarVeiculos();
}

pontoSelect.addEventListener('change', () => {
  atualizarFuncionarios();

  if (
    veiculoSelecionado &&
    String(veiculoSelecionado.ponto_id) !== pontoSelect.value
  ) {
    veiculoSelecionado = null;
    valorInput.value = '';

    document.getElementById('veiculo-resumo').className =
      'selected-vehicle empty-state';

    document.getElementById('veiculo-resumo').textContent =
      'Nenhum veículo selecionado';

    document.getElementById('total-venda').textContent = moeda(0);
  }

  renderizarVeiculos();
  validarFormulario();
});

buscaVeiculo.addEventListener('input', renderizarVeiculos);

[funcionarioSelect, clienteSelect, pagamentoSelect].forEach(el => {
  el.addEventListener('change', validarFormulario);
});

valorInput.addEventListener('input', () => {
  document.getElementById('total-venda').textContent =
    moeda(valorInput.value);

  validarFormulario();
});

btnFinalizar.addEventListener('click', async () => {
  if (!veiculoSelecionado) return;

  const dados = {
    cliente_id: clienteSelect.value,
    veiculo_id: veiculoSelecionado.veiculo_id,
    funcionario_id: funcionarioSelect.value,
    ponto_id: pontoSelect.value,
    valor_venda: valorInput.value,
    forma_pagamento: pagamentoSelect.value
  };

  btnFinalizar.disabled = true;
  btnFinalizar.textContent = 'Registrando venda...';

  mostrarMensagem('');

  try {
    const resultado = await requisicao(API_URL, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify(dados)
    });

    mostrarMensagem(
      `${resultado.message} Código da venda: #${resultado.venda_id}.`,
      true
    );

    opcoes = await requisicao(`${API_URL}/opcoes`);

    veiculoSelecionado = null;
    valorInput.value = '';
    pagamentoSelect.value = '';

    document.getElementById('veiculo-resumo').className =
      'selected-vehicle empty-state';

    document.getElementById('veiculo-resumo').textContent =
      'Nenhum veículo selecionado';

    document.getElementById('total-venda').textContent = moeda(0);

    renderizarVeiculos();
    validarFormulario();

  } catch (error) {
    mostrarMensagem(error.message);
    validarFormulario();

  } finally {
    btnFinalizar.textContent = 'Finalizar venda';
  }
});

async function iniciar() {
  try {
    await carregarOpcoes();

  } catch (error) {
    mostrarMensagem(error.message);

    veiculosLista.innerHTML =
      '<p class="muted">Erro ao carregar os dados do PDV.</p>';
  }
}

iniciar();
