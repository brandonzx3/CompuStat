export async function getTeamEPA(teamNumber, teamYear) {
    const res = await fetch(`https://api.statbotics.io/v3/team_year/${teamNumber}/${teamYear}`);
    const json = await res.json();
    return {
        team: teamNumber,
        epa: json.epa.total_points.mean
    };
}

export async function getTeams(year) {
    const allTeams = [];
    const limit = 1000;
    let offset = 0;
    let hasMore = true;

    try {
        while (hasMore) {
            const res = await fetch(`https://api.statbotics.io/v3/team_years?year=${year}&limit=${limit}&offset=${offset}`);
            if (!res.ok) throw new Error(`Failed to fetch teams: ${res.status}`);
            const data = await res.json();

            if (!Array.isArray(data)) {
                console.error("getTeams() did not return an array:", data);
                return allTeams;
            }

            allTeams.push(...data);
            offset += limit;
            hasMore = data.length === limit; // If less than limit returned, no more pages
        }

        return allTeams;
    } catch (err) {
        console.error("Error fetching teams:", err);
        return allTeams;
    }
}

export async function getEvents(year) {
    try {
        const res = await fetch(`https://api.statbotics.io/v3/events?year=${year}`);
        if (!res.ok) throw new Error(`Failed to fetch events: ${res.status}`);
        return await res.json(); // Array of events
    } catch (error) {
        console.error("Error fetching events:", error);
        return [];
    }
}

export async function getTopTeam(year) {
    try {
        const url = `https://api.statbotics.io/v3/team_years?year=${year}&limit=1000`;
        const res = await fetch(url);

        if (!res.ok) {
            throw new Error(`Failed to fetch team_years: ${res.status}`);
        }

        const data = await res.json();

        if (!Array.isArray(data)) {
            console.error("getTopTeam() expected an array but got:", data);
            return null;
        }

        // Sort by EPA descending
        const sorted = data.sort((a, b) =>
            (b.epa?.total_points?.mean || 0) - (a.epa?.total_points?.mean || 0)
        );

        return sorted[0] || null;
    } catch (error) {
        console.error("Error fetching top team:", error);
        return null;
    }
}

export async function getTeam(teamNumber, year) {
    const res = await fetch(`https://api.statbotics.io/v3/team_year/${teamNumber}/${year}`)

    if (!res.ok) {
        throw new Error(`Failed to fetch team_years: ${res.status}`);
    }

    return await res.json();
}

export async function getTeamEvent(teamNumber, eventCode) {
    const res = await fetch(`https://api.statbotics.io/v3/team_event/${teamNumber}/${eventCode}`);
    if (!res.ok) return {};
    const json = await res.json();
    return json;
}

export async function getEPABreakdown(teamNumber, eventCode) {
    const res = await fetch(`https://api.statbotics.io/v3/team_event/${teamNumber}/${eventCode}`);
    if (!res.ok) return {};
    const json = await res.json();
    return json.epa?.breakdown || {};
}