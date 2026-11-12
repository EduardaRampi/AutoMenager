const express = require('express');
const router = express.Router();

const db = require('../config/database');


// =====================================
// LISTAR ESTOQUE
// =====================================

router.get('/', async (req, res) => {
    try {
        const { ponto_id, status, busca } = req.query;

        let sql = `
            SELECT
                e.estoque_id,
                e.veiculo_id,
                e.ponto_id,
                e.data_entrada,

                v.ano,
                v.cor,
                v.placa,
                v.preco,
                v.quilometragem,
                v.status,

                mo.modelo,
                ma.nome AS marca,

                p.nome AS ponto_venda

            FROM estoque e

            INNER JOIN veiculos v
                ON e.veiculo_id = v.veiculo_id

            INNER JOIN modelos mo
                ON v.modelo_id = mo.modelo_id

            INNER JOIN marcas ma
                ON mo.marca_id = ma.marca_id

            INNER JOIN pontos_venda p
                ON e.ponto_id = p.ponto_id

            WHERE 1 = 1
        `;

        const params = [];

        if (ponto_id) {
            sql += ' AND e.ponto_id = ?';
            params.push(ponto_id);
        }

        if (status) {
            sql += ' AND v.status = ?';
            params.push(status);
        }

        if (busca) {
            sql += `
                AND (
                    ma.nome LIKE ?
                    OR mo.modelo LIKE ?
                    OR v.placa LIKE ?
                )
            `;

            const termo = `%${busca}%`;
            params.push(termo, termo, termo);
        }

        sql += ' ORDER BY e.data_entrada DESC';

        const [resultado] = await db.execute(sql, params);

        res.json(resultado);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Erro ao consultar estoque.'
        });
    }
});


// =====================================
// RESUMO DO ESTOQUE POR FILIAL
// =====================================

router.get('/resumo', async (req, res) => {
    try {
        const [resultado] = await db.query(`
            SELECT
                p.ponto_id,
                p.nome AS ponto_venda,

                COUNT(e.estoque_id) AS total_veiculos,

                SUM(
                    CASE
                        WHEN v.status = 'disponivel' THEN 1
                        ELSE 0
                    END
                ) AS disponiveis,

                SUM(
                    CASE
                        WHEN v.status = 'reservado' THEN 1
                        ELSE 0
                    END
                ) AS reservados,

                SUM(
                    CASE
                        WHEN v.status = 'vendido' THEN 1
                        ELSE 0
                    END
                ) AS vendidos

            FROM pontos_venda p

            LEFT JOIN estoque e
                ON p.ponto_id = e.ponto_id

            LEFT JOIN veiculos v
                ON e.veiculo_id = v.veiculo_id

            WHERE p.status = 'ativo'

            GROUP BY p.ponto_id, p.nome

            ORDER BY p.ponto_id
        `);

        res.json(resultado);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Erro ao consultar resumo do estoque.'
        });
    }
});


// =====================================
// HISTÓRICO DE MOVIMENTAÇÕES
// =====================================

router.get('/movimentacoes', async (req, res) => {
    try {
        const [resultado] = await db.query(`
            SELECT
                m.movimentacao_id,
                m.veiculo_id,
                m.data_movimentacao,
                m.observacao,

                v.placa,
                mo.modelo,
                ma.nome AS marca,

                origem.nome AS filial_origem,
                destino.nome AS filial_destino

            FROM estoque_movimentacoes m

            INNER JOIN veiculos v
                ON m.veiculo_id = v.veiculo_id

            INNER JOIN modelos mo
                ON v.modelo_id = mo.modelo_id

            INNER JOIN marcas ma
                ON mo.marca_id = ma.marca_id

            INNER JOIN pontos_venda origem
                ON m.ponto_origem = origem.ponto_id

            INNER JOIN pontos_venda destino
                ON m.ponto_destino = destino.ponto_id

            ORDER BY m.data_movimentacao DESC
        `);

        res.json(resultado);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Erro ao consultar movimentações.'
        });
    }
});


