chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.create({
        url: 'newcomer.html'
    });
    chrome.storage.local.set({
        "stage": "reset"
    })
});

chrome.runtime.onMessage.addListener(function update(message) {
    fetch(message.urlbase, {
            method: 'PATCH',
            async: true,
            body: JSON.stringify(message.image),
            headers: {
                'X-API-KEY': "AIzaSyBX-L2C9_IIRIJL3tPBli0dKfXAJTc4Lew",
                Authorization: 'Bearer ' + message.toke,
                'Content-Type': 'application/json'
            },
            'contentType': 'json'
        })
        .then((response) => {
            if (response.status !== 200) {
                setTimeout(function () {
                    console.log(response.url)
                    update(message)
                }, 60000)
            }
        })
})

chrome.tabs.onRemoved.addListener(function (tabid, removed) {
    chrome.storage.local.get(['tab'], function (result) {
        if(result.tab == tabid) {
            chrome.storage.local.set({
                "stage": "reset"
            })
        }
    })
})