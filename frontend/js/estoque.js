const API_BASE_URL =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/api'
        : 'https://automenager-production.up.railway.app/api';

const API = `${API_BASE_URL}/estoque`;

const cardsFiliais = document.getElementById('cards-filiais');
const listaEstoque = document.getElementById('estoque-lista');
const listaHistorico = document.getElementById('historico-lista');

const filtroFilial = document.getElementById('filtro-filial');
const filtroStatus = document.getElementById('filtro-status');
const pesquisa = document.getElementById('pesquisa');

const selectVeiculo = document.getElementById('veiculo-transferencia');
const selectDestino = document.getElementById('filial-destino');

const formTransferencia = document.getElementById('form-transferencia');
const btnTransferir = document.getElementById('btn-transferir');

let filiais = [];
let veiculos = [];
let veiculosDisponiveis = [];


// =====================================
// FORMATAÇÃO
// =====================================

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function formatarData(data) {
    if (!data) return '-';

    const dataConvertida = new Date(data);

    return dataConvertida.toLocaleString('pt-BR');
}


// =====================================
// REQUISIÇÕES
// =====================================

async function requisicao(url, opcoes = {}) {
    const response = await fetch(url, opcoes);

    const resultado = await response.json();

    if (!response.ok) {
        throw new Error(
            resultado.message || 'Erro na comunicação com o servidor.'
        );
    }

    return resultado;
}


// =====================================
// CARREGAR RESUMO
// =====================================

async function carregarResumo() {
    const dados = await requisicao(`${API}/resumo`);

    filiais = dados;

    let total = 0;
    let disponiveis = 0;
    let reservados = 0;
    let vendidos = 0;

    cardsFiliais.replaceChildren();

    dados.forEach(filial => {
        const quantidade = Number(filial.total_veiculos || 0);
        const livres = Number(filial.disponiveis || 0);
        const reservadosFilial = Number(filial.reservados || 0);
        const vendidosFilial = Number(filial.vendidos || 0);

        total += quantidade;
        disponiveis += livres;
        reservados += reservadosFilial;
        vendidos += vendidosFilial;

        const card = document.createElement('article');
        card.className = 'filial-card';

        const titulo = document.createElement('h4');
        titulo.textContent = filial.ponto_venda;

        const numero = document.createElement('strong');
        numero.textContent = quantidade;

        const detalhes = document.createElement('p');
        detalhes.textContent =
            `Disponíveis: ${livres} | Reservados: ${reservadosFilial} | Vendidos: ${vendidosFilial}`;

        card.append(titulo, numero, detalhes);
        cardsFiliais.appendChild(card);
    });

    document.getElementById('total-veiculos').textContent = total;
    document.getElementById('total-disponiveis').textContent = disponiveis;
    document.getElementById('total-reservados').textContent = reservados;
    document.getElementById('total-vendidos').textContent = vendidos;

    carregarOpcoesFiliais();
}


// =====================================
// CARREGAR FILIAIS NOS SELECTS
// =====================================

function carregarOpcoesFiliais() {
    const valorAtual = filtroFilial.value;
    const destinoAtual = selectDestino.value;

    filtroFilial.replaceChildren(
        new Option('Todas as filiais', '')
    );

    selectDestino.replaceChildren(
        new Option('Selecione uma filial', '')
    );

    filiais.forEach(filial => {
        filtroFilial.add(
            new Option(filial.ponto_venda, filial.ponto_id)
        );

        selectDestino.add(
            new Option(filial.ponto_venda, filial.ponto_id)
        );
    });

    filtroFilial.value = valorAtual;
    selectDestino.value = destinoAtual;
}


// =====================================
// CARREGAR ESTOQUE
// =====================================

