export async function sendRequest(endpoint, key) {
    try {
        return await (fetch("https://www.thebluealliance.com/api/v3/" + endpoint, {
            headers: new Headers({
                "X-TBA-Auth-Key": key
            })
        })).then(response => response.json());
    } catch(e) {
        console.error(e);
        return null;
    }
}