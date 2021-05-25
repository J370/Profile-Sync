window.onload = function () {
    document.getElementById("begin").addEventListener('click', async () => {
        let [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

        function execute(tab) {
            chrome.scripting.executeScript({
                target: {
                    tabId: tab.id
                },
                files: ["js/index.js"]
            })
            chrome.storage.local.set({
                "tab": tab.id
            })
        }

        if (tab.url.includes("web.whatsapp.com")) {
            execute(tab)
        } else {
            chrome.tabs.create({
                url: 'https://web.whatsapp.com'
            });

            function myListener(tabId, changeInfo, tab) {
                if (tab.url.indexOf('https://web.whatsapp.com') != -1 && changeInfo.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(myListener);
                    execute(tab)
                }
            }

            chrome.tabs.onUpdated.addListener(myListener)
        }
    });
}