async function carregarEstoque() {
    try {
        const params = new URLSearchParams();

        if (filtroFilial.value) {
            params.set('ponto_id', filtroFilial.value);
        }

        if (filtroStatus.value) {
            params.set('status', filtroStatus.value);
        }

        if (pesquisa.value.trim()) {
            params.set('busca', pesquisa.value.trim());
        }

        const url = `${API}?${params.toString()}`;

        veiculos = await requisicao(url);

        renderizarEstoque();

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}


// =====================================
// RENDERIZAR ESTOQUE
// =====================================

function renderizarEstoque() {
    listaEstoque.replaceChildren();

    if (veiculos.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');

        td.colSpan = 9;
        td.textContent = 'Nenhum veículo encontrado no estoque.';

        tr.appendChild(td);
        listaEstoque.appendChild(tr);

        return;
    }

    veiculos.forEach(veiculo => {
        const tr = document.createElement('tr');

        const valores = [
            veiculo.veiculo_id,
            `${veiculo.marca} ${veiculo.modelo}`,
            veiculo.ano,
            veiculo.placa || '-',
            `${Number(veiculo.quilometragem || 0).toLocaleString('pt-BR')} km`,
            formatarMoeda(veiculo.preco),
            veiculo.ponto_venda
        ];

        valores.forEach(valor => {
            const td = document.createElement('td');
            td.textContent = valor;
            tr.appendChild(td);
        });

        const tdStatus = document.createElement('td');
        const badge = document.createElement('span');

        badge.className = `status ${veiculo.status}`;
        badge.textContent = veiculo.status;

        tdStatus.appendChild(badge);
        tr.appendChild(tdStatus);

        const tdAcao = document.createElement('td');

        if (veiculo.status === 'disponivel') {
            const botao = document.createElement('button');

            botao.textContent = 'Transferir';
            botao.className = 'btn-selecionar';

            botao.addEventListener('click', () => {
                selecionarVeiculo(veiculo.veiculo_id);
            });

            tdAcao.appendChild(botao);
        } else {
            tdAcao.textContent = 'Indisponível';
        }

        tr.appendChild(tdAcao);
        listaEstoque.appendChild(tr);
    });
}


// =====================================
// CARREGAR VEÍCULOS PARA TRANSFERÊNCIA
// =====================================

async function carregarVeiculosDisponiveis() {
    veiculosDisponiveis = await requisicao(
        `${API}?status=disponivel`
    );

    selectVeiculo.replaceChildren(
        new Option('Selecione um veículo', '')
    );

    veiculosDisponiveis.forEach(veiculo => {
        const descricao =
            `${veiculo.marca} ${veiculo.modelo} - ${veiculo.placa}`;

        selectVeiculo.add(
            new Option(descricao, veiculo.veiculo_id)
        );
    });

    atualizarDestino();
}


// =====================================
// SELECIONAR VEÍCULO
// =====================================

function selecionarVeiculo(id) {
    selectVeiculo.value = String(id);

    atualizarDestino();

    document.getElementById('form-transferencia')
        .scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
}


// =====================================
// IMPEDIR TRANSFERÊNCIA PARA A MESMA FILIAL
// =====================================

function atualizarDestino() {
    const id = Number(selectVeiculo.value);

    const veiculo = veiculosDisponiveis.find(
        item => Number(item.veiculo_id) === id
    );

    Array.from(selectDestino.options).forEach(opcao => {
        if (!opcao.value) return;

        opcao.disabled = veiculo
            ? Number(opcao.value) === Number(veiculo.ponto_id)
            : false;
    });

    if (
        veiculo &&
        Number(selectDestino.value) === Number(veiculo.ponto_id)
    ) {
        selectDestino.value = '';
    }
}

selectVeiculo.addEventListener('change', atualizarDestino);


// =====================================
// REALIZAR TRANSFERÊNCIA
// =====================================

formTransferencia.addEventListener('submit', async event => {
    event.preventDefault();

    const veiculo_id = Number(selectVeiculo.value);
    const ponto_destino = Number(selectDestino.value);

    const observacao = document
        .getElementById('observacao')
        .value.trim();

    if (!veiculo_id || !ponto_destino) {
        alert('Selecione o veículo e a filial de destino.');
        return;
    }

    const veiculo = veiculosDisponiveis.find(
        item => Number(item.veiculo_id) === veiculo_id
    );

    if (
        !veiculo ||
        Number(veiculo.ponto_id) === ponto_destino
    ) {
        alert('Selecione uma filial de destino diferente da origem.');
        return;
    }

    if (!confirm('Confirma a transferência deste veículo?')) {
        return;
    }

    btnTransferir.disabled = true;
    btnTransferir.textContent = 'Transferindo...';

    try {
        const resultado = await requisicao(`${API}/transferir`, {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                veiculo_id,
                ponto_destino,
                observacao
            })
        });

        alert(resultado.message);

        formTransferencia.reset();

        await atualizarPagina();

    } catch (error) {
        console.error(error);
        alert(error.message);

    } finally {
        btnTransferir.disabled = false;
        btnTransferir.textContent = 'Realizar transferência';
    }
});


// =====================================
// CARREGAR HISTÓRICO
// =====================================

async function carregarHistorico() {
    const dados = await requisicao(`${API}/movimentacoes`);

    listaHistorico.replaceChildren();

    if (dados.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');

        td.colSpan = 7;
        td.textContent = 'Nenhuma movimentação registrada.';

        tr.appendChild(td);
        listaHistorico.appendChild(tr);

        return;
    }

    dados.forEach(item => {
        const tr = document.createElement('tr');

        const valores = [
            item.movimentacao_id,
            `${item.marca} ${item.modelo}`,
            item.placa,
            item.filial_origem,
            item.filial_destino,
            formatarData(item.data_movimentacao),
            item.observacao || '-'
        ];

        valores.forEach(valor => {
            const td = document.createElement('td');
            td.textContent = valor;
            tr.appendChild(td);
        });

        listaHistorico.appendChild(tr);
    });
}


// =====================================
// ATUALIZAR TODA A PÁGINA
// =====================================

async function atualizarPagina() {
    await carregarResumo();

    await Promise.all([
        carregarEstoque(),
        carregarVeiculosDisponiveis(),
        carregarHistorico()
    ]);
}


// =====================================
// FILTROS
// =====================================

filtroFilial.addEventListener('change', carregarEstoque);

filtroStatus.addEventListener('change', carregarEstoque);

let temporizadorPesquisa;

pesquisa.addEventListener('input', () => {
    clearTimeout(temporizadorPesquisa);

    temporizadorPesquisa = setTimeout(
        carregarEstoque,
        300
    );
});

document.getElementById('btn-atualizar')
    .addEventListener('click', atualizarPagina);


// =====================================
// INICIALIZAR
// =====================================

async function iniciar() {
    try {
        await atualizarPagina();

    } catch (error) {
        console.error(error);
        alert('Não foi possível carregar o módulo de estoque.');
    }
}

iniciar();
