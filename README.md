# 🚗 AutoManager

Sistema web de gerenciamento para concessionárias e revendas de veículos.

🌐 Acesse o sistema: [AutoManager – Site oficial](https://automanager-opensource.netlify.app/)
🚀 Versão: 1.1.0-alpha.1

O **AutoManager** é um projeto desenvolvido para facilitar o gerenciamento de operações de uma loja de veículos, reunindo informações de clientes, funcionários, veículos, estoque e vendas em um único sistema.
  
> **Status:** Em desenvolvimento.

## ✨ Funcionalidades

- [x] Dashboard com indicadores.
- [x] Cadastro e gerenciamento de clientes.
- [x] Cadastro e gerenciamento de veículos.
- [x] Controle de estoque.
- [x] Gerenciamento de funcionários.
- [x] Registro e consulta de vendas.
- [ ] Testes completos do processo de venda.
- [ ] Melhorias e novas funcionalidades.

## 🛠️ Tecnologias utilizadas

**Frontend**
- HTML5
- CSS3
- JavaScript

**Backend**
- Node.js
- Express

**Banco de dados**
- MySQL

## 📁 Estrutura do projeto

```text
AutoManager/
├── backend/
│   ├── src/
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── assets/
│   ├── css/
│   ├── html/
│   ├── js/
│   └── index.html
├── database/
│   └── criar_database.sql
├── .gitignore
└── README.md
```

## ⚙️ Como instalar e executar

### 1. Pré-requisitos

Antes de começar, você precisará ter instalado:

- Node.js
- MySQL
- Git

### 2. Clonar o repositório

```bash
git clone URL_DO_REPOSITORIO
```

Entre na pasta do projeto:

```bash
cd AutoManager
```

### 3. Criar o banco de dados

Abra o MySQL Workbench ou outra ferramenta de gerenciamento MySQL.

Execute o script:

```text
database/criar_database.sql
```

Ele criará a estrutura do banco de dados utilizada pelo sistema.

### 4. Configurar o backend

Entre na pasta:

```bash
cd backend
```

Instale as dependências:

```bash
npm install
```

Crie uma cópia do arquivo `.env.example` com o nome `.env`.

Configure as informações de conexão com seu banco MySQL.

### 5. Iniciar o servidor

Execute o comando de inicialização definido no `package.json` do backend.

## 🔐 Segurança

As credenciais de acesso ao banco de dados são armazenadas em variáveis de ambiente.

O arquivo `.env` não deve ser compartilhado ou publicado no GitHub.

## 🚧 Status do desenvolvimento

O AutoManager está atualmente na versão **1.0.0-alpha.1**.

Esta versão representa uma etapa inicial do projeto, disponibilizada para testes, validação das funcionalidades e futuras melhorias.

## 👩‍💻 Desenvolvimento

Projeto desenvolvido como sistema web de gerenciamento automotivo.

---

**AutoManager — Gerenciamento automotivo em um só lugar.** 🚗
