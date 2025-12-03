const { Client } = require('pg');

exports.handler = async function(event, context) {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        // Tüm kullanıcıları çek
        const result = await client.query('SELECT id, username, role, balance FROM users ORDER BY id DESC');
        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify(result.rows)
        };
    } catch (error) {
        console.error("HATA:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};