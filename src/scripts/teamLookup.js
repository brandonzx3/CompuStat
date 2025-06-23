export function init() {
    const searchBtn = document.getElementById("searchButton");
    searchBtn.addEventListener("click", lookupTeam);
}

async function lookupTeam() {
    const teamNumber = document.getElementById("teamInput").value;
    if (!teamNumber) return;

    const data = await TEAMDATA.getTeam(teamNumber);
    renderTeamInfo(data);
}

function renderTeamInfo(data) {
    const container = document.getElementById("teamInfo");
    if (!data) {
        container.innerHTML = `<p class="text-red-500">Team not found.</p>`;
        return;
    }

    container.innerHTML = `
  <div class="team-card">
    <div class="team-header">
      <h2>Team ${data.number} – ${data.name}</h2>
      <p class="full-name">${data.fullName}</p>
    </div>

    <div class="team-info">
      <div>
        <p><strong>Location:</strong> ${data.city}, ${data.state}, ${data.country}</p>
        <p><strong>Rookie Year:</strong> ${data.rookie_year}</p>
        <p><strong>School:</strong> ${data.school_name || "N/A"}</p>
        <p><strong>Website:</strong> ${data.website ? `<a href="${data.website}" target="_blank">${data.website}</a>` : "N/A"}</p>
      </div>
    </div>

    <div class="summary-sections">
      <div class="summary-card">
        <h3>EPA Overview</h3>
        <p><strong>Total:</strong> ${data.epa.total_points.mean.toFixed(2)} ± ${data.epa.total_points.sd.toFixed(2)}</p>
        <p><strong>Auto:</strong> ${data.epa.breakdown.auto_points.toFixed(2)}</p>
        <p><strong>Teleop:</strong> ${data.epa.breakdown.teleop_points.toFixed(2)}</p>
        <p><strong>Endgame:</strong> ${data.epa.breakdown.endgame_points.toFixed(2)}</p>
      </div>

      <div class="summary-card">
        <h3>Record</h3>
        <p><strong>Wins:</strong> ${data.record.wins}</p>
        <p><strong>Losses:</strong> ${data.record.losses}</p>
        <p><strong>Ties:</strong> ${data.record.ties}</p>
        <p><strong>Total Matches:</strong> ${data.record.count}</p>
        <p><strong>Winrate:</strong> ${(data.record.winrate * 100).toFixed(1)}%</p>
      </div>
    </div>
  </div>`;
}