const express = require('express');
const router = express.Router();

const db = require('../config/database');

// =====================================
// LISTAR CLIENTES
// =====================================

router.get('/', async (req, res) => {
    try {
        const [clientes] = await db.query(
            'SELECT * FROM clientes ORDER BY cliente_id DESC'
        );

        res.json(clientes);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Erro ao buscar clientes.'
        });
    }
});


// =====================================
// BUSCAR CLIENTE POR ID
// =====================================

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [clientes] = await db.execute(
            'SELECT * FROM clientes WHERE cliente_id = ?',
            [id]
        );

        if (clientes.length === 0) {
            return res.status(404).json({
                message: 'Cliente não encontrado.'
            });
        }

        res.json(clientes[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Erro ao buscar cliente.'
        });
    }
});


// =====================================
// CADASTRAR CLIENTE
// =====================================

router.post('/', async (req, res) => {
    try {
        const {
            nome,
            sobrenome,
            cpf,
            telefone,
            email,
            endereco
        } = req.body;

        if (!nome || !sobrenome) {
            return res.status(400).json({
                message: 'Nome e sobrenome são obrigatórios.'
            });
        }

        const [resultado] = await db.execute(
            `INSERT INTO clientes
            (nome, sobrenome, cpf, telefone, email, endereco)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                nome,
                sobrenome,
                cpf || null,
                telefone || null,
                email || null,
                endereco || null
            ]
        );

        res.status(201).json({
            message: 'Cliente cadastrado com sucesso!',
            cliente_id: resultado.insertId
        });

    } catch (error) {
        console.error(error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Este CPF já está cadastrado.'
            });
        }

        res.status(500).json({
            message: 'Erro ao cadastrar cliente.'
        });
    }
});


// =====================================
// ATUALIZAR CLIENTE
// =====================================

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const {
            nome,
            sobrenome,
            cpf,
            telefone,
            email,
            endereco
        } = req.body;

        if (!nome || !sobrenome) {
            return res.status(400).json({
                message: 'Nome e sobrenome são obrigatórios.'
            });
        }

        const [resultado] = await db.execute(
            `UPDATE clientes SET
                nome = ?,
                sobrenome = ?,
                cpf = ?,
                telefone = ?,
                email = ?,
                endereco = ?
            WHERE cliente_id = ?`,
            [
                nome,
                sobrenome,
                cpf || null,
                telefone || null,
                email || null,
                endereco || null,
                id
            ]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                message: 'Cliente não encontrado.'
            });
        }

        res.json({
            message: 'Cliente atualizado com sucesso!'
        });

    } catch (error) {
        console.error(error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Este CPF já está cadastrado.'
            });
        }

        res.status(500).json({
            message: 'Erro ao atualizar cliente.'
        });
    }
});


// =====================================
// EXCLUIR CLIENTE
// =====================================

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [resultado] = await db.execute(
            'DELETE FROM clientes WHERE cliente_id = ?',
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                message: 'Cliente não encontrado.'
            });
        }

        res.json({
            message: 'Cliente excluído com sucesso!'
        });

    } catch (error) {
        console.error(error);

        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({
                message: 'Não é possível excluir um cliente que possui vendas registradas.'
            });
        }

        res.status(500).json({
            message: 'Erro ao excluir cliente.'
        });
    }
});

module.exports = router;