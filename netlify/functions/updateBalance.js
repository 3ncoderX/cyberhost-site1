const { Client } = require('pg');

exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { userId, amount } = JSON.parse(event.body);

        // Veritabanına bağlan
        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();

        // 1. Mevcut bakiyeyi bul
        const userCheck = await client.query('SELECT balance FROM users WHERE id = $1', [userId]);
        
        if (userCheck.rows.length === 0) {
            await client.end();
            return { statusCode: 404, body: JSON.stringify({ success: false, message: "Kullanıcı bulunamadı." }) };
        }

        const currentBalance = parseFloat(userCheck.rows[0].balance);
        const newBalance = currentBalance + parseFloat(amount);

        // 2. Yeni bakiyeyi kaydet
        await client.query('UPDATE users SET balance = $1 WHERE id = $2', [newBalance, userId]);

        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, newBalance: newBalance })
        };

    } catch (error) {
        console.error("BAKİYE HATASI:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: error.message })
        };
    }
};