const { Client } = require('pg');

exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { username, password } = JSON.parse(event.body);
        
        // Veritabanı bağlantısı
        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();
        
        // Kullanıcı kontrolü
        const result = await client.query(
            'SELECT * FROM users WHERE username = $1 AND password = $2', 
            [username, password]
        );

        await client.end();

        if (result.rows.length > 0) {
            const user = result.rows[0];
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    user: {
                        id: user.id,
                        username: user.username,
                        role: user.role,
                        balance: parseFloat(user.balance) // Sayı olarak gönder
                    }
                })
            };
        } else {
            return {
                statusCode: 401,
                body: JSON.stringify({ success: false, message: "Hatalı bilgi" })
            };
        }

    } catch (error) {
        console.error("HATA:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: "Veritabanı hatası: " + error.message })
        };
    }
};