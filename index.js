require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Получить все товары пользователя
app.get('/api/items/:telegramId', async (req, res) => {
    try {
        const { telegramId } = req.params;
        const items = await pool.query(
            'SELECT * FROM items WHERE telegram_id = $1 ORDER BY created_at DESC',
            [telegramId]
        );
        res.json(items.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Добавить новый товар
app.post('/api/items', async (req, res) => {
    try {
        const { telegramId, name, buyPrice } = req.body;
        const newItem = await pool.query(
            'INSERT INTO items (telegram_id, name, buy_price) VALUES ($1, $2, $3) RETURNING *',
            [telegramId, name, buyPrice]
        );
        res.json(newItem.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Продать товар
app.put('/api/items/:id/sell', async (req, res) => {
    try {
        const { id } = req.params;
        const { sellPrice } = req.body;
        const updatedItem = await pool.query(
            'UPDATE items SET sell_price = $1, sold_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [sellPrice, id]
        );
        res.json(updatedItem.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Получить статистику
app.get('/api/stats/:telegramId', async (req, res) => {
    try {
        const { telegramId } = req.params;
        const stats = await pool.query(`
            SELECT 
                COALESCE(SUM(buy_price), 0) as total_expenses,
                COALESCE(SUM(sell_price), 0) as total_income,
                COALESCE(SUM(sell_price - buy_price), 0) as total_profit
            FROM items 
            WHERE telegram_id = $1 AND sell_price IS NOT NULL
        `, [telegramId]);
        res.json(stats.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
