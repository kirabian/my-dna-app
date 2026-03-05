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

        // Kategori etnis / daerah keturunan beserta data narasi leluhur
        const ethnicityData = [
            {
                name: "Asian (Austronesian)",
                desc: "Leluhur Anda merupakan pelaut ulung Austronesia yang bermigrasi dari Taiwan ke wilayah Nusantara (Indonesia) antara 3000-1500 SM. Mereka membawa budaya maritim, agrikultur (padi & taro), serta teknologi perkapalan bercadik yang menyebar hingga ke Madagaskar dan Pulau Paskah."
            },
            {
                name: "Asian (East Asian)",
                desc: "Jejak DNA ini mengarah pada peradaban kuno Asia Timur (Dataran Tiongkok/Jepang/Korea). Leluhur Anda kemungkinan besar bermigrasi ke selatan pada masa Dinasti Han (206 SM – 220 M) atau melalui jalur Sutra Maritim, membawa pengaruh keramik, metalurgi, dan sistem perdagangan awal."
            },
            {
                name: "Asian (South Asian)",
                desc: "Keturunan ini memiliki kaitan dengan peradaban Lembah Indus dan sub-benua India purba. Leluhur Anda berinteraksi dengan wilayah Asia Tenggara pada masa Kerajaan Hindu-Buddha awal (abad ke-1 hingga ke-7 Masehi), membentuk jalur rempah-rempah yang legendaris."
            },
            {
                name: "Middle Eastern",
                desc: "Garis keturunan ini menelusuri Timur Tengah kuno (Semenanjung Arab/Levant). Migrasi gelombang besar terjadi pada abad ke-7 hingga abad ke-13 Masehi seiring dengan ekspansi rute perdagangan maritim global penyebar pengaruh budaya, sains, dan agama ke berbagai penjuru dunia."
            },
            {
                name: "European (Western)",
                desc: "Genetik ini terhubung kembali kepada ras Kaukasus Eropa Barat purba. Pada masa Penjelajahan Samudra (abad ke-15 hingga abad ke-17 Masehi), leluhur Anda melakukan perjalanan laut epik melintasi benua untuk membangun rute perdagangan komoditas dunia."
            },
            {
                name: "European (Eastern)",
                desc: "Jejak Genomik Eropa Timur/Kaukasia ini mengarah pada nenek moyang nomaden di stepa Eurasia ribuan tahun lalu. Migrasi gen ini kemungkinan tersebar melalui persilangan jalur darat Asia Tengah dan Jalur Sutra kuno pada masa abad ke-5 hingga abad pertengahan."
            },
            {
                name: "African",
                desc: "Ini adalah garis keturunan tertua umat manusia (Out of Africa). Nenek moyang paling purba Anda memulai perjalanan epik keluar dari benua Afrika lebih dari 60.000 hingga 70.000 tahun yang lalu, menyusuri pesisir hingga akhirnya bermukim di berbagai benua."
            },
            {
                name: "Native American",
                desc: "Keturunan genetis ini menyeberangi Jembatan Darat Beringia kuno dari Asia Timur ke benua Amerika sekitar 15.000 hingga 20.000 tahun yang lalu. Mereka adalah penjelajah tangguh yang beradaptasi di lingkungan ekstrem sejak zaman es glasial terakhir."
            },
            {
                name: "Polynesian",
                desc: "Para Ancestor Polinesia Anda adalah ahli navigasi lautan Pasifik terhebat dalam sejarah. Berasal dari penjelajah Lapita sekitar 1500 SM, mereka melintasi ribuan kilometer lautan terbuka bermodalkan rasi bintang dan arus ombak untuk menemukan kepulauan baru."
            },
            {
                name: "Melanesian",
                desc: "Garis keturunan Melanesia (Papua/Oseania) ini merupakan salah satu migrasi manusia paling awal ke timur setelah keluar dari Afrika, tiba di cekungan Sahul purba (Indonesia Timur Raya dan Australia kuno) sekitar 50.000 tahun yang lalu."
            },
            {
                name: "Scandinavian",
                desc: "Leluhur Anda merujuk pada pahlawan Skandinavia (Norsemen/Nordik) purba yang mulai bermigrasi agresif menyeberangi Eropa Barat pada Era Viking (793–1066 M). Genom ini membawa sifat adaptasi wilayah iklim subtropis dingin dan kemampuan kebaharian."
            },
            {
                name: "Mediterranean",
                desc: "Garis keturunan peradaban Mediterania ini berakar dari laut tengah (Eropa Selatan/Afrika Utara purba). Leluhur Mediterania Anda merupakan bagian dari zaman klasik maritim (1000 SM) dan keemasan Romawi/Yunani Kuno yang berpengaruh besar pada arsitektur dunia."
            }
        ];

        // Tentukan ada berapa komponen etnis (antara 3 sampai 6)
        const numRegions = Math.floor(prng() * 4) + 3;

        // Acak list menggunakan algoritma Fisher-Yates dengan PRNG
        let shuffled = [...ethnicityData];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(prng() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        const selected = shuffled.slice(0, numRegions);

        let remaining = 100;
        const results = {};

        for (let i = 0; i < selected.length; i++) {
            if (i === selected.length - 1) {
                results[selected[i].name] = { percentage: remaining, desc: selected[i].desc };
            } else {
                // Beri nilai max dari (sisa - sisa slot) agar minimal tiap etnis ada 1%
                const max = remaining - (selected.length - i - 1);
                // Biar etnis utama lebih dominan, randomnya kita condongkan
                const divider = (i === 0) ? 1.5 : (i === 1) ? 2 : 3;
                const portion = Math.floor(prng() * (max / divider)) + 1;

                results[selected[i].name] = { percentage: portion, desc: selected[i].desc };
                remaining -= portion;
            }
        }

        // Urutkan dari persentase terbesar ke terkecil
        const sortedArray = Object.entries(results).sort(([, a], [, b]) => b.percentage - a.percentage);
        const sortedResults = Object.fromEntries(sortedArray);

        // Ambil elemen pertama (Paling Dominan) untuk ditampilkan ceritanya
        const dominantRegion = sortedArray[0][0];
        const dominantStory = sortedArray[0][1].desc;

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                status: "success",
                person: { name, age, height, weight, bloodType },
                results: sortedResults,
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