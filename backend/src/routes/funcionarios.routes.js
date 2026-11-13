const express = require('express');
const router = express.Router();

const db = require('../config/database');


// =====================================
// LISTAR FUNCIONÁRIOS
// =====================================

router.get('/', async (req, res) => {
    try {
        const { busca, ponto_id, status } = req.query;

        let sql = `
            SELECT
                f.funcionario_id,
                f.ponto_id,
                f.nome,
                f.cpf,
                f.email,
                f.telefone,
                f.cargo,
                f.status,
                p.nome AS ponto_venda

            FROM funcionarios f

            INNER JOIN pontos_venda p
                ON f.ponto_id = p.ponto_id

            WHERE 1 = 1
        `;

        const params = [];

        if (busca) {
            sql += `
                AND (
                    f.nome LIKE ?
                    OR f.cpf LIKE ?
                )
            `;

            const termo = `%${busca}%`;
            params.push(termo, termo);
        }

        if (ponto_id) {
            sql += ' AND f.ponto_id = ?';
            params.push(ponto_id);
        }

        if (status) {
            sql += ' AND f.status = ?';
            params.push(status);
        }

        sql += ' ORDER BY f.nome ASC';

        const [resultado] = await db.execute(sql, params);

        res.json(resultado);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Erro ao listar funcionários.'
        });
    }
});

// =====================================
// LISTAR PONTOS DE VENDA
// =====================================

router.get('/pontos', async (req, res) => {
    try {
        const [resultado] = await db.execute(`
            SELECT
                ponto_id,
                nome,
                endereco,
                status
            FROM pontos_venda
            WHERE status = 'ativo'
            ORDER BY nome ASC
        `);

        res.json(resultado);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Erro ao listar pontos de venda.'
        });
    }
});

// =====================================
// CADASTRAR NOVA FILIAL
// =====================================

router.post('/pontos', async (req, res) => {
    try {
        const { nome, endereco } = req.body;

        if (!nome || !nome.trim() || !endereco || !endereco.trim()) {
            return res.status(400).json({
                message: 'Informe o nome e o endereço da filial.'
            });
        }

        const [resultado] = await db.execute(`
            INSERT INTO pontos_venda (nome, endereco, status)
            VALUES (?, ?, 'ativo')
        `, [
            nome.trim(),
            endereco.trim()
        ]);

        res.status(201).json({
            message: 'Filial cadastrada com sucesso!',
            ponto_id: resultado.insertId
        });

    } catch (error) {
        console.error(error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Esta filial já está cadastrada.'
            });
        }

        res.status(500).json({
            message: 'Erro ao cadastrar filial.'
        });
    }
});

// =====================================
// BUSCAR FUNCIONÁRIO POR ID
// =====================================

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [resultado] = await db.execute(`
            SELECT *
            FROM funcionarios
            WHERE funcionario_id = ?
        `, [id]);

        if (resultado.length === 0) {
            return res.status(404).json({
                message: 'Funcionário não encontrado.'
            });
        }

        res.json(resultado[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Erro ao buscar funcionário.'
        });
    }
});

// =====================================
// CADASTRAR FUNCIONÁRIO
// =====================================

router.post('/', async (req, res) => {
    try {
        const {
            ponto_id,
            nome,
            cpf,
            email,
            telefone,
            cargo
        } = req.body;

        if (!ponto_id || !nome || !nome.trim()) {
            return res.status(400).json({
                message: 'Informe o nome e o ponto de venda.'
            });
        }

        if (cpf && !/^\d{11}$/.test(cpf)) {
            return res.status(400).json({
                message: 'O CPF deve conter 11 números.'
            });
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                message: 'Informe um e-mail válido.'
            });
        }

        const [pontos] = await db.execute(`
            SELECT ponto_id
            FROM pontos_venda
            WHERE ponto_id = ?
              AND status = 'ativo'
        `, [ponto_id]);

        if (pontos.length === 0) {
            return res.status(400).json({
                message: 'Ponto de venda inválido ou inativo.'
            });
        }

        const [resultado] = await db.execute(`
            INSERT INTO funcionarios
            (
                ponto_id,
                nome,
                cpf,
                email,
                telefone,
                cargo
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            ponto_id,
            nome.trim(),
            cpf || null,
            email || null,
            telefone || null,
            cargo || null
        ]);

        res.status(201).json({
            message: 'Funcionário cadastrado com sucesso!',
            funcionario_id: resultado.insertId
        });

    } catch (error) {
        console.error(error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Este CPF já está cadastrado.'
            });
        }

        res.status(500).json({
            message: 'Erro ao cadastrar funcionário.'
        });
    }
});


// =====================================
// EDITAR FUNCIONÁRIO
// =====================================

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const {
            ponto_id,
            nome,
            cpf,
            email,
            telefone,
            cargo,
            status
        } = req.body;

        if (!ponto_id || !nome || !nome.trim()) {
            return res.status(400).json({
                message: 'Nome e ponto de venda são obrigatórios.'
            });
        }

        if (cpf && !/^\d{11}$/.test(cpf)) {
            return res.status(400).json({
                message: 'O CPF deve conter 11 números.'
            });
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                message: 'Informe um e-mail válido.'
            });
        }

        if (
            status &&
            !['ativo', 'inativo'].includes(status)
        ) {
            return res.status(400).json({
                message: 'Status inválido.'
            });
        }

        const [funcionarios] = await db.execute(`
            SELECT funcionario_id
            FROM funcionarios
            WHERE funcionario_id = ?
        `, [id]);

        if (funcionarios.length === 0) {
            return res.status(404).json({
                message: 'Funcionário não encontrado.'
            });
        }

        const [pontos] = await db.execute(`
            SELECT ponto_id
            FROM pontos_venda
            WHERE ponto_id = ?
              AND status = 'ativo'
        `, [ponto_id]);

        if (pontos.length === 0) {
            return res.status(400).json({
                message: 'Ponto de venda inválido ou inativo.'
            });
        }

        await db.execute(`
            UPDATE funcionarios
            SET
                ponto_id = ?,
                nome = ?,
                cpf = ?,
                email = ?,
                telefone = ?,
                cargo = ?,
                status = ?
            WHERE funcionario_id = ?
        `, [
            ponto_id,
            nome.trim(),
            cpf || null,
            email || null,
            telefone || null,
            cargo || null,
            status || 'ativo',
            id
        ]);

        res.json({
            message: 'Funcionário atualizado com sucesso!'
        });

    } catch (error) {
        console.error(error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Este CPF já pertence a outro funcionário.'
            });
        }

        res.status(500).json({
            message: 'Erro ao atualizar funcionário.'
        });
    }
});


// =====================================
// DESATIVAR FUNCIONÁRIO
// =====================================

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [resultado] = await db.execute(`
            UPDATE funcionarios
            SET status = 'inativo'
            WHERE funcionario_id = ?
        `, [id]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                message: 'Funcionário não encontrado.'
            });
        }

        res.json({
            message: 'Funcionário desativado com sucesso!'
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Erro ao desativar funcionário.'
        });
    }
});

module.exports = router;