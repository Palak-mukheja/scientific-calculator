
const pool = require('./db');
const express = require('express');
const cors = require('cors');
const { create, all } = require('mathjs');
const app = express();
const { syncCalculationsToSheet } = require('./googleSheets');

// Middleware
app.use(cors());
app.use(express.json());



async function syncSheetSafely() {

    console.log('Starting Google Sheets synchronization...');

    for (let attempt = 1; attempt <= 3; attempt++) {

        try {

            await syncCalculationsToSheet();

            console.log('Google Sheets sync successful');

            return true;

        } catch (error) {

            console.error(
                `Google Sheets sync attempt ${attempt} failed:`,
                error.message
            );

            if (attempt < 3) {
                await new Promise(resolve =>
                    setTimeout(resolve, attempt * 1000)
                );
            }

        }

    }

    console.error('Google Sheets sync failed after 3 attempts');

    return false;
}

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

    console.log('CALCULATE ROUTE HIT');

    // 1. Validate the expression

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

// Synchronise Google Sheets
const sheetSynced = await syncSheetSafely();

// Return calculation and sync status
res.status(201).json({
    ...rows[0],
    sheet_synced: sheetSynced
});


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

        const sheetSynced = await syncSheetSafely();

        res.status(200).json({
            message: 'Calculation deleted successfully',
            sheet_synced: sheetSynced
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

        const sheetSynced = await syncSheetSafely();

        res.status(200).json({
            message: 'Calculation history cleared successfully',
            sheet_synced: sheetSynced
        });

    } catch (error) {
        console.error('Clear history error:', error.message);

        res.status(500).json({
            error: 'Could not clear calculation history'
        });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});