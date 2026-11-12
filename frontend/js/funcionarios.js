const API_URL = 'http://localhost:3000/api/funcionarios';
const PONTOS_URL = `${API_URL}/pontos`;

const form = document.getElementById('funcionario-form');
const lista = document.getElementById('funcionarios-lista');
const painelFormulario = document.getElementById('painel-formulario');
const idInput = document.getElementById('funcionario-id');
const filtroPesquisa = document.getElementById('pesquisa');
const filtroFilial = document.getElementById('filtro-filial');
const filtroStatus = document.getElementById('filtro-status');
const selectPonto = document.getElementById('ponto_id');
const formMessage = document.getElementById('form-message');

let funcionarios = [];
let pontos = [];

function mostrarMensagem(mensagem, sucesso = false) {
    formMessage.textContent = mensagem;
    formMessage.classList.toggle('success', sucesso);
}

async function requisicao(url, options = {}) {
    const response = await fetch(url, options);
    const resultado = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(resultado.message || 'Não foi possível concluir a operação.');
    return resultado;
}

async function carregarPontos() {
    pontos = await requisicao(PONTOS_URL);
    selectPonto.innerHTML = '<option value="">Selecione um ponto de venda</option>';
    filtroFilial.innerHTML = '<option value="">Todas as filiais</option>';

    pontos.forEach(ponto => {
        const optionForm = document.createElement('option');
        optionForm.value = ponto.ponto_id;
        optionForm.textContent = ponto.nome;
        selectPonto.appendChild(optionForm);

        const optionFiltro = optionForm.cloneNode(true);
        filtroFilial.appendChild(optionFiltro);
    });
}

async function carregarFuncionarios() {
    lista.innerHTML = '<tr><td colspan="8" class="table-message">Carregando funcionários...</td></tr>';
    try {
        const params = new URLSearchParams();
        if (filtroPesquisa.value.trim()) params.set('busca', filtroPesquisa.value.trim());
        if (filtroFilial.value) params.set('ponto_id', filtroFilial.value);
        if (filtroStatus.value) params.set('status', filtroStatus.value);

        funcionarios = await requisicao(`${API_URL}?${params.toString()}`);
        renderizarFuncionarios(funcionarios);
        atualizarIndicadores();
    } catch (error) {
        console.error(error);
        lista.innerHTML = `<tr><td colspan="8" class="table-message">${escaparHTML(error.message)}</td></tr>`;
    }
}

function atualizarIndicadores() {
    // Os indicadores refletem a equipe carregada sem filtros, para não variar com a pesquisa.
    requisicao(API_URL).then(dados => {
        document.getElementById('total-funcionarios').textContent = dados.length;
        document.getElementById('total-ativos').textContent = dados.filter(item => item.status === 'ativo').length;
        document.getElementById('total-inativos').textContent = dados.filter(item => item.status === 'inativo').length;
    }).catch(error => console.error(error));
}

function escaparHTML(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, caractere => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[caractere]);
}

function renderizarFuncionarios(dados) {
    lista.replaceChildren();
    document.getElementById('resultados-count').textContent = `${dados.length} funcionário(s) encontrado(s)`;

    if (!dados.length) {
        lista.innerHTML = '<tr><td colspan="8" class="table-message">Nenhum funcionário encontrado.</td></tr>';
        return;
    }

    dados.forEach(funcionario => {
        const tr = document.createElement('tr');
        const valores = [
            funcionario.funcionario_id,
            funcionario.nome,
            funcionario.cpf || '—',
            funcionario.email || funcionario.telefone || '—',
            funcionario.cargo || '—',
            funcionario.ponto_venda || '—'
        ];
        valores.forEach(valor => {
            const td = document.createElement('td');
            td.textContent = valor;
            tr.appendChild(td);
        });

        const tdStatus = document.createElement('td');
        const status = document.createElement('span');
        status.className = `status ${funcionario.status}`;
        status.textContent = funcionario.status;
        tdStatus.appendChild(status);
        tr.appendChild(tdStatus);

        const tdAcoes = document.createElement('td');
        const acoes = document.createElement('div');
        acoes.className = 'actions';
        const editar = document.createElement('button');
        editar.type = 'button';
        editar.className = 'btn-edit';
        editar.textContent = 'Editar';
        editar.addEventListener('click', () => editarFuncionario(funcionario.funcionario_id));
        acoes.appendChild(editar);

        if (funcionario.status === 'ativo') {
            const desativar = document.createElement('button');
            desativar.type = 'button';
            desativar.className = 'btn-disable';
            desativar.textContent = 'Desativar';
            desativar.addEventListener('click', () => desativarFuncionario(funcionario.funcionario_id));
            acoes.appendChild(desativar);
        }
        tdAcoes.appendChild(acoes);
        tr.appendChild(tdAcoes);
        lista.appendChild(tr);
    });
}

