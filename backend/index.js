
const pool = require('./db');
const express = require('express');
const cors = require('cors');
const { create, all } = require('mathjs');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());


const rad = create(all);
const deg = create(all);

// Convert degrees to radians
const toRad = (x) => (x * Math.PI) / 180;

// Convert radians to degrees
const toDeg = (x) => (x * 180) / Math.PI;

// Override trigonometric functions for degree mode
deg.import(
    {
        sin: (x) => rad.sin(toRad(x)),
        cos: (x) => rad.cos(toRad(x)),
        tan: (x) => rad.tan(toRad(x)),

        asin: (x) => toDeg(rad.asin(x)),
        acos: (x) => toDeg(rad.acos(x)),
        atan: (x) => toDeg(rad.atan(x))
    },
    { override: true }
);


const radEvaluate = rad.evaluate;
const degEvaluate = deg.evaluate;

const disabled = () => {
    throw new Error('Function is disabled');
};

const restrictedFunctions = {
    import: disabled,
    createUnit: disabled,
    reviver: disabled,
    evaluate: disabled,
    parse: disabled,
    simplify: disabled,
    derivative: disabled,
    resolve: disabled
};

[rad, deg].forEach((engine) => {
    engine.import(restrictedFunctions, { override: true });
});


function calculate(expression, mode) {

    const evaluate = mode === 'rad'
        ? radEvaluate
        : degEvaluate;

    const value = evaluate(expression);

    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error('Math error');
    }

    // Remove very small floating-point errors
    if (Math.abs(value) < 1e-12) {
        return '0';
    }

    return String(parseFloat(value.toPrecision(12)));
}


// First API route
app.get('/', (req, res) => {
    res.send('Scientific Calculator API is running!');
});

// Second API route
app.get('/hello/:name', (req, res) => {
    const name = req.params.name;
    res.json({ message: `Hello, ${name}!` });
});


app.get('/api/db-test', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT NOW() AS current_time'
        );

        res.json({
            message: 'Database connected successfully!',
            time: result.rows[0].current_time
        });

    } catch (error) {
        console.error('Database error:', error.message);

        res.status(500).json({
            error: 'Database connection failed'
        });
    }
});


// Start the server
const PORT = process.env.PORT || 5000;

app.post('/api/calculate', async (req, res) => {

    const { expression, angleMode = 'deg' } = req.body || {};

    // 1. Validate the expression
    if (typeof expression !== 'string' || !expression.trim()) {
        return res.status(400).json({
            error: 'Expression is required'
        });
    }

    // 2. Check expression length
    if (expression.length > 200) {
        return res.status(400).json({
            error: 'Expression too long'
        });
    }

    // 3. Validate angle mode
    if (!['deg', 'rad'].includes(angleMode)) {
        return res.status(400).json({
            error: 'Invalid angle mode'
        });
    }

    let result;

    // 4. Calculate the expression
    try {
        result = calculate(expression, angleMode);
    } catch (error) {
        return res.status(400).json({
            error: 'Invalid expression'
        });
    }

    // 5. Store the calculation in PostgreSQL
    try {
        const { rows } = await pool.query(
            `INSERT INTO calculations
             (expression, result, angle_mode)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [expression, result, angleMode]
        );

        // 6. Send the result back
        res.status(201).json(rows[0]);

    } catch (error) {
        console.error('Database error:', error.message);

        res.status(500).json({
            error: 'Database error'
        });
    }
});


app.get('/api/history', async (req, res) => {

    try {
        const { rows } = await pool.query(
            'SELECT * FROM calculations ORDER BY created_at DESC LIMIT 100'
        );

        res.json(rows);

    } catch (error) {
        console.error('History error:', error.message);

        res.status(500).json({
            error: 'Could not retrieve calculation history'
        });
    }
});


app.delete('/api/history/:id', async (req, res) => {

    const id = Number(req.params.id);

    // Validate ID
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            error: 'Invalid calculation ID'
        });
    }

    try {
        const { rows } = await pool.query(
            'DELETE FROM calculations WHERE id = $1 RETURNING id',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: 'Calculation not found'
            });
        }

        res.status(200).json({
            message: 'Calculation deleted successfully'
        });

    } catch (error) {
        console.error('Delete error:', error.message);

        res.status(500).json({
            error: 'Could not delete calculation'
        });
    }
});

app.delete('/api/history', async (req, res) => {

    try {
        await pool.query(
            'TRUNCATE TABLE calculations RESTART IDENTITY'
        );

        res.status(200).json({
            message: 'Calculation history cleared successfully'
        });

    } catch (error) {
        console.error('Clear history error:', error.message);

        res.status(500).json({
            error: 'Could not clear history'
        });
    }
});



app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});