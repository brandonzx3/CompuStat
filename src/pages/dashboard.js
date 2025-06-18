export async function init() {
  const stats = await COMPUSTAT.getSeasonStats();

  console.log("Season Stats:", stats);

  document.getElementById('qs-total-teams').textContent = stats.totalTeams ?? "N/A";
  document.getElementById('qs-total-events').textContent = stats.totalEvents ?? "N/A";
  document.getElementById('qs-avg-epa').textContent = stats.avgEPA ?? "N/A";

  if (stats.topTeam && typeof stats.topTeam === "object") {
    document.getElementById('qs-top-team').textContent = `${stats.topTeam.number} (${stats.topTeam.epa?.toFixed(1) ?? "?"})`;
  } else {
    document.getElementById('qs-top-team').textContent = "Unavailable";
  }
}