function abrirFormulario(funcionario = null) {
    form.reset();
    idInput.value = funcionario?.funcionario_id || '';
    document.getElementById('nome').value = funcionario?.nome || '';
    document.getElementById('cpf').value = funcionario?.cpf || '';
    document.getElementById('cargo').value = funcionario?.cargo || '';
    document.getElementById('email').value = funcionario?.email || '';
    document.getElementById('telefone').value = funcionario?.telefone || '';
    selectPonto.value = funcionario?.ponto_id || '';
    document.getElementById('status').value = funcionario?.status || 'ativo';
    document.getElementById('status-field').hidden = !funcionario;
    document.getElementById('form-title').textContent = funcionario ? 'Editar funcionário' : 'Cadastrar funcionário';
    document.getElementById('btn-salvar').textContent = funcionario ? 'Salvar alterações' : 'Cadastrar funcionário';
    mostrarMensagem('');
    painelFormulario.hidden = false;
    painelFormulario.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function editarFuncionario(id) {
    const funcionario = funcionarios.find(item => Number(item.funcionario_id) === Number(id));
    if (funcionario) abrirFormulario(funcionario);
    else requisicao(`${API_URL}/${id}`).then(abrirFormulario).catch(error => alert(error.message));
}

async function desativarFuncionario(id) {
    if (!confirm('Deseja realmente desativar este funcionário?')) return;
    try {
        const resultado = await requisicao(`${API_URL}/${id}`, { method: 'DELETE' });
        alert(resultado.message);
        await carregarFuncionarios();
    } catch (error) {
        alert(error.message);
    }
}

form.addEventListener('submit', async event => {
    event.preventDefault();
    const id = idInput.value;
    const dados = {
        nome: document.getElementById('nome').value.trim(),
        cpf: document.getElementById('cpf').value.replace(/\D/g, ''),
        cargo: document.getElementById('cargo').value.trim(),
        email: document.getElementById('email').value.trim(),
        telefone: document.getElementById('telefone').value.trim(),
        ponto_id: selectPonto.value
    };
    if (id) dados.status = document.getElementById('status').value;
    if (!dados.cpf) dados.cpf = null;

    const botao = document.getElementById('btn-salvar');
    botao.disabled = true;
    try {
        const resultado = await requisicao(id ? `${API_URL}/${id}` : API_URL, {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        mostrarMensagem(resultado.message, true);
        await carregarFuncionarios();
        setTimeout(() => { painelFormulario.hidden = true; }, 700);
    } catch (error) {
        mostrarMensagem(error.message);
    } finally {
        botao.disabled = false;
    }
});

document.getElementById('btn-novo').addEventListener('click', () => abrirFormulario());
document.getElementById('btn-fechar').addEventListener('click', () => { painelFormulario.hidden = true; });
document.getElementById('btn-cancelar').addEventListener('click', () => { painelFormulario.hidden = true; form.reset(); });
document.getElementById('btn-atualizar').addEventListener('click', carregarFuncionarios);
filtroFilial.addEventListener('change', carregarFuncionarios);
filtroStatus.addEventListener('change', carregarFuncionarios);
let temporizadorPesquisa;
filtroPesquisa.addEventListener('input', () => {
    clearTimeout(temporizadorPesquisa);
    temporizadorPesquisa = setTimeout(carregarFuncionarios, 250);
});

async function iniciar() {
    try {
        await carregarPontos();
        await carregarFuncionarios();
    } catch (error) {
        console.error(error);
        lista.innerHTML = `<tr><td colspan="8" class="table-message">${escaparHTML(error.message)} Verifique se o servidor e o banco estão funcionando.</td></tr>`;
    }
}
iniciar();
