const express = require('express');
const router = express.Router();
const db = require('../db');
const { logAction } = require('../utils/logger');

// Best-effort: asegurar tabla messages en entornos donde no se corrieron migraciones
async function ensureMessagesTable() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS messages (
              id INT AUTO_INCREMENT PRIMARY KEY,
              sender_id INT NOT NULL,
              receiver_id INT NOT NULL,
              message TEXT NOT NULL,
              subject VARCHAR(200) NOT NULL DEFAULT '',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              read_at TIMESTAMP NULL,
              FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
              FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        return true;
    } catch (e) {
        console.error('ensureMessagesTable error:', e);
        return false;
    }
}

// Get all users in the same tenant (excluye al propio usuario)
router.get('/users', async (req, res) => {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    try {
        const [users] = await db.query(`
            SELECT id, username FROM users WHERE tenant_id = ? AND id != ?
        `, [tenantId, userId]);
        res.json(users);
    } catch (error) {
        console.error('messages/users error:', error);
        res.status(500).json({ message: 'Error fetching users.' });
    }
});

// List messages (inbox or sent) with optional unread filter
router.get('/', async (req, res) => {
    const userId = req.user.id;
    const { box = 'inbox', unread = 'false' } = req.query; // box: inbox|sent
    try {
        let sql, params;
        if (box === 'sent') {
            // Mensajes enviados: asegurar que el receptor pertenece al mismo tenant
            sql = `SELECT m.id, m.message, m.subject, m.created_at, m.read_at, u.username AS receiver, m.receiver_id
                   FROM messages m
                   JOIN users u ON m.receiver_id = u.id
                   WHERE m.sender_id = ? AND u.tenant_id = ?
                   ORDER BY m.created_at DESC`;
            params = [userId, req.user.tenantId];
        } else {
            // Inbox: asegurar que el remitente pertenece al mismo tenant
            sql = `SELECT m.id, m.message, m.subject, m.created_at, m.read_at, u.username AS sender, m.sender_id
                   FROM messages m
                   JOIN users u ON m.sender_id = u.id
                   WHERE m.receiver_id = ? AND u.tenant_id = ?
                   ${unread === 'true' ? 'AND m.read_at IS NULL' : ''}
                   ORDER BY m.created_at DESC`;
            params = [userId, req.user.tenantId];
        }
        try {
            const [rows] = await db.query(sql, params);
            return res.json(rows);
        } catch (err) {
            // Fallback si la columna subject aún no existe (migración no corrida)
            if (err && err.code === 'ER_BAD_FIELD_ERROR') {
                let sqlFallback;
                if (box === 'sent') {
                    sqlFallback = `SELECT m.id, m.message, m.created_at, m.read_at, u.username AS receiver, m.receiver_id
                                    FROM messages m
                                    JOIN users u ON m.receiver_id = u.id
                                    WHERE m.sender_id = ? AND u.tenant_id = ?
                                    ORDER BY m.created_at DESC`;
                } else {
                    sqlFallback = `SELECT m.id, m.message, m.created_at, m.read_at, u.username AS sender, m.sender_id
                                    FROM messages m
                                    JOIN users u ON m.sender_id = u.id
                                    WHERE m.receiver_id = ? AND u.tenant_id = ?
                                    ${unread === 'true' ? 'AND m.read_at IS NULL' : ''}
                                    ORDER BY m.created_at DESC`;
                }
                const [rows] = await db.query(sqlFallback, params);
                return res.json(rows.map(r => ({ ...r, subject: '' })));
            }
            if (err && err.code === 'ER_NO_SUCH_TABLE') {
                // Tabla no existe: intentar crearla y reintentar una vez
                const ok = await ensureMessagesTable();
                if (ok) {
                    const [rows] = await db.query(sql, params);
                    return res.json(rows);
                }
            }
            throw err;
        }
    } catch (error) {
        console.error('messages list error:', error);
        res.status(500).json({ message: 'Error fetching messages.' });
    }
});

