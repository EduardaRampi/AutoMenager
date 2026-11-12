const express = require('express');
const router = express.Router();

const db = require('../config/database');


// =====================================
// LISTAR VEÍCULOS
// =====================================

router.get('/', async (req, res) => {
    try {
        const { status, busca } = req.query;

        let sql = `
            SELECT
                v.veiculo_id,
                v.modelo_id,
                ma.nome AS marca,
                mo.modelo,
                mo.motor,
                mo.transmissao,
                mo.combustivel,
                v.ano,
                v.cor,
                v.quilometragem,
                v.placa,
                v.preco,
                v.descricao,
                v.status,
                p.ponto_id,
                p.nome AS ponto_venda

            FROM veiculos v

            INNER JOIN modelos mo
                ON v.modelo_id = mo.modelo_id

            INNER JOIN marcas ma
                ON mo.marca_id = ma.marca_id

            LEFT JOIN estoque e
                ON v.veiculo_id = e.veiculo_id

            LEFT JOIN pontos_venda p
                ON e.ponto_id = p.ponto_id

            WHERE 1 = 1
        `;

        const params = [];

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

        sql += ' ORDER BY v.veiculo_id DESC';

        const [veiculos] = await db.execute(sql, params);

        res.json(veiculos);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Erro ao consultar veículos.'
        });
    }
});


// =====================================
// LISTAR MARCAS E MODELOS
// =====================================

router.get('/opcoes', async (req, res) => {
    try {
        const [marcas] = await db.query(`
            SELECT marca_id, nome
            FROM marcas
            ORDER BY nome
        `);

        const [modelos] = await db.query(`
            SELECT modelo_id, modelo, marca_id
            FROM modelos
            ORDER BY modelo
        `);

        const [pontos] = await db.query(`
            SELECT ponto_id, nome
            FROM pontos_venda
            WHERE status = 'ativo'
            ORDER BY nome
        `);

        res.json({ marcas, modelos, pontos });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Erro ao carregar marcas e modelos.'
        });
    }
});


// =====================================
// CADASTRAR VEÍCULO
// =====================================

router.post('/', async (req, res) => {
    const {
        modelo_id,
        ano,
        cor,
        quilometragem,
        placa,
        preco,
        descricao,
        ponto_id
    } = req.body;

    if (
        !modelo_id ||
        !ano ||
        !cor ||
        !placa ||
        !preco ||
        !ponto_id
    ) {
        return res.status(400).json({
            message: 'Preencha os campos obrigatórios.'
        });
    }

    const conexao = await db.getConnection();

    try {
        await conexao.beginTransaction();

        const [resultado] = await conexao.execute(
            `INSERT INTO veiculos
            (modelo_id, ano, cor, quilometragem,
             placa, preco, descricao, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'disponivel')`,
            [
                modelo_id,
                ano,
                cor,
                quilometragem || 0,
                placa.trim().toUpperCase(),
                preco,
                descricao || null
            ]
        );

        await conexao.execute(
            `INSERT INTO estoque (veiculo_id, ponto_id)
             VALUES (?, ?)`,
            [resultado.insertId, ponto_id]
        );

        await conexao.commit();

        res.status(201).json({
            message: 'Veículo cadastrado com sucesso!',
            veiculo_id: resultado.insertId
        });

    } catch (error) {
        await conexao.rollback();

        console.error(error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Esta placa já está cadastrada.'
            });
        }

        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({
                message: 'Modelo ou ponto de venda inválido.'
            });
        }

        res.status(500).json({
            message: 'Erro ao cadastrar veículo.'
        });

    } finally {
        conexao.release();
    }
});


// =====================================
// ATUALIZAR VEÍCULO
// =====================================

router.put('/:id', async (req, res) => {
    const { id } = req.params;

    const {
        modelo_id,
        ano,
        cor,
        quilometragem,
        placa,
        preco,
        descricao,
        ponto_id
    } = req.body;

    if (
        !modelo_id ||
        !ano ||
        !cor ||
        !placa ||
        !preco ||
        !ponto_id
    ) {
        return res.status(400).json({
            message: 'Preencha os campos obrigatórios.'
        });
    }

    const conexao = await db.getConnection();

    try {
        await conexao.beginTransaction();

        const [veiculos] = await conexao.execute(
            'SELECT status FROM veiculos WHERE veiculo_id = ? FOR UPDATE',
            [id]
        );

        if (veiculos.length === 0) {
            await conexao.rollback();

            return res.status(404).json({
                message: 'Veículo não encontrado.'
            });
        }

        if (veiculos[0].status === 'vendido') {
            await conexao.rollback();

            return res.status(409).json({
                message: 'Veículos vendidos não podem ser editados.'
            });
        }

        await conexao.execute(
            `UPDATE veiculos SET
                modelo_id = ?,
                ano = ?,
                cor = ?,
                quilometragem = ?,
                placa = ?,
                preco = ?,
                descricao = ?
             WHERE veiculo_id = ?`,
            [
                modelo_id,
                ano,
                cor,
                quilometragem || 0,
                placa.trim().toUpperCase(),
                preco,
                descricao || null,
                id
            ]
        );

        await conexao.execute(
            `UPDATE estoque
             SET ponto_id = ?
             WHERE veiculo_id = ?`,
            [ponto_id, id]
        );

        await conexao.commit();

        res.json({
            message: 'Veículo atualizado com sucesso!'
        });

    } catch (error) {
        await conexao.rollback();

        console.error(error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Esta placa já está cadastrada.'
            });
        }

        res.status(500).json({
            message: 'Erro ao atualizar veículo.'
        });

    } finally {
        conexao.release();
    }
});


// =====================================
// EXCLUIR VEÍCULO
// =====================================

router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    const conexao = await db.getConnection();

    try {
        await conexao.beginTransaction();

        const [veiculos] = await conexao.execute(
            'SELECT status FROM veiculos WHERE veiculo_id = ? FOR UPDATE',
            [id]
        );

        if (veiculos.length === 0) {
            await conexao.rollback();

            return res.status(404).json({
                message: 'Veículo não encontrado.'
            });
        }

        if (veiculos[0].status === 'vendido') {
            await conexao.rollback();

            return res.status(409).json({
                message: 'Não é possível excluir um veículo vendido.'
            });
        }

        await conexao.execute(
            'DELETE FROM estoque WHERE veiculo_id = ?',
            [id]
        );

        await conexao.execute(
            'DELETE FROM veiculos WHERE veiculo_id = ?',
            [id]
        );

        await conexao.commit();

        res.json({
            message: 'Veículo excluído com sucesso!'
        });

    } catch (error) {
        await conexao.rollback();

        console.error(error);

        res.status(500).json({
            message: 'Erro ao excluir veículo.'
        });

    } finally {
        conexao.release();
    }
});

module.exports = router;