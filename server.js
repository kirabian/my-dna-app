const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// Load database referensi
const databaseGenetik = JSON.parse(fs.readFileSync('./database_genetik.json', 'utf8'));

// Token JEDI (Ganti jika sudah punya token asli dari dashboard)
const AUTH_TOKEN = "DEMO_TOKEN_JEDI";

// Endpoint 1.1.1: Authentication (Sesuai Dokumentasi)
app.post('/auth/sequencing', (req, res) => {
    res.json({ authenticationToken: AUTH_TOKEN });
});

// Endpoint 1.1.2 & 1.2.1: Job Submission & Data Retrieval
app.post('/job/register', async (req, res) => {
    const { dataFileId, attributes } = req.body;

    try {
        let dnaData;
        // Mencoba menarik data JSON asli dari server Sequencing
        try {
            const response = await axios.get(`https://data.sequencing.com/File/Download?id=${dataFileId}&json=1`, {
                headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
            });
            dnaData = response.data;
        } catch (e) {
            // Jika gagal/offline, gunakan simulasi data DNA (Isi genotip bervariasi)
            dnaData = {
                "rs3094315": "AA",
                "rs12124819": "AA",
                "rs11562": "AG",
                "rs13303354": "GG"
            };
        }

        // Hitung Persentase Suku
        const results = hitungSuku(dnaData);

        res.json({ status: 0, results, attributes });
    } catch (error) {
        res.status(500).json({ status: 1, error: error.message });
    }
});

function hitungSuku(dna) {
    let counts = {};
    let total = 0;
    for (const [rsid, genotype] of Object.entries(dna)) {
        if (databaseGenetik[rsid] && databaseGenetik[rsid][genotype]) {
            const label = databaseGenetik[rsid][genotype];
            counts[label] = (counts[label] || 0) + 1;
            total++;
        }
    }

    if (total === 0) return { "Data Tidak Mencukupi": 100 };

    let final = {};
    for (const [suku, n] of Object.entries(counts)) {
        final[suku] = Math.round((n / total) * 100);
    }
    return final;
}

// Jalankan di port 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Gunakan Ngrok untuk menghubungkan ke Sequencing.com JEDI`);
});