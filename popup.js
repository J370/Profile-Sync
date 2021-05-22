window.onload = function () {
    document.getElementById("test").addEventListener('click', async () => {
        let [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });
        chrome.scripting.executeScript({
            target: {
                tabId: tab.id
            },
            files: ["index.js"]
        });
    });
}