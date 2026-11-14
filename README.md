# 🚗 AutoManager

Sistema web de gerenciamento para concessionárias e revendas de veículos.

🌐 **Acesse o sistema:** [AutoManager – Site oficial](https://automanager-opensource.netlify.app/)

🚀 **Versão:** 2.0.0-alpha.1

**Status:** Em desenvolvimento.

O **AutoManager** é um sistema desenvolvido para facilitar o gerenciamento de operações de concessionárias e revendas de veículos, reunindo informações de clientes, funcionários, veículos, estoque e vendas em uma única plataforma.

## ✨ Funcionalidades

- [x] Dashboard com indicadores.
- [x] Cadastro e gerenciamento de clientes.
- [x] Cadastro e gerenciamento de veículos.
- [x] Controle de estoque.
- [x] Gerenciamento de funcionários.
- [x] Registro e consulta de vendas.
- [x] Ponto de Venda (PDV).
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

- [Node.js](https://nodejs.org/)
- [MySQL](https://www.mysql.com/)
- [Git](https://git-scm.com/)

### 2. Clonar o repositório

```bash
git clone https://github.com/EduardaRampi/AutoMenager.git
```

Entre na pasta do projeto:

```bash
cd AutoMenager
```

### 3. Criar o banco de dados

Abra o MySQL Workbench ou outra ferramenta de gerenciamento MySQL.

Execute o script localizado em:

```text
database/criar_database.sql
```

Esse arquivo contém a estrutura do banco de dados utilizada pelo sistema.

### 4. Configurar o backend

Entre na pasta do backend:

```bash
cd backend
```

Instale as dependências:

```bash
npm install
```

Crie uma cópia do arquivo `.env.example` com o nome `.env`.

Configure as informações de conexão com seu banco de dados MySQL.

### 5. Iniciar o servidor

Execute o comando de inicialização configurado no `package.json` do backend.

### 6. Acessar o sistema

Com o backend e o banco de dados configurados, abra o frontend utilizando um servidor local ou acesse a versão publicada:

[https://automanager-opensource.netlify.app/](https://automanager-opensource.netlify.app/)

## 🔐 Segurança

- As credenciais de acesso ao banco de dados são armazenadas em variáveis de ambiente.
- O arquivo `.env` não deve ser compartilhado ou publicado no GitHub.
- O arquivo `.env.example` deve conter apenas exemplos, nunca credenciais reais.

## 🚧 Status do desenvolvimento

O AutoManager está atualmente na versão **2.0.0-alpha.1**.

Esta versão representa uma etapa de desenvolvimento do projeto, disponibilizada para testes, validação das funcionalidades existentes e implementação de melhorias.

Novas funcionalidades e atualizações poderão ser adicionadas conforme a evolução do sistema.

## 👩‍💻 Desenvolvimento

Projeto desenvolvido como sistema web de gerenciamento automotivo.

---

**AutoManager — Gerenciamento automotivo em um só lugar.** 🚗
