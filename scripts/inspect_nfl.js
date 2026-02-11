
const API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';

async function checkNFLData() {
    // Super Bowl LVIII (Chiefs vs 49ers) - reliable past game
    const gameId = '401547758';
    const url = `${API_BASE}/summary?event=${gameId}`;

    console.log(`Fetching ${url}...`);
    const res = await fetch(url);
    const data = await res.json();

    // Inspect Plays
    const drives = data.drives?.previous || [];
    if (drives.length > 0) {
        const firstDrive = drives[0];
        console.log("Example Drive:", JSON.stringify(firstDrive, null, 2));

        if (firstDrive.plays && firstDrive.plays.length > 0) {
            console.log("Example Play:", JSON.stringify(firstDrive.plays[0], null, 2));
        }
    } else {
        console.log("No drives found.");
    }
}

checkNFLData();
