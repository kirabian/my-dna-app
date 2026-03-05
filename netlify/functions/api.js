exports.handler = async (event, context) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body);
        const { fileName, fileSize, snpSamples } = body;

        if (!snpSamples || typeof snpSamples !== 'object' || Object.keys(snpSamples).length === 0) {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: "Sistem membutuhkan minimal 1 marker genetis sahih (rsID) dalam file DNA tersebut." })
            };
        }

        // --- Mock AIMs (Ancestry Informative Markers) Database ---
        // This simulates a genomic database that links specific rsIDs + genotypes to ancestral regions
        const ancestryDatabase = {
            "rs1426654": { // SLC24A5 gene (skin pigmentation)
                "AA": { region: "European (Western)", weight: 10 },
                "AG": { region: "Middle Eastern", weight: 5 },
                "GG": { region: "African", weight: 10 }
            },
            "rs16891982": { // SLC45A2
                "CC": { region: "African", weight: 8 },
                "CG": { region: "Middle Eastern", weight: 4 },
                "GG": { region: "Scandinavian", weight: 9 }
            },
            "rs3827760": { // EDAR gene (East Asian hair/teeth traits)
                "GG": { region: "Asian (East Asian)", weight: 12 },
                "AG": { region: "Asian (Austronesian)", weight: 6 },
                "AA": { region: "European (Eastern)", weight: 2 }
            },
            "rs2814778": { // Duffy antigen (Malaria resistance)
                "CC": { region: "African", weight: 15 },
                "TT": { region: "Mediterranean", weight: 3 }
            },
            "rs12913832": { // HERC2 (Eye color)
                "AA": { region: "European (Western)", weight: 8 },
                "AG": { region: "Mediterranean", weight: 5 },
                "GG": { region: "Asian (South Asian)", weight: 7 }
            },
            "rs17822931": { // ABCC11 (Earwax type)
                "AA": { region: "Asian (East Asian)", weight: 10 },
                "AG": { region: "Polynesian", weight: 6 },
                "GG": { region: "African", weight: 4 }
            },
            "rs4988235": { // MCM6 (Lactase persistence)
                "AA": { region: "Scandinavian", weight: 11 },
                "AG": { region: "European (Western)", weight: 6 },
                "GG": { region: "Asian (East Asian)", weight: 2 }
            },
            "rs334": { // HBB (Sickle cell trait)
                "AT": { region: "African", weight: 14 }
            },
            "rs671": { // ALDH2 (Alcohol flush reaction)
                "AA": { region: "Asian (East Asian)", weight: 12 },
                "AG": { region: "Asian (East Asian)", weight: 8 },
                "GG": { region: "Asian (Austronesian)", weight: 5 }
            },
            "rs738409": { // PNPLA3 (Metabolism)
                "GG": { region: "Native American", weight: 13 },
                "CG": { region: "Polynesian", weight: 7 }
            },
            "rs12203592": { // IRF4 (Freckles/Hair color)
                "TT": { region: "European (Western)", weight: 9 },
                "CT": { region: "European (Eastern)", weight: 5 }
            },
            "rs2395182": { // HLA-DRA
                "GG": { region: "Middle Eastern", weight: 7 },
                "TT": { region: "Asian (South Asian)", weight: 6 }
            },
            "rs2476601": { // PTPN22
                "AA": { region: "Scandinavian", weight: 8 },
                "AG": { region: "European (Eastern)", weight: 4 }
            },
            "rs429358": { // APOE e4
                "CC": { region: "African", weight: 5 },
                "TC": { region: "Melanesian", weight: 6 }
            },
            "rs6152": { // AR (Androgen receptor)
                "A": { region: "Mediterranean", weight: 5 },
                "G": { region: "Middle Eastern", weight: 5 }
            }
        };

        const regionDescriptions = {
            "Asian (Austronesian)": "Leluhur Anda merupakan pelaut ulung Austronesia yang rutenya membentang sepanjang Nusantara (Indonesia/Oseania). Genomik Anda menunjukkan kedekatan kuat dengan pengembara laut yang mengembangkan peradaban agraria rempah dunia mulai 5000 tahun yang lalu (Keturunan ras Austronesian murni).",
            "Asian (East Asian)": "Marka SNP kromosom Anda merekam dominasi kuat garis nenek moyang Tiongkok Purba, peradaban Han, dan kepulauan Jepang (Yayoi). Jejak genetik (seperti EDAR dan ALDH2) menyatakan leluhur Anda berpusat dari daratan Sungai Kuning sebelum migrasi peradaban sutra meluas ke selatan.",
            "Asian (South Asian)": "Rangkaian genotype dalam file data Anda secara telak menunjuk pada jejak sub-benua India dan peradaban tua Lembah Indus. Leluhur ras ini mencatatkan penyebaran filosofi sinkretisme purba nan mapan.",
            "European (Western)": "Marka genetis (seperti SLC24A5/HERC2 allele A) memvalidasi kecocokan keturunan tinggi dengan populasi ras Kaukasia pinggiran Atlantik dan Galia Eropa Barat. Pada era renaissance, peradaban leluhur ini sangat identik dengan revolusi maritim dunia.",
            "Scandinavian": "Stuktur MCM6 (Lactase persistence) mendeteksi garis keturunan kuat dari Nordik purba/Viking yang berevolusi secara unik untuk menghadapi suhu semi-arktik wilayah Eropa Utara ekstrim.",
            "African": "Sistem kami mendeteksi *Haplotype* asal murni (Out-of-Africa backbone) di untaian DNA spesifik file Anda (missal alel SLC45A2 tua / rs2814778 null). Ini mencirikan ras perintis umat manusia (Homo Sapiens Pertama) dengan penyebaran biologis paling tahan uji sepanjang kalender memori genetik.",
            "Middle Eastern": "Alele langka pada kromosom Anda berafiliasi teritorial kuat dengan Levant purbakala dan nomaden jazirah padang pasir Timur Tengah kuno. Kelompok genetik turunan Jazirah ini juga terkenal dalam transmisi dagang awal lintas mediterania-asia.",
            "European (Eastern)": "Sistem komputasi persilangan gen Eurasia Timur/Steppes menangkap anomali kedekatan genomik Anda terhadap garis kekaisaran Kievan Rusia hingga keturunan ras pengembara padang rumput Slavia raya murni masa lampau.",
            "Native American": "Marka alel langka (seperti PNP3LA derivatif) mengkalkulasi tautan probabilitas sangat besar bagi penyebaran prasejarah yang berhasil menaklukkan Beringia-Land Bridge belasan ribu tahun lampau menuju belahan Amerika.",
            "Polynesian": "Untai genom ras Australo-Melanesia bercampur ras perahu purba memverifikasi leluhur Pasifik tengah nan perkasa yang merajai pelayaran mikronesia. Kedekatan allele Anda sangat khas keturunan suku-suku Austronesia terluar.",
            "Melanesian": "Sistem kami berhasil memplot sebagian SNP gen anda terkait secara utuh dengan leluhur proto-Sahul di belahan ujung dangkalan suram Nusantara tenggara (Papua/Aborigin benua lama).",
            "Mediterranean": "Kode genetik Anda cocok memetakan sejarah pesisir Mediterania pra-Romawi yang tersohor mewarisi kekuatan fisik maritim laut-dalam unik dan toleransi iklim kering tepian laut klasik."
        };

        let rawScores = {};
        let totalScore = 0;
        let matchedMarkers = 0;

        // Process actual markers uploaded by user
        for (const [rsId, genotype] of Object.entries(snpSamples)) {
            if (ancestryDatabase[rsId] && ancestryDatabase[rsId][genotype]) {
                const matchInfo = ancestryDatabase[rsId][genotype];
                rawScores[matchInfo.region] = (rawScores[matchInfo.region] || 0) + matchInfo.weight;
                totalScore += matchInfo.weight;
                matchedMarkers++;
            }
        }

        let results = {};

        if (matchedMarkers === 0) {
            // Fallback if no specific markers from our small database were found in their massive file.
            // In a real system the database would hold 100,000+ SNPs.
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: "Sistem mendeteksi format file DNA, namun gagal memetakan rsID signifikan (Ancestry Informative Markers) pada database sistem versi beta ini." })
            };
        }

        // Calculate actual percentages based on valid hits
        for (const [region, score] of Object.entries(rawScores)) {
            const percentage = Math.round((score / totalScore) * 100);
            if (percentage > 0) {
                results[region] = {
                    percentage: percentage,
                    desc: regionDescriptions[region] || "Deskripsi area genetis tidak ditemukan."
                };
            }
        }

        // Fix rounding error to force sum to 100%
        const sortedArray = Object.entries(results).sort(([, a], [, b]) => b.percentage - a.percentage);

        let currentTotal = sortedArray.reduce((sum, [, item]) => sum + item.percentage, 0);
        let diff = 100 - currentTotal;

        if (diff !== 0 && sortedArray.length > 0) {
            sortedArray[0][1].percentage += diff; // Add/subtract diff from the dominant trait
        }

        // Ensure we drop 0% items after rounding adjustments
        const finalResults = Object.fromEntries(
            sortedArray.filter(([, item]) => item.percentage > 0)
        );

        const dominantRegion = sortedArray[0][0];
        const dominantStory = sortedArray[0][1].desc;

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                status: "success",
                fileMetadata: { name: fileName, size: fileSize, validatedMarkers: matchedMarkers },
                results: finalResults,
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