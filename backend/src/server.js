const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/database');
const clientesRoutes = require('./routes/clientes.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const veiculosRoutes = require('./routes/veiculos.routes');
const estoqueRoutes = require('./routes/estoque.routes');
const funcionariosRoutes = require('./routes/funcionarios.routes');
const vendasRoutes = require('./routes/vendas.routes');



const app = express();

app.use(cors());
app.use(express.json());

// Rota inicial
app.get('/', (req, res) => {
    res.json({
        message: 'Bem-vindo ao AutoManager API!',
        status: 'Servidor funcionando!'
    });
});

// Rotas
app.use('/api/clientes', clientesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/veiculos', veiculosRoutes);
app.use('/api/estoque', estoqueRoutes);
app.use('/api/funcionarios', funcionariosRoutes);
app.use('/api/vendas', vendasRoutes);


// Teste de conexão com MySQL
app.get('/api/status', async (req, res) => {
    try {
        await db.query('SELECT 1');

        res.json({
            server: 'Online',
            database: 'Conectado'
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            server: 'Online',
            database: 'Desconectado'
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`AutoManager rodando na porta ${PORT}`);
});
