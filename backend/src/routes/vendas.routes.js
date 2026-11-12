
const express = require('express');
const router = express.Router();

const db = require('../config/database');


// =====================================
// LISTAR VENDAS
// =====================================

router.get('/', async (req, res) => {
    try {
        const { busca, ponto_id, status } = req.query;

        let sql = `
            SELECT
                v.venda_id,
                v.data_venda,
                v.valor_venda,
                v.forma_pagamento,
                v.status,

                c.nome AS cliente_nome,
                c.sobrenome AS cliente_sobrenome,

                f.nome AS funcionario_nome,

                p.nome AS ponto_venda,

                ve.placa,
                ve.ano,
                mo.modelo,
                ma.nome AS marca

            FROM vendas v

            INNER JOIN clientes c
                ON v.cliente_id = c.cliente_id

            INNER JOIN funcionarios f
                ON v.funcionario_id = f.funcionario_id

            INNER JOIN pontos_venda p
                ON v.ponto_id = p.ponto_id

            INNER JOIN veiculos ve
                ON v.veiculo_id = ve.veiculo_id

            INNER JOIN modelos mo
                ON ve.modelo_id = mo.modelo_id

            INNER JOIN marcas ma
                ON mo.marca_id = ma.marca_id

            WHERE 1 = 1
        `;

        const params = [];

        if (busca) {
            sql += `
                AND (
                    c.nome LIKE ?
                    OR c.sobrenome LIKE ?
                    OR ve.placa LIKE ?
                    OR mo.modelo LIKE ?
                    OR ma.nome LIKE ?
                )
            `;

            const termo = `%${busca}%`;

            params.push(
                termo, termo, termo, termo, termo
            );
        }

        if (ponto_id) {
            sql += ' AND v.ponto_id = ?';
            params.push(ponto_id);
        }

        if (status) {
            sql += ' AND v.status = ?';
            params.push(status);
        }

        sql += ' ORDER BY v.data_venda DESC';

        const [resultado] = await db.execute(sql, params);

        res.json(resultado);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Erro ao listar vendas.'
        });
    }
});


// =====================================
// OPÇÕES PARA CADASTRAR UMA VENDA
// =====================================

router.get('/opcoes', async (req, res) => {
    try {

        const [clientes] = await db.query(`
            SELECT
                cliente_id,
                nome,
                sobrenome,
                cpf
            FROM clientes
            ORDER BY nome ASC
        `);

        const [veiculos] = await db.query(`
            SELECT
                ve.veiculo_id,
                ve.ano,
                ve.cor,
                ve.placa,
                ve.preco,
                mo.modelo,
                ma.nome AS marca,
                e.ponto_id,
                p.nome AS ponto_venda

            FROM estoque e

            INNER JOIN veiculos ve
                ON e.veiculo_id = ve.veiculo_id

            INNER JOIN modelos mo
                ON ve.modelo_id = mo.modelo_id

            INNER JOIN marcas ma
                ON mo.marca_id = ma.marca_id

            INNER JOIN pontos_venda p
                ON e.ponto_id = p.ponto_id

            WHERE ve.status = 'disponivel'
              AND p.status = 'ativo'

            ORDER BY ma.nome, mo.modelo
        `);

        const [funcionarios] = await db.query(`
            SELECT
                funcionario_id,
                ponto_id,
                nome,
                cargo
            FROM funcionarios
            WHERE status = 'ativo'
            ORDER BY nome ASC
        `);

        const [pontos] = await db.query(`
            SELECT
                ponto_id,
                nome
            FROM pontos_venda
            WHERE status = 'ativo'
            ORDER BY nome ASC
        `);

        res.json({
            clientes,
            veiculos,
            funcionarios,
            pontos
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Erro ao carregar opções da venda.'
        });
    }
});


// =====================================
// CADASTRAR VENDA
// =====================================

