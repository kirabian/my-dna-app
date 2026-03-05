const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load database (Netlify butuh path absolut)
const dbPath = path.resolve(__dirname, '../../database_genetik.json');
const databaseGenetik = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

exports.handler = async (event, context) => {
    // Hanya izinkan method POST
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    const body = JSON.parse(event.body);
    const { dataFileId, attributes } = body;
    const AUTH_TOKEN = process.env.AUTH_TOKEN || "DEMO_TOKEN";

    try {
        // Simulasi/Tarik data DNA
        let dnaData = { "rs3094315": "AA", "rs12124819": "AA", "rs11562": "AG" };

        // Logika Hitung Suku
        let counts = {};
        let total = 0;
        for (const [rsid, genotype] of Object.entries(dnaData)) {
            if (databaseGenetik[rsid] && databaseGenetik[rsid][genotype]) {
                const label = databaseGenetik[rsid][genotype];
                counts[label] = (counts[label] || 0) + 1;
                total++;
            }
        }

        const results = total === 0 ? { "Unknown": 100 } : {};
        if (total > 0) {
            for (const [suku, n] of Object.entries(counts)) {
                results[suku] = Math.round((n / total) * 100);
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ status: 0, results, attributes })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};