window.onload = function () {
    var port = chrome.runtime.connect({
        name: "pis"
    });
    document.getElementById("begin").addEventListener('click', async () => {
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, (data)=>{
            tab = data[0]
    
            if (tab.url.includes("web.whatsapp.com")) {
                chrome.tabs.executeScript(tab.id, {
                    file: "js/index.js"
                })
                chrome.storage.local.set({
                    "tab": tab.id
                })
            } else {
                chrome.tabs.create({
                    url: 'https://web.whatsapp.com'
                });
    
                port.postMessage({
                    cmd: "Open",
                });
            }
        });
    });
    document.getElementById("button").addEventListener('click', async () => {
        chrome.storage.local.set({
            "stage": "reset"
        })
    })
}