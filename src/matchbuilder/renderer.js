document.getElementById("ping").addEventListener("click", async () => {
    const data = await SETTINGS.getSettings();
    console.log(data);
})