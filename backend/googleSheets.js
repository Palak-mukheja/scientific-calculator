
const { google } = require('googleapis');
const pool = require('./db');

// Authenticate using the Google service account

function getGoogleSheetsClient() {

    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL?.trim();

    const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;

    const privateKey = rawPrivateKey
        ?.trim()
        .replace(/^["']|["']$/g, '')
        .replace(/\\n/g, '\n')
        .replace(/\r\n/g, '\n');

    if (!clientEmail || !privateKey) {
        throw new Error('Google credentials are missing');
    }

    // Validate that the environment variable contains a complete PEM key
    if (
        !privateKey.startsWith('-----BEGIN PRIVATE KEY-----') ||
        !privateKey.trim().endsWith('-----END PRIVATE KEY-----')
    ) {
        throw new Error(
            'Invalid GOOGLE_PRIVATE_KEY format. Check the service account private_key value.'
        );
    }

    const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: [
            'https://www.googleapis.com/auth/spreadsheets'
        ]
    });

    return google.sheets({
        version: 'v4',
        auth
    });
}



// Synchronise Neon database with Google Sheets
async function syncCalculationsToSheet() {

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
        throw new Error('Google Spreadsheet ID is missing');
    }

    const sheets = getGoogleSheetsClient();

    // Fetch latest calculations from Neon
    const { rows } = await pool.query(
        `SELECT id, expression, result, angle_mode, created_at
         FROM calculations
         ORDER BY created_at DESC, id DESC`
    );

    // Clear existing spreadsheet data, preserving headers
    await sheets.spreadsheets.values.clear({

        spreadsheetId,

        range: 'Sheet1!A2:E'

    });

    // Write the latest database records
    if (rows.length > 0) {

        const values = rows.map((row) => [

            row.id,
            row.expression,
            row.result,
            row.angle_mode,
            new Date(row.created_at).toISOString()

        ]);

        await sheets.spreadsheets.values.update({

            spreadsheetId,

            range: 'Sheet1!A2',

            valueInputOption: 'RAW',

            requestBody: {
                values
            }

        });

    }

    console.log(
        `Google Sheets synchronised: ${rows.length} records`
    );

}

module.exports = {
    syncCalculationsToSheet
};