// Send a message to another user
router.post('/', async (req, res) => {
    const senderId = req.user.id;
    const { receiver_id, message, subject } = req.body;

    if (!receiver_id || !message || !subject) {
        return res.status(400).json({ message: 'Receiver, subject and message are required.' });
    }

    try {
        // Validar que receptor sea del mismo tenant
        const [receiverRows] = await db.query('SELECT id FROM users WHERE id = ? AND tenant_id = ?', [receiver_id, req.user.tenantId]);
        if (receiverRows.length === 0) {
            return res.status(400).json({ message: 'Receiver not found in your tenant.' });
        }
        try {
            const [result] = await db.query('INSERT INTO messages (sender_id, receiver_id, message, subject) VALUES (?, ?, ?, ?)', [senderId, receiver_id, message, subject]);
            await logAction(senderId, 'MESSAGE_SEND', req.user.tenantId, { messageId: result.insertId, to: receiver_id });
            return res.status(201).json({ message: 'Message sent successfully.', id: result.insertId });
        } catch (err) {
            if (err && err.code === 'ER_BAD_FIELD_ERROR') {
                // Fallback si columna subject no existe
                const [result] = await db.query('INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)', [senderId, receiver_id, message]);
                await logAction(senderId, 'MESSAGE_SEND', req.user.tenantId, { messageId: result.insertId, to: receiver_id });
                return res.status(201).json({ message: 'Message sent successfully (no subject).', id: result.insertId });
            }
            if (err && err.code === 'ER_NO_SUCH_TABLE') {
                const ok = await ensureMessagesTable();
                if (ok) {
                    const [result] = await db.query('INSERT INTO messages (sender_id, receiver_id, message, subject) VALUES (?, ?, ?, ?)', [senderId, receiver_id, message, subject]);
                    await logAction(senderId, 'MESSAGE_SEND', req.user.tenantId, { messageId: result.insertId, to: receiver_id });
                    return res.status(201).json({ message: 'Message sent successfully.', id: result.insertId });
                }
            }
            throw err;
        }
    } catch (error) {
        console.error('messages post error:', error);
        res.status(500).json({ message: 'Error sending message.' });
    }
});

// Mark a message as read
router.put('/:id/read', async (req, res) => {
    const messageId = req.params.id;
    const userId = req.user.id;

    try {
        const [result] = await db.query('UPDATE messages SET read_at = CURRENT_TIMESTAMP WHERE id = ? AND receiver_id = ?', [messageId, userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Message not found or you are not the receiver.' });
        }
        res.status(200).json({ message: 'Message marked as read.' });
    } catch (error) {
        if (error && error.code === 'ER_NO_SUCH_TABLE') {
            const ok = await ensureMessagesTable();
            if (ok) {
                const [result] = await db.query('UPDATE messages SET read_at = CURRENT_TIMESTAMP WHERE id = ? AND receiver_id = ?', [messageId, userId]);
                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: 'Message not found or you are not the receiver.' });
                }
                return res.status(200).json({ message: 'Message marked as read.' });
            }
        }
        console.error('messages read error:', error);
        res.status(500).json({ message: 'Error marking message as read.' });
    }
});

// Delete a message (only sender or receiver)
router.delete('/:id', async (req, res) => {
    const messageId = req.params.id;
    const userId = req.user.id;
    try {
        const [check] = await db.query('SELECT sender_id, receiver_id FROM messages WHERE id = ?', [messageId]);
        if (check.length === 0) return res.status(404).json({ message: 'Message not found.' });
        const m = check[0];
        if (m.sender_id !== userId && m.receiver_id !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this message.' });
        }
        await db.query('DELETE FROM messages WHERE id = ?', [messageId]);
        res.json({ message: 'Message deleted.' });
    } catch (error) {
        if (error && error.code === 'ER_NO_SUCH_TABLE') {
            const ok = await ensureMessagesTable();
            if (ok) {
                return res.status(404).json({ message: 'Message not found.' });
            }
        }
        console.error('messages delete error:', error);
        res.status(500).json({ message: 'Error deleting message.' });
    }
});

module.exports = router;
