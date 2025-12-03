const { Client } = require('pg');

exports.handler = async function(event, context) {
    // Sadece POST isteklerini kabul et
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { username, password } = JSON.parse(event.body);

        // Basit validasyon
        if (!username || !password) {
            return { statusCode: 400, body: JSON.stringify({ success: false, message: "Eksik bilgi." }) };
        }
        
        // Veritabanı bağlantısı
        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();
        
        // 1. Kontrol: Bu kullanıcı adı zaten var mı?
        const checkUser = await client.query('SELECT * FROM users WHERE username = $1', [username]);
        
        if (checkUser.rows.length > 0) {
            await client.end();
            return {
                statusCode: 409, // Conflict hatası
                body: JSON.stringify({ success: false, message: "Bu kullanıcı adı zaten alınmış." })
            };
        }

        // 2. İşlem: Yeni kullanıcıyı ekle (Varsayılan bakiye 0, Rol user)
        await client.query(
            'INSERT INTO users (username, password, role, balance) VALUES ($1, $2, $3, $4)',
            [username, password, 'user', 0.00]
        );

        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: "Kayıt başarılı!" })
        };

    } catch (error) {
        console.error("KAYIT HATASI:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: "Sunucu hatası: " + error.message })
        };
    }
};