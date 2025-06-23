export function init() {
    const form = document.getElementById('matchup-form');
    if (!form) {
        console.error("Matchup form not found");
        return;
    }

    form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const ids = [
        'red-1', 'red-2', 'red-3',
        'blue-1', 'blue-2', 'blue-3'
    ];

    const teamNumbers = ids.map(id =>
        parseInt(document.getElementById(id).value, 10)
    );

        const epaData = await TEAMDATA.getEPABatch(teamNumbers);

        const redEPAs = epaData.slice(0, 3).map(t => t.epa || 0);
        const blueEPAs = epaData.slice(3).map(t => t.epa || 0);

        const redTotal = redEPAs.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
        const blueTotal = blueEPAs.reduce((accumulator, currentValue) => accumulator + currentValue, 0);

        const redWinChance = winChance(redTotal, blueTotal);
        const blueWinChance = 100 - redWinChance;

        document.getElementById('red-epa').textContent = redTotal.toFixed(2);
        document.getElementById('blue-epa').textContent = blueTotal.toFixed(2);
        document.getElementById('prediction').textContent = `Red: ${redWinChance.toFixed(1)}% | Blue: ${blueWinChance.toFixed(1)}%`;

        document.getElementById('results').classList.remove('hidden');
        });

        function winChance(redEPA, blueEPA) {
        const diff = redEPA - blueEPA;
        return 100 / (1 + Math.pow(Math.E, -diff / 7));
    }
}