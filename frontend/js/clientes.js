
const API_URL = 'http://localhost:3000/api/clientes';

const form = document.getElementById('cliente-form');
const lista = document.getElementById('clientes-lista');
const pesquisa = document.getElementById('pesquisa');

const clienteId = document.getElementById('cliente-id');
const formTitle = document.getElementById('form-title');
const btnSalvar = document.getElementById('btn-salvar');
const btnCancelar = document.getElementById('btn-cancelar');

let clientes = [];


// =====================================
// LISTAR CLIENTES
// =====================================

async function carregarClientes() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error('Não foi possível buscar os clientes.');
        }

        clientes = await response.json();

        renderizarClientes(clientes);

    } catch (error) {
        console.error(error);
        alert('Erro ao carregar clientes.');
    }
}


// =====================================
// RENDERIZAR TABELA
// =====================================

function renderizarClientes(dados) {

    lista.replaceChildren();

    if (dados.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');

        td.colSpan = 6;
        td.textContent = 'Nenhum cliente encontrado.';

        tr.appendChild(td);
        lista.appendChild(tr);

        return;
    }

    dados.forEach(cliente => {

        const tr = document.createElement('tr');

        const valores = [
            cliente.cliente_id,
            `${cliente.nome} ${cliente.sobrenome}`,
            cliente.cpf || '-',
            cliente.telefone || '-',
            cliente.email || '-'
        ];

        valores.forEach(valor => {
            const td = document.createElement('td');
            td.textContent = valor;
            tr.appendChild(td);
        });

        const tdAcoes = document.createElement('td');

        const btnEditar = document.createElement('button');
        btnEditar.textContent = 'Editar';
        btnEditar.className = 'btn-editar';

        btnEditar.addEventListener('click', () => {
            editarCliente(cliente.cliente_id);
        });

        const btnExcluir = document.createElement('button');
        btnExcluir.textContent = 'Excluir';
        btnExcluir.className = 'btn-excluir';

        btnExcluir.addEventListener('click', () => {
            excluirCliente(cliente.cliente_id);
        });

        tdAcoes.append(btnEditar, btnExcluir);
        tr.appendChild(tdAcoes);

        lista.appendChild(tr);
    });
}


// =====================================
// CADASTRAR E ATUALIZAR CLIENTE
// =====================================

form.addEventListener('submit', async (event) => {

    event.preventDefault();

    const id = clienteId.value;

    const cliente = {
        nome: document.getElementById('nome').value.trim(),
        sobrenome: document.getElementById('sobrenome').value.trim(),
        cpf: document.getElementById('cpf').value.trim(),
        telefone: document.getElementById('telefone').value.trim(),
        email: document.getElementById('email').value.trim(),
        endereco: document.getElementById('endereco').value.trim()
    };

    const url = id ? `${API_URL}/${id}` : API_URL;
    const metodo = id ? 'PUT' : 'POST';

    try {

        const response = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cliente)
        });

        const resultado = await response.json();

        if (!response.ok) {
            throw new Error(resultado.message);
        }

        alert(resultado.message);

        limparFormulario();
        carregarClientes();

    } catch (error) {
        console.error(error);
        alert(error.message || 'Erro ao salvar cliente.');
    }
});


// =====================================
// EDITAR CLIENTE
// =====================================

function editarCliente(id) {

    const cliente = clientes.find(
        item => item.cliente_id === id
    );

    if (!cliente) return;

    clienteId.value = cliente.cliente_id;

    document.getElementById('nome').value = cliente.nome;
    document.getElementById('sobrenome').value = cliente.sobrenome;
    document.getElementById('cpf').value = cliente.cpf || '';
    document.getElementById('telefone').value = cliente.telefone || '';
    document.getElementById('email').value = cliente.email || '';
    document.getElementById('endereco').value = cliente.endereco || '';

    formTitle.textContent = 'Editar cliente';
    btnSalvar.textContent = 'Salvar alterações';
    btnCancelar.hidden = false;

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}


// =====================================
// EXCLUIR CLIENTE
// =====================================

async function excluirCliente(id) {

    const confirmar = confirm(
        'Tem certeza que deseja excluir este cliente?'
    );

    if (!confirmar) return;

    try {

        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        const resultado = await response.json();

        if (!response.ok) {
            throw new Error(resultado.message);
        }

        alert(resultado.message);

        carregarClientes();

    } catch (error) {
        console.error(error);
        alert(error.message || 'Erro ao excluir cliente.');
    }
}


// =====================================
// LIMPAR FORMULÁRIO
// =====================================

function limparFormulario() {

    form.reset();

    clienteId.value = '';

    formTitle.textContent = 'Cadastrar cliente';
    btnSalvar.textContent = 'Cadastrar cliente';

    btnCancelar.hidden = true;
}


// =====================================
// CANCELAR EDIÇÃO
// =====================================

btnCancelar.addEventListener('click', limparFormulario);


// =====================================
// PESQUISAR CLIENTES
// =====================================

pesquisa.addEventListener('input', () => {

    const termo = pesquisa.value.toLowerCase();

    const filtrados = clientes.filter(cliente => {

        const nomeCompleto =
            `${cliente.nome} ${cliente.sobrenome}`.toLowerCase();

        return (
            nomeCompleto.includes(termo) ||
            (cliente.cpf || '').includes(termo) ||
            (cliente.email || '').toLowerCase().includes(termo)
        );
    });

    renderizarClientes(filtrados);
});


// =====================================
// INICIALIZAR SISTEMA
// =====================================

carregarClientes();