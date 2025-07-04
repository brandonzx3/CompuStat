export function init() {

    let currentPicklist = null;

    const modal = document.getElementById("newPicklistModal");
    const modalName = document.getElementById("modalPicklistName");
    const modalEvent = document.getElementById("modalEventCode");
    const modalCreate = document.getElementById("modalCreateBtn");
    const modalCancel = document.getElementById("modalCancelBtn");

    const customizeBtn = document.getElementById("customizeFieldsBtn");
    const fieldModal = document.getElementById("fieldSelectorModal");
    const fieldCheckboxes = document.getElementById("fieldCheckboxes");
    const applyBtn = document.getElementById("applyFieldSelectionBtn");

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

    customizeBtn.addEventListener("click", () => {
        fieldModal.style.display = "flex";
        fieldCheckboxes.innerHTML = "";

        const allFields = new Set();
        Object.values(currentPicklist.teams).forEach(team => {
            Object.keys(team).forEach(key => allFields.add(key));
        });

        [...allFields].forEach(field => {
            if (field === "nickname") return; // nickname shouldn't be weighted
            const wrapper = document.createElement("div");
            wrapper.className = "field-option";
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.id = `field-${field}`;
            checkbox.value = field;
            checkbox.checked = currentPicklist.weights[field] !== undefined;

            const label = document.createElement("label");
            label.htmlFor = `field-${field}`;
            label.innerText = field;

            wrapper.appendChild(checkbox);
            wrapper.appendChild(label);
            fieldCheckboxes.appendChild(wrapper);
        });
    });

    applyBtn.addEventListener("click", () => {
        // Get selected checkboxes
        const selected = fieldCheckboxes.querySelectorAll("input:checked");

        // Save selected fields to the picklist
        const selectedFields = Array.from(selected).map(cb => cb.value);
        currentPicklist.selectedFields = selectedFields;

        // Rebuild weights object to only include selected fields
        const newWeights = {};
        selectedFields.forEach(field => {
            newWeights[field] = currentPicklist.weights[field] ?? 0;
        });
        currentPicklist.weights = newWeights;

        // Hide modal and re-render UI
        fieldModal.style.display = "none";
        renderWeightsEditor(currentPicklist);
        renderTeamTable(currentPicklist);
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
        if (!name || !eventCode) return showNotification({ title: "Failed", message: "Both fields required", color: "#eb4034" });

        modal.style.display = "none";

        showNotification({ title: "Creating Picklist", message: "This might take a while", color: "#eb4034" });
        const teams = await PicklistAPI.getTeamData(eventCode);
        const picklist = {
            name,
            eventCode,
            weights: { opr: 1 },
            selectedFields: ["opr"],
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
        currentPicklist._fieldStats = computeFieldStats(picklist.teams);

        if (!currentPicklist.selectedFields) {
            currentPicklist.selectedFields = Object.keys(currentPicklist.weights);
        }

        document.getElementById("editorTitle").innerText = `${picklist.name} (${picklist.eventCode})`;
        renderWeightsEditor(picklist);
        renderTeamTable(picklist);
        showEditorView();
    }

    function renderWeightsEditor(picklist) {
        const container = document.getElementById("weightsEditor");
        container.innerHTML = "";

        Object.keys(picklist.weights).forEach(field => {
            const label = document.createElement("label");
            label.innerText = `${field}: `;
            const input = document.createElement("input");
            input.type = "number";
            input.value = picklist.weights[field];
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

        const fields = ["teamNumber", "nickname", ...(picklist.selectedFields ?? Object.keys(picklist.weights))];

        const header = document.createElement("tr");
        fields.forEach(field => {
            const th = document.createElement("th");
            th.innerText = field;
            header.appendChild(th);
        });
        const scoreTh = document.createElement("th");
        scoreTh.innerText = "Score";
        header.appendChild(scoreTh);
        table.appendChild(header);

        let draggedTeamNum = null;

        picklist.picklistOrder.forEach(teamNum => {
            const team = picklist.teams[teamNum];
            const row = document.createElement("tr");
            row.setAttribute("draggable", true);
            row.dataset.teamNumber = teamNum;

            row.addEventListener("dragstart", () => {
                draggedTeamNum = teamNum;
                row.style.opacity = "0.5";
            });

            row.addEventListener("dragend", () => {
                row.style.opacity = "1";
            });

            row.addEventListener("dragover", (e) => e.preventDefault());

            row.addEventListener("drop", (e) => {
                e.preventDefault();
                const targetTeamNum = row.dataset.teamNumber;
                const fromIndex = picklist.picklistOrder.indexOf(draggedTeamNum);
                const toIndex = picklist.picklistOrder.indexOf(targetTeamNum);
                if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
                    const updated = [...picklist.picklistOrder];
                    const [moved] = updated.splice(fromIndex, 1);
                    updated.splice(toIndex, 0, moved);
                    picklist.picklistOrder = updated;
                    renderTeamTable(picklist);
                }
            });

            row.addEventListener("dragenter", () => row.classList.add("drag-over"));
            row.addEventListener("dragleave", () => row.classList.remove("drag-over"));

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

            row.addEventListener("dragenter", () => row.classList.add("drag-over"));
            row.addEventListener("dragleave", () => row.classList.remove("drag-over"));
            row.appendChild(scoreCell);

            table.appendChild(row);
        });
    }

    function computeFieldStats(teams) {
        const stats = {};
        Object.values(teams).forEach(team => {
            for (const key in team) {
                if (typeof team[key] === "number") {
                    if (!stats[key]) {
                        stats[key] = { min: team[key], max: team[key] };
                    } else {
                        stats[key].min = Math.min(stats[key].min, team[key]);
                        stats[key].max = Math.max(stats[key].max, team[key]);
                    }
                }
            }
        });
        return stats;
    }

    function calculateScore(teamData, weights) {
        let score = 0;
        for (const key in weights) {
            const weight = weights[key];
            const value = teamData[key];
            const stats = currentPicklist._fieldStats?.[key];

            if (
                weight &&
                typeof value === "number" &&
                stats &&
                stats.max !== stats.min
            ) {
                const normalized = (value - stats.min) / (stats.max - stats.min);
                score += weight * normalized;
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
    });
}
