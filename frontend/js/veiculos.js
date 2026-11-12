
const API = 'http://localhost:3000/api/veiculos';

const form = document.getElementById('veiculo-form');
const lista = document.getElementById('veiculos-lista');

const marcaSelect = document.getElementById('marca');
const modeloSelect = document.getElementById('modelo');
const pontoSelect = document.getElementById('ponto');

const veiculoId = document.getElementById('veiculo-id');
const pesquisa = document.getElementById('pesquisa');
const filtroStatus = document.getElementById('filtro-status');

const btnSalvar = document.getElementById('btn-salvar');
const btnCancelar = document.getElementById('btn-cancelar');

let veiculos = [];
let modelos = [];
let marcas = [];


// =====================================
// CARREGAR OPÇÕES
// =====================================

async function carregarOpcoes() {
    const response = await fetch(`${API}/opcoes`);

    if (!response.ok) {
        throw new Error('Erro ao carregar opções.');
    }

    const dados = await response.json();

    marcas = dados.marcas;
    modelos = dados.modelos;

    marcaSelect.replaceChildren(
        new Option('Selecione a marca', '')
    );

    marcas.forEach(marca => {
        marcaSelect.add(
            new Option(marca.nome, marca.marca_id)
        );
    });

    pontoSelect.replaceChildren(
        new Option('Selecione a filial', '')
    );

    dados.pontos.forEach(ponto => {
        pontoSelect.add(
            new Option(ponto.nome, ponto.ponto_id)
        );
    });
}


// =====================================
// FILTRAR MODELOS PELA MARCA
// =====================================

function carregarModelos(marcaId, modeloSelecionado = '') {
    modeloSelect.replaceChildren(
        new Option('Selecione o modelo', '')
    );

    const modelosFiltrados = modelos.filter(
        modelo => String(modelo.marca_id) === String(marcaId)
    );

    modelosFiltrados.forEach(modelo => {
        modeloSelect.add(
            new Option(modelo.modelo, modelo.modelo_id)
        );
    });

    modeloSelect.disabled = !marcaId;

    modeloSelect.value = modeloSelecionado;
}

marcaSelect.addEventListener('change', () => {
    carregarModelos(marcaSelect.value);
});


// =====================================
// LISTAR VEÍCULOS
// =====================================

async function carregarVeiculos() {
    try {
        const params = new URLSearchParams();

        if (pesquisa.value.trim()) {
            params.set('busca', pesquisa.value.trim());
        }

        if (filtroStatus.value) {
            params.set('status', filtroStatus.value);
        }

        const response = await fetch(
            `${API}?${params.toString()}`
        );

        if (!response.ok) {
            throw new Error('Erro ao buscar veículos.');
        }

        veiculos = await response.json();

        renderizarVeiculos(veiculos);

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}


// =====================================
// RENDERIZAR TABELA
// =====================================

function renderizarVeiculos(dados) {
    lista.replaceChildren();

    if (dados.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');

        td.colSpan = 9;
        td.textContent = 'Nenhum veículo encontrado.';

        tr.appendChild(td);
        lista.appendChild(tr);

        return;
    }

    dados.forEach(veiculo => {
        const tr = document.createElement('tr');

        const valores = [
            veiculo.veiculo_id,
            `${veiculo.marca} ${veiculo.modelo}`,
            veiculo.ano,
            veiculo.cor,
            veiculo.placa,
            Number(veiculo.preco).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }),
            veiculo.ponto_venda || 'Sem filial'
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

        const tdAcoes = document.createElement('td');

        if (veiculo.status !== 'vendido') {
            const editar = document.createElement('button');

            editar.textContent = 'Editar';
            editar.className = 'btn-editar';

            editar.addEventListener('click', () => {
                editarVeiculo(veiculo.veiculo_id);
            });

            const excluir = document.createElement('button');

            excluir.textContent = 'Excluir';
            excluir.className = 'btn-excluir';

            excluir.addEventListener('click', () => {
                excluirVeiculo(veiculo.veiculo_id);
            });

            tdAcoes.append(editar, excluir);

        } else {
            tdAcoes.textContent = 'Venda registrada';
        }

        tr.appendChild(tdAcoes);
        lista.appendChild(tr);
    });
}


