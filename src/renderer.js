const pageIds = ['dashboard', 'matchAnalysis', 'picklist'];

function showPage(pageId) {
    pageIds.forEach(id => {
        const section = document.getElementById(id);
        section.classList.add('hidden');
    });
    document.getElementById(pageId).classList.remove('hidden');
}

function loadPageOnce(pageId) {
    const section = document.getElementById(pageId);
    if (!section.dataset.loaded) {
        fetch(`pages/${pageId}.html`)
            .then(res => res.text())
            .then(html => {
                section.innerHTML = html;
                section.dataset.loaded = "true";
                showPage(pageId);
            })
            .catch(err => {
                section.innerHTML = `<p>Error loading page: ${err.message}</p>`;
                section.dataset.loaded = "true";
                showPage(pageId);
            });
    } else {
        showPage(pageId);
    }
}

window.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('nav-dashboard').addEventListener('click', () => loadPageOnce('dashboard'));
    document.getElementById('nav-match').addEventListener('click', () => loadPageOnce('matchAnalysis'));
    document.getElementById('nav-picklist').addEventListener('click', () => loadPageOnce('picklist'));

    loadPageOnce('dashboard'); // initial load

    let validSettings = await checkSettings();
    if(!validSettings.valid) {
        modal.classList.remove('hidden');
    }
});


//just settings stuff
const modal = document.getElementById('settings-modal');
const openBtn = document.getElementById('nav-settings');
const closeBtn = document.getElementById('close-settings');

//settings options
const TBAKEY = document.getElementById("tba-key");

// Open modal
openBtn.addEventListener('click', async () => {
    const settings = await SETTINGS.getSettings();
    TBAKEY.value = settings.TBAKey;

    modal.classList.remove('hidden');
});

// Close modal
closeBtn.addEventListener('click', () => {
    console.log(TBAKEY.innerText)
    let settings = {
        TBAKey: TBAKEY.value.trim()
    }

    SETTINGS.saveSettings(settings);
    modal.classList.add('hidden');
});

// Optional: click outside to close
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.add('hidden');
    }
});

async function checkSettings() {
    const requiredKeys = ["TBAKey"]
    const settings = await SETTINGS.getSettings();
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