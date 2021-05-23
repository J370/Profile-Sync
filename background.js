chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.create({
        url: 'index.html'
    });
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
            if(response.status !== 200) {
                setTimeout(function() {
                    console.log(response.url)
                    update(message)
                }, 60000)
            }
        })
})