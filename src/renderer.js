const pageIds = ['dashboard', 'matchAnalysis', 'picklist', 'matchupGenerator', 'teamLookup'];

let today = new Date();

const pageScripts = {
    dashboard: () => import('./scripts/dashboard.js'),
    matchupGenerator: () => import('./scripts/matchup.js'),
    picklist: () => import('./scripts/picklist.js'),
    matchAnalysis: () => import('./scripts/matchAnalysis.js'),
    teamLookup: () => import('./scripts/teamLookup.js'),
};

let maxSeason;

function showPage(pageId) {
    pageIds.forEach(id => {
        const section = document.getElementById(id);
        section.classList.add('hidden');
    });
    document.getElementById(pageId).classList.remove('hidden');
}

function loadPageOnce(pageId) {
    const section = document.getElementById(pageId);

    document.querySelectorAll('link[data-page-style]').forEach(link => {
        if (link.dataset.pageStyle && link.dataset.pageStyle !== pageId) {
            link.remove();
        }
    });

    const existingStyle = document.querySelector(`link[data-page-style="${pageId}"]`);
    if (!existingStyle) {
        const style = document.createElement('link');
        style.rel = 'stylesheet';
        style.href = `styles/${pageId}.css`;
        style.dataset.pageStyle = pageId;
        document.head.appendChild(style);
    }

    if (!section.dataset.loaded) {
        fetch(`pages/${pageId}.html`)
            .then(res => res.text())
            .then(async html => {
                section.innerHTML = html;
                section.dataset.loaded = "true";

                await new Promise(requestAnimationFrame);
                showPage(pageId);

                if (pageScripts[pageId]) {
                    const mod = await pageScripts[pageId]();
                    mod.init?.();

                    if (pageId === 'dashboard') attachDashboardTileEvents();
                }
            });
    } else {
        showPage(pageId);
    }
}

function attachDashboardTileEvents() {
    document.getElementById('tile-match').addEventListener('click', () => loadPageOnce('matchAnalysis'));
    document.getElementById('tile-picklist').addEventListener('click', () => loadPageOnce('picklist'));
    document.getElementById('tile-matchup').addEventListener('click', () => loadPageOnce('matchupGenerator'));
}

window.addEventListener('DOMContentLoaded', async () => {
    maxSeason = await COMPUSTAT.currentSeason();
    console.log(maxSeason);

    document.getElementById('nav-dashboard').addEventListener('click', () => loadPageOnce('dashboard'));
    document.getElementById('nav-match').addEventListener('click', () => loadPageOnce('matchAnalysis'));
    document.getElementById('nav-picklist').addEventListener('click', () => loadPageOnce('picklist'));
    document.getElementById('nav-matchup').addEventListener('click', () => loadPageOnce('matchupGenerator'));
    document.getElementById('nav-teamLookup').addEventListener('click', () => loadPageOnce('teamLookup'));

    loadPageOnce('dashboard'); // initial load

    if(!checkSettings(await SETTINGS.getSettings()).valid) {
        openSettings();
    }
});


// just settings stuff
const modal = document.getElementById('settings-modal');
const openSettingsBtn = document.getElementById('nav-settings');
const saveSettingsBtn = document.getElementById('close-settings');

// settings options
const TBAKEY = document.getElementById("tba-key");
const seasonEl = document.getElementById("season");

openSettingsBtn.addEventListener('click', async () => {
    openSettings();
});

async function openSettings() {
    const settings = await SETTINGS.getSettings();
    TBAKEY.value = settings.TBAKey;
    seasonEl.value = settings.season;

    modal.classList.remove('hidden');
}

saveSettingsBtn.addEventListener('click', () => {    
    let settings = getSettingsFromClient();

    if(checkSettings(settings).valid) {
        if(settings.season < 2022) {
            showNotification({ title: "Failed", message: "Season need to be at least 2022", color: "#eb4034" });
        } else if(settings.season > today.getFullYear()) {
            showNotification({ title: "Failed", message: "CompuStat cannot predict the future yet", color: "#eb4034" });
        } else {
            SETTINGS.saveSettings(settings);
            modal.classList.add('hidden');
            window.location.reload();
        }
    }
});

// click outside to close
modal.addEventListener('click', async (e) => {
    if (e.target === modal && checkSettings(await SETTINGS.getSettings()).valid) {
        modal.classList.add('hidden');
    }
});

function checkSettings(settings) {
    const requiredKeys = ["TBAKey", "season"]
    const missing = [];

    for (const key of requiredKeys) {
        const value = settings[key];
        if (!value || value.toString().trim() === "") {
            missing.push(key);
        }
    }

    return {
        valid: missing.length === 0,
        missing // array of missing keys
    };
}

function getSettingsFromClient() {
    return {
        TBAKey: TBAKEY.value.trim(),
        season: seasonEl.value.trim()
    }
}

function showNotification({ title, message, color = '#eb4034' }) {
    const container = document.getElementById("notificationContainer");
    const notif = document.createElement("div");
    notif.className = "notification";
    notif.style.backgroundColor = color;
    notif.innerHTML = `<strong>${title}</strong><br>${message}`;

    container.appendChild(notif);

    setTimeout(() => {
    notif.remove();
    }, 4000);
}

window.addEventListener("notify", (e) => {
    showNotification(e.detail);
});