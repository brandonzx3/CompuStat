export function init() {

    let currentPicklist = null;

    const modal = document.getElementById("newPicklistModal");
    const modalName = document.getElementById("modalPicklistName");
    const modalEvent = document.getElementById("modalEventCode");
    const modalCreate = document.getElementById("modalCreateBtn");
    const modalCancel = document.getElementById("modalCancelBtn");

    function showListView() {
        document.getElementById("picklistListView").style.display = "block";
        document.getElementById("picklistEditorView").style.display = "none";

        document.getElementById("returnToListBtn").style.display = "none";
        document.getElementById("sortByWeightsBtn").style.display = "none";
        document.getElementById("savePicklistBtn").style.display = "none";
    }

    showListView();

    function showEditorView() {
        document.getElementById("picklistListView").style.display = "none";
        document.getElementById("picklistEditorView").style.display = "block";

        document.getElementById("returnToListBtn").style.display = "inline-block";
        document.getElementById("sortByWeightsBtn").style.display = "inline-block";
        document.getElementById("savePicklistBtn").style.display = "inline-block";
    }

    
    document.getElementById("returnToListBtn").addEventListener("click", () => {
    currentPicklist = null;
        showListView();
    });


    async function loadPicklists() {
        const picklists = await PicklistAPI.loadAll();
        console.log("Loaded:", picklists);
        const grid = document.getElementById("picklistGrid");
        grid.innerHTML = "";

        picklists.forEach(p => {
            const div = document.createElement("div");
            div.className = "grid-item";
            div.innerHTML = `
                <h3 class="picklist-title">${p.name}</h3>
                <p class="picklist-code">${p.eventCode.toUpperCase()}</p>
                `;
            div.addEventListener("click", () => openPicklist(p));
            grid.appendChild(div);
        });
    }

    loadPicklists();

    document.getElementById("newPicklistBtn").addEventListener("click", async () => {
        modalName.value = "";
        modalEvent.value = "";
        modal.style.display = "flex";
    });

    modalCreate.addEventListener("click", async () => {
        const name = modalName.value.trim();
        const eventCode = modalEvent.value.trim();
        if (!name || !eventCode) return alert("Both fields required.");

        modal.style.display = "none";

        const teams = await PicklistAPI.getTeamData(eventCode);
        const picklist = {
            name,
            eventCode,
            weights: { opr: 1 },
            customFields: [],
            teams: {},
            picklistOrder: []
        };

        teams.forEach(team => {
            picklist.teams[team.teamNumber] = {
            nickname: team.nickname,
            opr: team.opr,
            dpr: team.dpr,
            ccwm: team.ccwm,
            ...team.epaBreakdown
            };
            picklist.picklistOrder.push(team.teamNumber.toString());
        });

        await PicklistAPI.save(picklist);
        loadPicklists();
    });

    modalCancel.addEventListener("click", () => {
        modal.style.display = "none";
    });

    function openPicklist(picklist) {
        currentPicklist = picklist;
        document.getElementById("editorTitle").innerText = `${picklist.name} (${picklist.eventCode})`;
        renderWeightsEditor(picklist);
        renderTeamTable(picklist);
        showEditorView();
    }

    function renderWeightsEditor(picklist) {
        const container = document.getElementById("weightsEditor");
        container.innerHTML = "";

        const allFields = new Set();
        Object.values(picklist.teams).forEach(team =>
            Object.keys(team).forEach(key => allFields.add(key))
        );

        allFields.forEach(field => {
            if (field === "nickname") return;
            const label = document.createElement("label");
            label.innerText = `${field}: `;
            const input = document.createElement("input");
            input.type = "number";
            input.value = picklist.weights[field] ?? 0;
            input.addEventListener("change", () => {
            picklist.weights[field] = parseFloat(input.value);
            });

            container.appendChild(label);
            container.appendChild(input);
            container.appendChild(document.createElement("br"));
        });
    }

    function renderTeamTable(picklist) {
        const table = document.getElementById("teamTable");
        table.innerHTML = "";

        // Collect all unique fields
        const allFields = new Set();
        Object.values(picklist.teams).forEach(team =>
            Object.keys(team).forEach(key => allFields.add(key))
        );

        const fields = ["teamNumber", "nickname", ...Array.from(allFields).filter(f => f !== "nickname")];

        // Create header
        const header = document.createElement("tr");
        fields.forEach(field => {
            const th = document.createElement("th");
            th.innerText = field;
            header.appendChild(th);
        });
        header.appendChild(document.createElement("th")).innerText = "Score";
        table.appendChild(header);

        // Rows
        picklist.picklistOrder.forEach(teamNum => {
            const team = picklist.teams[teamNum];
            const row = document.createElement("tr");

            fields.forEach(field => {
                const td = document.createElement("td");
                if (field === "teamNumber") {
                    td.innerText = teamNum;
                } else {
                    td.innerText = team[field] ?? "";
                }
                row.appendChild(td);
            });

            const score = calculateScore(team, picklist.weights);
            const scoreCell = document.createElement("td");
            scoreCell.innerText = score.toFixed(2);
            row.appendChild(scoreCell);

            table.appendChild(row);
        });
    }

    function calculateScore(teamData, weights) {
        let score = 0;
        for (const key in weights) {
            if (weights[key] && teamData[key] !== undefined) {
            score += weights[key] * teamData[key];
            }
        }
        return score;
    }

    document.getElementById("sortByWeightsBtn").addEventListener("click", () => {
        currentPicklist.picklistOrder.sort((a, b) => {
            const teamA = currentPicklist.teams[a];
            const teamB = currentPicklist.teams[b];
            return calculateScore(teamB, currentPicklist.weights) - calculateScore(teamA, currentPicklist.weights);
        });
        renderTeamTable(currentPicklist);
    });

    document.getElementById("savePicklistBtn").addEventListener("click", async () => {
        await PicklistAPI.save(currentPicklist);
        alert("Picklist saved.");
    });
}
