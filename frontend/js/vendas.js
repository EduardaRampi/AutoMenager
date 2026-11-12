const API_BASE_URL =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/api'
        : 'https://automenager-production.up.railway.app/api';

const API_URL = `${API_BASE_URL}/vendas`;

const form = document.getElementById('venda-form');
const lista = document.getElementById('vendas-lista');
const painel = document.getElementById('painel-formulario');

const clienteSelect = document.getElementById('cliente_id');
const veiculoSelect = document.getElementById('veiculo_id');
const funcionarioSelect = document.getElementById('funcionario_id');
const pontoSelect = document.getElementById('ponto_id');
const valorInput = document.getElementById('valor_venda');

const mensagem = document.getElementById('form-message');
const btnSalvar = document.getElementById('btn-salvar');

let opcoes = {
    clientes: [],
    veiculos: [],
    funcionarios: [],
    pontos: []
};

let vendas = [];

function escaparHTML(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, caractere => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[caractere]);
}

async function requisicao(url, configuracao = {}) {
    const resposta = await fetch(url, configuracao);

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
        throw new Error(dados.message || 'Erro ao realizar operação.');
    }

    return dados;
}

function mostrarMensagem(texto, sucesso = false) {
    mensagem.textContent = texto;
    mensagem.classList.toggle('success', sucesso);
}

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function formatarData(data) {
    if (!data) return '-';

    const dataConvertida = new Date(data);

    if (Number.isNaN(dataConvertida.getTime())) return '-';

    return dataConvertida.toLocaleString('pt-BR');
}


// =====================================
// CARREGAR OPÇÕES DO FORMULÁRIO
// =====================================

async function carregarOpcoes() {
    opcoes = await requisicao(`${API_URL}/opcoes`);

    clienteSelect.innerHTML =
        '<option value="">Selecione o cliente</option>';

    opcoes.clientes.forEach(cliente => {
        const option = document.createElement('option');

        option.value = cliente.cliente_id;
        option.textContent =
            `${cliente.nome} ${cliente.sobrenome}`;

        clienteSelect.appendChild(option);
    });

    pontoSelect.innerHTML =
        '<option value="">Selecione a filial</option>';

    opcoes.pontos.forEach(ponto => {
        const option = document.createElement('option');

        option.value = ponto.ponto_id;
        option.textContent = ponto.nome;

        pontoSelect.appendChild(option);
    });

    const filtroFilial = document.getElementById('filtro-filial');

    filtroFilial.innerHTML =
        '<option value="">Todas as filiais</option>';

    opcoes.pontos.forEach(ponto => {
        const option = document.createElement('option');

        option.value = ponto.ponto_id;
        option.textContent = ponto.nome;

        filtroFilial.appendChild(option);
    });

    atualizarVeiculos();
    atualizarFuncionarios();
}


// =====================================
// FILTRAR VEÍCULOS PELA FILIAL
// =====================================

function atualizarVeiculos() {
    const pontoId = pontoSelect.value;

    veiculoSelect.innerHTML =
        '<option value="">Selecione o veículo</option>';

    const disponiveis = opcoes.veiculos.filter(veiculo =>
        !pontoId || String(veiculo.ponto_id) === String(pontoId)
    );

    disponiveis.forEach(veiculo => {
        const option = document.createElement('option');

        option.value = veiculo.veiculo_id;

        option.textContent =
            `${veiculo.marca} ${veiculo.modelo} - ${veiculo.ano} - ${veiculo.placa}`;

        option.dataset.preco = veiculo.preco;

        veiculoSelect.appendChild(option);
    });

    if (disponiveis.length === 0) {
        veiculoSelect.innerHTML =
            '<option value="">Nenhum veículo disponível nesta filial</option>';
    }
}


// =====================================
// FILTRAR FUNCIONÁRIOS PELA FILIAL
// =====================================

function atualizarFuncionarios() {
    const pontoId = pontoSelect.value;

    funcionarioSelect.innerHTML =
        '<option value="">Selecione o vendedor</option>';

    const disponiveis = opcoes.funcionarios.filter(funcionario =>
        !pontoId || String(funcionario.ponto_id) === String(pontoId)
    );

    disponiveis.forEach(funcionario => {
        const option = document.createElement('option');

        option.value = funcionario.funcionario_id;
        option.textContent =
            `${funcionario.nome}${funcionario.cargo ? ' - ' + funcionario.cargo : ''}`;

        funcionarioSelect.appendChild(option);
    });
}


// =====================================
// PREENCHER VALOR SUGERIDO DO VEÍCULO
// =====================================

veiculoSelect.addEventListener('change', () => {
    const option = veiculoSelect.selectedOptions[0];

    if (option && option.dataset.preco) {
        valorInput.value = Number(option.dataset.preco).toFixed(2);
    }
});

pontoSelect.addEventListener('change', () => {
    atualizarVeiculos();
    atualizarFuncionarios();
});


// =====================================
// LISTAR VENDAS
// =====================================

