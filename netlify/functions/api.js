exports.handler = async (event, context) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const data = JSON.parse(event.body);
        const { name, age, height, weight, bloodType } = data;

        if (!name || !age || !height || !weight || !bloodType) {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: "Sistem mendeteksi ada parameter biometrik yang kosong. Semua wajib diisi." })
            };
        }

        const countryData = [
            { name: "Indonesian", desc: "Leluhur Anda merupakan pelaut ulung Austronesia yang rutenya membentang sepanjang Nusantara. Anda mewarisi ketahanan fisik maritim dan kepekaan agraris rempah kuno." },
            { name: "German", desc: "Genetik Anda memiliki kedekatan kuat dengan suku-suku keturunan Jermanik kuno di Eropa Tengah. Ciri utamanya adalah struktur tulang padat dan rekam jejak evolusi di iklim empat musim ekstrim." },
            { name: "French", desc: "Anda mewarisi jejak Kromosom Galia dan Eropa Barat. Leluhur ras ini mencatatkan peradaban klasik yang kaya akan filosofi seni dan kekuatan navigasi masa renaissance." },
            { name: "Japanese", desc: "Marka genetis Anda menangkap anomali kedekatan dengan keturunan Yayoi Kepulauan Jepang kuno. Tercetak dalam DNA Anda ketahanan terhadap diet pesisir laut dan disiplin kolektif." },
            { name: "British", desc: "Kalkulasi membaca kedekatan garis keturunan bangsa Anglo-Saxon dan Celtic Kuno. Memiliki mutasi gen unik yang sangat adaptif terhadap lingkungan lembab kepulauan barat laut Eropa." },
            { name: "Dutch", desc: "Sistem mendeteksi tautan probabilitas besar leluhur dataran rendah Skandinavia-Eropa (Nordik kuno). Ciri khasnya adalah mutasi pengikat metabolisme susu paling unggul (Lactase persistence) di bumi." },
            { name: "Arabian", desc: "Alele spesifik Anda berafiliasi teritorial kuat dengan nenek moyang Semit di Jazirah padang pasir Timur Tengah kuno. Kelompok genetik turunan ini terkenal sangat adaptif secara metabolisme air." },
            { name: "Korean", desc: "Untaian gen Anda tercatat sinkron dengan sub-etnis semenanjung Korea kuno (Goguryeo). Ras dengan struktur komunal terkuat dan ketahanan genetik terhadap musim dingin ekstrim Asia Timur." },
            { name: "Indian", desc: "Rangkaian genotype dalam data gabungan menunjuk telak pada jejak Lembah Indus kuno. Leluhur ras sub-benua ini paling beragam dan kaya akan genetika pertahanan virus purba." },
            { name: "Chinese", desc: "Sistem komputasi merangkum dominasi kuat dari peradaban Han atau Lembah Sungai Kuning kuno. Dianggap sebagai induk persebaran genetik utama di belahan bumi timur masa purbakala." },
            { name: "Italian", desc: "Kode genetik Anda cocok memetakan sejarah pesisir Mediterania-Romawi. Tersohor mewarisi kekuatan fisik maritim kuno dan toleransi pencernaan berbasis iklim hangat yang klasik." },
            { name: "Russian", desc: "Tangkap layar kromosom menunjukkan korelasi mendalam dengan pengembara padang rumput Slavia raya murni atau Stepa Eurasia Timur masa lampau yang keras." }
        ];

        // 1. DETERMINISTIC HASH FUNCTION based on ALL User Inputs
        const seedString = `${name.toLowerCase()}-${age}-${height}-${weight}-${bloodType}`;
        let hash = 0;
        for (let i = 0; i < seedString.length; i++) {
            const char = seedString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }

        // Ensure strictly positive seed for PRNG
        const seed = Math.abs(hash) + 1;

        // 2. PRNG (Pseudo-Random Number Generator) using Mulberry32 for deterministic randoms
        function mulberry32(a) {
            return function () {
                var t = a += 0x6D2B79F5;
                t = Math.imul(t ^ t >>> 15, t | 1);
                t ^= t + Math.imul(t ^ t >>> 7, t | 61);
                return ((t ^ t >>> 14) >>> 0) / 4294967296;
            }
        }

        const randomGen = mulberry32(seed);

        // 3. GENERATE DETERMINISTIC RESULTS
        // Pick how many countries will make up their DNA (3 to 6)
        const numCountries = Math.floor(randomGen() * 4) + 3;

        // Shuffle the countries deterministically
        let shuffledCountries = [...countryData];
        for (let i = shuffledCountries.length - 1; i > 0; i--) {
            const j = Math.floor(randomGen() * (i + 1));
            [shuffledCountries[i], shuffledCountries[j]] = [shuffledCountries[j], shuffledCountries[i]];
        }

        // Select the top N countries
        const selectedCountries = shuffledCountries.slice(0, numCountries);

        // Generate deterministic random percentages
        let rawPercentages = selectedCountries.map(() => randomGen() * 100);

        // Tweak: force the first one to be heavily dominant so it feels more realistic
        rawPercentages[0] += 50 + (randomGen() * 100);

        // Normalize to sum to exactly 100%
        const totalRaw = rawPercentages.reduce((sum, val) => sum + val, 0);
        let percentages = rawPercentages.map(val => Math.round((val / totalRaw) * 100));

        // Fix rounding errors so it strictly adds up to 100
        let currentTotal = percentages.reduce((sum, val) => sum + val, 0);
        let diff = 100 - currentTotal;
        if (diff !== 0) {
            // Apply diff to the highest percentage to conceal the adjustment
            percentages[0] += diff;
        }

        // Combine into result object
        let results = {};
        for (let i = 0; i < selectedCountries.length; i++) {
            results[selectedCountries[i].name] = {
                percentage: percentages[i],
                desc: selectedCountries[i].desc
            };
        }

        // Identify most dominant
        const dominantRegion = selectedCountries[0].name;
        const dominantStory = selectedCountries[0].desc;
        const generatedHashId = "#DNA-" + Math.abs(hash).toString(16).toUpperCase().substring(0, 8);

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                status: "success",
                hashId: generatedHashId,
                results: results,
                dominantRegion: dominantRegion,
                dominantStory: dominantStory
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