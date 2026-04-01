const title = 'BIRD OF A FEATHER';
const artist = 'Billie Eilish';

async function run() {
    // 1. LRCLIB Search with track_name + artist_name + q
    console.log("=== LRCLIB STRICT SEARCH ===");
    const params1 = new URLSearchParams({ track_name: title, artist_name: artist, q: `${artist} ${title}` });
    const res1 = await fetch(`https://lrclib.net/api/search?${params1}`);
    const data1 = await res1.json();
    console.log("Found:", data1?.length || 0);

    // 2. LRCLIB Search with ONLY q
    console.log("=== LRCLIB WEAK SEARCH ===");
    const params2 = new URLSearchParams({ q: `${artist} ${title}` });
    const res2 = await fetch(`https://lrclib.net/api/search?${params2}`);
    const data2 = await res2.json();
    console.log("Found:", data2?.length || 0);
    if(data2 && data2.length > 0) {
        console.log("Best match title:", data2[0].trackName);
    }
}
run();