async function carregarVendas() {
    lista.innerHTML = `
        <tr>
            <td colspan="9" class="table-message">
                Carregando vendas...
            </td>
        </tr>
    `;

    try {
        const params = new URLSearchParams();

        const busca = document.getElementById('pesquisa').value.trim();
        const pontoId = document.getElementById('filtro-filial').value;
        const status = document.getElementById('filtro-status').value;

        if (busca) params.set('busca', busca);
        if (pontoId) params.set('ponto_id', pontoId);
        if (status) params.set('status', status);

        const dados = await requisicao(`${API_URL}?${params.toString()}`);

        renderizarVendas(dados);
        atualizarIndicadores();

    } catch (error) {
        console.error(error);

        lista.innerHTML = `
            <tr>
                <td colspan="9" class="table-message">
                    ${escaparHTML(error.message)}
                </td>
            </tr>
        `;
    }
}


// =====================================
// EXIBIR VENDAS NA TABELA
// =====================================

function renderizarVendas(dados) {
    vendas = dados;

    lista.replaceChildren();

    if (dados.length === 0) {
        lista.innerHTML = `
            <tr>
                <td colspan="9" class="table-message">
                    Nenhuma venda encontrada.
                </td>
            </tr>
        `;

        document.getElementById('resultados-count').textContent =
            '0 vendas encontradas';

        return;
    }

    dados.forEach(venda => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>#${escaparHTML(venda.venda_id)}</td>

            <td>${escaparHTML(formatarData(venda.data_venda))}</td>

            <td>
                ${escaparHTML(venda.cliente_nome)}
                ${escaparHTML(venda.cliente_sobrenome)}
            </td>

            <td>
                ${escaparHTML(venda.marca)}
                ${escaparHTML(venda.modelo)}
                <br>
                <small>${escaparHTML(venda.placa || '-')}</small>
            </td>

            <td>${escaparHTML(venda.funcionario_nome)}</td>

            <td>${escaparHTML(venda.ponto_venda)}</td>

            <td>${formatarMoeda(venda.valor_venda)}</td>

            <td>${escaparHTML(venda.forma_pagamento)}</td>

            <td>
                <span class="status ${escaparHTML(venda.status)}">
                    ${escaparHTML(venda.status)}
                </span>
            </td>
        `;

        lista.appendChild(tr);
    });

    document.getElementById('resultados-count').textContent =
        `${dados.length} venda(s) encontrada(s)`;
}


// =====================================
// INDICADORES
// =====================================

async function atualizarIndicadores() {
    try {
        const todas = await requisicao(API_URL);

        const concluidas = todas.filter(venda =>
            venda.status === 'concluida'
        );

        const faturamento = concluidas.reduce((total, venda) =>
            total + Number(venda.valor_venda || 0), 0
        );

        document.getElementById('total-vendas').textContent =
            todas.length;

        document.getElementById('vendas-concluidas').textContent =
            concluidas.length;

        document.getElementById('faturamento').textContent =
            formatarMoeda(faturamento);

    } catch (error) {
        console.error('Erro ao atualizar indicadores:', error);
    }
}


// =====================================
// ABRIR E FECHAR FORMULÁRIO
// =====================================

function abrirFormulario() {
    form.reset();

    mostrarMensagem('');

    atualizarVeiculos();
    atualizarFuncionarios();

    painel.hidden = false;

    painel.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

function fecharFormulario() {
    painel.hidden = true;
    form.reset();
    mostrarMensagem('');
}

document.getElementById('btn-nova-venda')
    .addEventListener('click', abrirFormulario);

document.getElementById('btn-fechar')
    .addEventListener('click', fecharFormulario);

document.getElementById('btn-cancelar')
    .addEventListener('click', fecharFormulario);


// =====================================
// CADASTRAR VENDA
// =====================================

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Registrando...';

    mostrarMensagem('');

    const dados = {
        cliente_id: clienteSelect.value,
        veiculo_id: veiculoSelect.value,
        funcionario_id: funcionarioSelect.value,
        ponto_id: pontoSelect.value,
        valor_venda: valorInput.value,
        forma_pagamento: document.getElementById('forma_pagamento').value
    };

    try {
        const resultado = await requisicao(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        alert(resultado.message);

        fecharFormulario();

        await carregarOpcoes();
        await carregarVendas();

    } catch (error) {
        mostrarMensagem(error.message);
        console.error(error);

    } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = 'Confirmar venda';
    }
});


// =====================================
// FILTROS
// =====================================

document.getElementById('btn-atualizar')
    .addEventListener('click', carregarVendas);

document.getElementById('filtro-filial')
    .addEventListener('change', carregarVendas);

document.getElementById('filtro-status')
    .addEventListener('change', carregarVendas);

document.getElementById('pesquisa')
    .addEventListener('input', () => {
        clearTimeout(window.timerPesquisa);

        window.timerPesquisa = setTimeout(carregarVendas, 350);
    });


// =====================================
// INICIALIZAÇÃO
// =====================================

async function iniciar() {
    try {
        await carregarOpcoes();
        await carregarVendas();

    } catch (error) {
        console.error(error);

        lista.innerHTML = `
            <tr>
                <td colspan="9" class="table-message">
                    Erro ao carregar os dados. Verifique se o backend está funcionando.
                </td>
            </tr>
        `;
    }
}

iniciar();