// =====================================
// CONSULTAR ESTOQUE DE UMA FILIAL
// =====================================

router.get('/:ponto_id', async (req, res) => {
    try {
        const { ponto_id } = req.params;

        const [resultado] = await db.execute(`
            SELECT
                e.estoque_id,
                e.veiculo_id,
                e.data_entrada,
                v.ano,
                v.cor,
                v.placa,
                v.preco,
                v.status,
                mo.modelo,
                ma.nome AS marca,
                p.nome AS ponto_venda

            FROM estoque e

            INNER JOIN veiculos v
                ON e.veiculo_id = v.veiculo_id

            INNER JOIN modelos mo
                ON v.modelo_id = mo.modelo_id

            INNER JOIN marcas ma
                ON mo.marca_id = ma.marca_id

            INNER JOIN pontos_venda p
                ON e.ponto_id = p.ponto_id

            WHERE e.ponto_id = ?

            ORDER BY e.data_entrada DESC
        `, [ponto_id]);

        res.json(resultado);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Erro ao consultar filial.'
        });
    }
});


// =====================================
// TRANSFERIR VEÍCULO
// =====================================

router.post('/transferir', async (req, res) => {
    const {
        veiculo_id,
        ponto_destino,
        observacao
    } = req.body;

    if (!veiculo_id || !ponto_destino) {
        return res.status(400).json({
            message: 'Informe o veículo e a filial de destino.'
        });
    }

    const conexao = await db.getConnection();

    try {
        await conexao.beginTransaction();

        // Bloqueia o registro durante a transferência
        const [estoque] = await conexao.execute(`
            SELECT ponto_id
            FROM estoque
            WHERE veiculo_id = ?
            FOR UPDATE
        `, [veiculo_id]);

        if (estoque.length === 0) {
            await conexao.rollback();

            return res.status(404).json({
                message: 'Veículo não encontrado no estoque.'
            });
        }

        const pontoOrigem = estoque[0].ponto_id;

        if (Number(pontoOrigem) === Number(ponto_destino)) {
            await conexao.rollback();

            return res.status(400).json({
                message: 'O veículo já está nesta filial.'
            });
        }

        // Verifica a situação do veículo
        const [veiculos] = await conexao.execute(`
            SELECT status
            FROM veiculos
            WHERE veiculo_id = ?
            FOR UPDATE
        `, [veiculo_id]);

        if (
            veiculos.length === 0 ||
            veiculos[0].status !== 'disponivel'
        ) {
            await conexao.rollback();

            return res.status(409).json({
                message: 'Somente veículos disponíveis podem ser transferidos.'
            });
        }

        // Verifica se a filial de destino está ativa
        const [pontos] = await conexao.execute(`
            SELECT ponto_id
            FROM pontos_venda
            WHERE ponto_id = ?
              AND status = 'ativo'
        `, [ponto_destino]);

        if (pontos.length === 0) {
            await conexao.rollback();

            return res.status(400).json({
                message: 'Ponto de venda inválido ou inativo.'
            });
        }

        // Atualiza a localização atual
        await conexao.execute(`
            UPDATE estoque
            SET ponto_id = ?,
                data_entrada = CURRENT_TIMESTAMP
            WHERE veiculo_id = ?
        `, [ponto_destino, veiculo_id]);

        // Registra a movimentação
        await conexao.execute(`
            INSERT INTO estoque_movimentacoes
            (
                veiculo_id,
                ponto_origem,
                ponto_destino,
                observacao
            )
            VALUES (?, ?, ?, ?)
        `, [
            veiculo_id,
            pontoOrigem,
            ponto_destino,
            observacao || null
        ]);

        await conexao.commit();

        res.json({
            message: 'Veículo transferido com sucesso!',
            veiculo_id,
            ponto_origem: pontoOrigem,
            ponto_destino
        });

    } catch (error) {
        await conexao.rollback();

        console.error(error);

        res.status(500).json({
            message: 'Erro ao transferir veículo.'
        });

    } finally {
        conexao.release();
    }
});

module.exports = router;