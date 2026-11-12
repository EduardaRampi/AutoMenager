const express = require('express');
const router = express.Router();

const db = require('../config/database');

// =====================================
// INDICADORES PRINCIPAIS
// =====================================

router.get('/resumo', async (req, res) => {
    try {
        const [resultado] = await db.query(`
            SELECT
                (
                    SELECT COALESCE(SUM(valor_venda), 0)
                    FROM vendas
                    WHERE status = 'concluida'
                ) AS faturamento,

                (
                    SELECT COUNT(*)
                    FROM veiculos
                    WHERE status = 'disponivel'
                ) AS veiculos_disponiveis,

                (
                    SELECT COUNT(*)
                    FROM clientes
                ) AS total_clientes,

                (
                    SELECT COUNT(*)
                    FROM vendas
                    WHERE status = 'concluida'
                ) AS total_vendas
        `);

        res.json(resultado[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Erro ao carregar indicadores.'
        });
    }
});


// =====================================
// FATURAMENTO MENSAL
// =====================================

router.get('/faturamento-mensal', async (req, res) => {
    try {
        const [resultado] = await db.query(`
            SELECT
                DATE_FORMAT(data_venda, '%Y-%m') AS mes,
                SUM(valor_venda) AS faturamento
            FROM vendas
            WHERE status = 'concluida'
                AND data_venda >= DATE_SUB(
                    CURDATE(), INTERVAL 6 MONTH
                )
            GROUP BY DATE_FORMAT(data_venda, '%Y-%m')
            ORDER BY mes ASC
        `);

        res.json(resultado);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Erro ao consultar faturamento.'
        });
    }
});


// =====================================
// VENDAS POR FILIAL
// =====================================

router.get('/vendas-por-filial', async (req, res) => {
    try {
        const [resultado] = await db.query(`
            SELECT
                p.nome AS filial,
                COUNT(v.venda_id) AS total_vendas,
                COALESCE(SUM(v.valor_venda), 0) AS faturamento
            FROM pontos_venda p

            LEFT JOIN vendas v
                ON p.ponto_id = v.ponto_id
                AND v.status = 'concluida'

            GROUP BY p.ponto_id, p.nome
            ORDER BY faturamento DESC
        `);

        res.json(resultado);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Erro ao consultar vendas por filial.'
        });
    }
});

module.exports = router;