router.post('/', async (req, res) => {

    const {
        cliente_id,
        veiculo_id,
        funcionario_id,
        ponto_id,
        valor_venda,
        forma_pagamento
    } = req.body;

    if (
        !cliente_id ||
        !veiculo_id ||
        !funcionario_id ||
        !ponto_id ||
        valor_venda === undefined ||
        valor_venda === null ||
        !forma_pagamento
    ) {
        return res.status(400).json({
            message: 'Preencha todos os campos obrigatórios.'
        });
    }

    const clienteId = Number(cliente_id);
    const veiculoId = Number(veiculo_id);
    const funcionarioId = Number(funcionario_id);
    const pontoId = Number(ponto_id);
    const valor = Number(valor_venda);

    if (
        !Number.isInteger(clienteId) || clienteId <= 0 ||
        !Number.isInteger(veiculoId) || veiculoId <= 0 ||
        !Number.isInteger(funcionarioId) || funcionarioId <= 0 ||
        !Number.isInteger(pontoId) || pontoId <= 0
    ) {
        return res.status(400).json({
            message: 'Identificadores inválidos.'
        });
    }

    if (!Number.isFinite(valor) || valor <= 0) {
        return res.status(400).json({
            message: 'Informe um valor de venda válido.'
        });
    }

    const formasPagamento = [
        'À vista',
        'PIX',
        'Dinheiro',
        'Cartão de crédito',
        'Cartão de débito',
        'Financiamento'
    ];

    if (!formasPagamento.includes(forma_pagamento)) {
        return res.status(400).json({
            message: 'Forma de pagamento inválida.'
        });
    }

    let conexao;

    try {

        conexao = await db.getConnection();

        await conexao.beginTransaction();

        // Verificar cliente

        const [clientes] = await conexao.execute(`
            SELECT cliente_id
            FROM clientes
            WHERE cliente_id = ?
        `, [clienteId]);

        if (clientes.length === 0) {
            await conexao.rollback();

            return res.status(404).json({
                message: 'Cliente não encontrado.'
            });
        }

        // Verificar funcionário e filial

        const [funcionarios] = await conexao.execute(`
            SELECT funcionario_id
            FROM funcionarios
            WHERE funcionario_id = ?
              AND ponto_id = ?
              AND status = 'ativo'
        `, [funcionarioId, pontoId]);

        if (funcionarios.length === 0) {
            await conexao.rollback();

            return res.status(400).json({
                message: 'Funcionário inválido, inativo ou pertencente a outra filial.'
            });
        }

        // Verificar veículo no estoque da filial

        const [veiculos] = await conexao.execute(`
            SELECT
                ve.veiculo_id,
                ve.status
            FROM estoque e

            INNER JOIN veiculos ve
                ON e.veiculo_id = ve.veiculo_id

            WHERE e.veiculo_id = ?
              AND e.ponto_id = ?
              AND ve.status = 'disponivel'

            FOR UPDATE
        `, [veiculoId, pontoId]);

        if (veiculos.length === 0) {
            await conexao.rollback();

            return res.status(400).json({
                message: 'Veículo indisponível ou não pertence à filial selecionada.'
            });
        }

        // Registrar venda

        const [resultado] = await conexao.execute(`
            INSERT INTO vendas (
                cliente_id,
                veiculo_id,
                funcionario_id,
                ponto_id,
                valor_venda,
                forma_pagamento,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, 'concluida')
        `, [
            clienteId,
            veiculoId,
            funcionarioId,
            pontoId,
            valor.toFixed(2),
            forma_pagamento
        ]);

        // Atualizar veículo

        await conexao.execute(`
            UPDATE veiculos
            SET status = 'vendido'
            WHERE veiculo_id = ?
        `, [veiculoId]);

        // Remover veículo do estoque

        await conexao.execute(`
            DELETE FROM estoque
            WHERE veiculo_id = ?
              AND ponto_id = ?
        `, [veiculoId, pontoId]);

        await conexao.commit();

        res.status(201).json({
            message: 'Venda registrada com sucesso!',
            venda_id: resultado.insertId
        });

    } catch (error) {

        if (conexao) {
            await conexao.rollback();
        }

        console.error(error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Este veículo já possui uma venda registrada.'
            });
        }

        res.status(500).json({
            message: 'Erro ao registrar venda.'
        });

    } finally {

        if (conexao) {
            conexao.release();
        }
    }
});

module.exports = router;