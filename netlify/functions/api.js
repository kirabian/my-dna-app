exports.handler = async (event, context) => {
    // Hanya izinkan method POST
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body);
        const { name, age, height, weight, bloodType } = body;

        if (!name || (!age && age !== 0) || (!height && height !== 0) || (!weight && weight !== 0) || !bloodType) {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: "Kolom data belum lengkap. Silakan isi semua input." })
            };
        }

        // Buat string input sebagai basis hashing agar hasilnya deterministik untuk orang yang sama
        const rawString = `${String(name).trim().toLowerCase()}-${age}-${height}-${weight}-${String(bloodType).trim().toLowerCase()}`;

        let hash = 0;
        for (let i = 0; i < rawString.length; i++) {
            const char = rawString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        hash = Math.abs(hash); // Pastikan positif

        // Random generator deterministik berbasis hash
        function splitmix32(a) {
            return function () {
                a |= 0; a = a + 0x9e3779b9 | 0;
                let t = a ^ a >>> 16; t = Math.imul(t, 0x21f0aaad);
                t = t ^ t >>> 15; t = Math.imul(t, 0x735a2d97);
                return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
            }
        }

        const prng = splitmix32(hash);

        // Kategori etnis / daerah keturunan
        const ethnicities = [
            "Asian (Austronesian)",
            "Asian (East Asian)",
            "Asian (South Asian)",
            "Middle Eastern",
            "European (Western)",
            "European (Eastern)",
            "African",
            "Native American",
            "Polynesian",
            "Melanesian",
            "Scandinavian",
            "Mediterranean"
        ];

        // Tentukan ada berapa komponen etnis (antara 3 sampai 6)
        const numRegions = Math.floor(prng() * 4) + 3;

        // Acak list menggunakan algoritma Fisher-Yates dengan PRNG
        let shuffled = [...ethnicities];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(prng() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        const selected = shuffled.slice(0, numRegions);

        let remaining = 100;
        const results = {};

        for (let i = 0; i < selected.length; i++) {
            if (i === selected.length - 1) {
                results[selected[i]] = remaining;
            } else {
                // Beri nilai max dari (sisa - sisa slot) agar minimal tiap etnis ada 1%
                const max = remaining - (selected.length - i - 1);
                // Biar etnis utama lebih dominan, randomnya kita condongkan
                const divider = (i === 0) ? 1.5 : (i === 1) ? 2 : 3;
                const portion = Math.floor(prng() * (max / divider)) + 1;

                results[selected[i]] = portion;
                remaining -= portion;
            }
        }

        // Urutkan dari persentase terbesar ke terkecil
        const sortedResults = Object.fromEntries(
            Object.entries(results).sort(([, a], [, b]) => b - a)
        );

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                status: "success",
                person: { name, age, height, weight, bloodType },
                results: sortedResults
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: error.message })
        };
    }
};