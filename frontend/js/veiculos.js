const API_BASE_URL =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/api'
        : 'https://automenager-production.up.railway.app/api';

const API = `${API_BASE_URL}/veiculos`;

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
const btnNovaMarca = document.getElementById('btn-nova-marca');
const btnNovoModelo = document.getElementById('btn-novo-modelo');

const visualizarDialog = document.getElementById('visualizar-dialog');
const visualizarConteudo = document.getElementById('visualizar-conteudo');
const btnFecharVisualizacao = document.getElementById('btn-fechar-visualizacao');
const dialogMarca = document.getElementById('dialog-marca');
const dialogModelo = document.getElementById('dialog-modelo');

const formMarca = document.getElementById('form-marca');
const formModelo = document.getElementById('form-modelo');

const modeloMarcaSelect = document.getElementById('modelo-marca');

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

            const visualizar = document.createElement('button');

            visualizar.textContent = 'Visualizar';
            visualizar.className = 'btn-visualizar';

            visualizar.addEventListener('click', () => {
                visualizarVeiculo(veiculo.veiculo_id);
            });

            tdAcoes.append(editar, excluir, visualizar);

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
// VISUALIZAR VEÍCULO
// =====================================


function visualizarVeiculo(id) {
    const veiculo = veiculos.find(
        item => Number(item.veiculo_id) === Number(id)
    );

    if (!veiculo) return;

    const titulo = document.getElementById('modal-titulo');

    titulo.textContent = `${veiculo.marca} ${veiculo.modelo}`;

    visualizarConteudo.replaceChildren();

    const informacoes = [
        ['Identificação', `#${veiculo.veiculo_id}`, 'destaque'],
        ['Marca', veiculo.marca],
        ['Origem da marca', veiculo.marca_origem || 'Não informada'],
        ['Modelo', veiculo.modelo],
        ['Motor', veiculo.motor],
        ['Transmissão', veiculo.transmissao],
        ['Combustível', veiculo.combustivel],
        ['Ano', veiculo.ano],
        ['Cor', veiculo.cor],
        ['Quilometragem', `${veiculo.quilometragem} km`],
        ['Placa', veiculo.placa, 'destaque'],
        ['Preço', Number(veiculo.preco).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }), 'preco'],
        ['Filial', veiculo.ponto_venda || 'Sem filial'],
        ['Status', veiculo.status, 'destaque'],
        ['Descrição', veiculo.descricao || 'Sem descrição', 'descricao']
    ];

    informacoes.forEach(([titulo, valor, classe = '']) => {
        const card = document.createElement('div');
        card.className = `info-card ${classe}`;

        const label = document.createElement('span');
        label.textContent = titulo;

        const conteudo = document.createElement('strong');
        conteudo.textContent = valor;

        card.append(label, conteudo);
        visualizarConteudo.appendChild(card);
    });

    visualizarDialog.showModal();
}


btnFecharVisualizacao.addEventListener('click', () => {
    visualizarDialog.close();
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
// CADASTRAR MARCA
// =====================================

document.getElementById('btn-nova-marca').addEventListener('click', () => {
    formMarca.reset();
    document.getElementById('mensagem-marca').textContent = '';
    dialogMarca.showModal();
});

document.getElementById('fechar-marca').addEventListener('click', () => {
    dialogMarca.close();
});

formMarca.addEventListener('submit', async event => {
    event.preventDefault();

    const botao = document.getElementById('salvar-marca');
    const mensagem = document.getElementById('mensagem-marca');

    const dados = {
        nome: document.getElementById('marca-nome').value.trim(),
        origem: document.getElementById('marca-origem').value.trim()
    };

    botao.disabled = true;
    mensagem.textContent = '';

    try {
        const response = await fetch(`${API}/marcas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        const resultado = await response.json();

        if (!response.ok) {
            throw new Error(resultado.message);
        }

        await carregarOpcoes();

        marcaSelect.value = resultado.marca_id;
        carregarModelos(resultado.marca_id);

        mensagem.textContent = resultado.message;
        mensagem.classList.add('success');

        setTimeout(() => dialogMarca.close(), 700);

    } catch (error) {
        mensagem.textContent = error.message;
        mensagem.classList.remove('success');
    } finally {
        botao.disabled = false;
    }
});


// =====================================
// CADASTRAR MODELO
// =====================================

document.getElementById('btn-novo-modelo').addEventListener('click', () => {
    if (!marcaSelect.value) {
        alert('Selecione uma marca antes de cadastrar um modelo.');
        return;
    }

    formModelo.reset();

    modeloMarcaSelect.replaceChildren(
        new Option('Selecione a marca', '')
    );

    marcas.forEach(marca => {
        modeloMarcaSelect.add(
            new Option(marca.nome, marca.marca_id)
        );
    });

    modeloMarcaSelect.value = marcaSelect.value;

    document.getElementById('mensagem-modelo').textContent = '';
    dialogModelo.showModal();
});

document.getElementById('fechar-modelo').addEventListener('click', () => {
    dialogModelo.close();
});

formModelo.addEventListener('submit', async event => {
    event.preventDefault();

    const botao = document.getElementById('salvar-modelo');
    const mensagem = document.getElementById('mensagem-modelo');

    const marcaId = Number(modeloMarcaSelect.value);

    const dados = {
        modelo: document.getElementById('modelo-nome').value.trim(),
        marca_id: marcaId,
        motor: document.getElementById('modelo-motor').value.trim(),
        transmissao: document.getElementById('modelo-transmissao').value,
        combustivel: document.getElementById('modelo-combustivel').value
    };

    botao.disabled = true;
    mensagem.textContent = '';

    try {
        const response = await fetch(`${API}/modelos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        const resultado = await response.json();

        if (!response.ok) {
            throw new Error(resultado.message);
        }

        await carregarOpcoes();

        marcaSelect.value = marcaId;
        carregarModelos(marcaId, resultado.modelo_id);

        mensagem.textContent = resultado.message;
        mensagem.classList.add('success');

        setTimeout(() => dialogModelo.close(), 700);

    } catch (error) {
        mensagem.textContent = error.message;
        mensagem.classList.remove('success');
    } finally {
        botao.disabled = false;
    }
});

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