// =====================================
// CADASTRAR E ATUALIZAR
// =====================================

form.addEventListener('submit', async event => {
    event.preventDefault();

    const id = veiculoId.value;

    const dados = {
        modelo_id: Number(modeloSelect.value),
        ano: Number(document.getElementById('ano').value),
        cor: document.getElementById('cor').value.trim(),
        quilometragem: Number(
            document.getElementById('quilometragem').value || 0
        ),
        placa: document.getElementById('placa').value.trim(),
        preco: Number(document.getElementById('preco').value),
        ponto_id: Number(pontoSelect.value),
        descricao: document.getElementById('descricao').value.trim()
    };

    const url = id ? `${API}/${id}` : API;
    const metodo = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        const resultado = await response.json();

        if (!response.ok) {
            throw new Error(resultado.message);
        }

        alert(resultado.message);

        limparFormulario();
        await carregarVeiculos();

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
});


// =====================================
// EDITAR VEÍCULO
// =====================================

function editarVeiculo(id) {
    const veiculo = veiculos.find(
        item => item.veiculo_id === id
    );

    if (!veiculo) return;

    veiculoId.value = veiculo.veiculo_id;

    marcaSelect.value = veiculo.marca_id || '';

    // O resultado da listagem não possui marca_id.
    // Recuperamos pelo relacionamento marca/modelo.
    const modelo = modelos.find(
        item => item.modelo_id === veiculo.modelo_id
    );

    if (!modelo) {
        alert('Não foi possível identificar o modelo.');
        return;
    }

    marcaSelect.value = modelo.marca_id;

    carregarModelos(
        modelo.marca_id,
        veiculo.modelo_id
    );

    document.getElementById('ano').value = veiculo.ano;
    document.getElementById('cor').value = veiculo.cor;
    document.getElementById('quilometragem').value =
        veiculo.quilometragem;

    document.getElementById('placa').value = veiculo.placa;
    document.getElementById('preco').value = veiculo.preco;
    document.getElementById('descricao').value =
        veiculo.descricao || '';

    pontoSelect.value = veiculo.ponto_id || '';

    document.getElementById('form-title').textContent =
        'Editar veículo';

    btnSalvar.textContent = 'Salvar alterações';
    btnCancelar.hidden = false;

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}


// =====================================
// EXCLUIR VEÍCULO
// =====================================

async function excluirVeiculo(id) {
    if (!confirm('Deseja realmente excluir este veículo?')) {
        return;
    }

    try {
        const response = await fetch(`${API}/${id}`, {
            method: 'DELETE'
        });

        const resultado = await response.json();

        if (!response.ok) {
            throw new Error(resultado.message);
        }

        alert(resultado.message);

        await carregarVeiculos();

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}


// =====================================
// LIMPAR FORMULÁRIO
// =====================================

function limparFormulario() {
    form.reset();

    veiculoId.value = '';

    modeloSelect.replaceChildren(
        new Option('Selecione o modelo', '')
    );

    modeloSelect.disabled = true;

    document.getElementById('form-title').textContent =
        'Cadastrar veículo';

    btnSalvar.textContent = 'Cadastrar veículo';
    btnCancelar.hidden = true;
}

btnCancelar.addEventListener('click', limparFormulario);


// =====================================
// FILTROS
// =====================================

let temporizadorPesquisa;

pesquisa.addEventListener('input', () => {
    clearTimeout(temporizadorPesquisa);

    temporizadorPesquisa = setTimeout(
        carregarVeiculos,
        300
    );
});

filtroStatus.addEventListener('change', carregarVeiculos);


// =====================================
// INICIALIZAR
// =====================================

async function iniciar() {
    try {
        await carregarOpcoes();
        await carregarVeiculos();

    } catch (error) {
        console.error(error);
        alert('Erro ao iniciar o módulo de veículos.');
    }
}

iniciar();