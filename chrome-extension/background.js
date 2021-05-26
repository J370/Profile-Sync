var token;
chrome.storage.local.get(['key'], function (result) {
    token = result.key
})
chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.create({
        url: 'newcomer.html'
    });
    chrome.identity.getAuthToken({}, function (result) {
        if (result === undefined) {
            chrome.storage.local.set({
                "key": "undefined"
            })
        } else {
            chrome.storage.local.set({
                "key": result
            })
        }
    })
});

chrome.runtime.onConnect.addListener(function (port) {
    console.assert(port.name == "final");
    var contacts = {}

    var apiKey
    fetch('config.json')
        .then((response) => response.json())
        .then((data) => apiKey = data.key)

    function patch(url, img) {
        fetch(url, {
            method: 'PATCH',
            async: true,
            body: JSON.stringify({
                "photoBytes": img
            }),
            headers: {
                'X-API-KEY': apiKey,
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            'contentType': 'json'
        })
        .then((response) => {
            if (response.status !== 200) {
                setTimeout(function () {
                    console.log(response.url)
                    patch(url, img)
                }, 60000)
            }
        })
    }

    let get = {
        method: 'GET',
        async: true,
        headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        'contentType': 'json'
    };

    function getOAuth() {
        console.log('OAuth running');

        function appendContact(data) {
            for (var i = 0; i < Math.ceil(data.connections.length); i++) {
                contacts[data.connections[i].resourceName] = [data.connections[i].names[0].displayName, data.connections[i].photos[0].url];
            }
        }

        function request(data) {
            return new Promise((done) => {
                if (data.nextPageToken) {
                    fetch('https://people.googleapis.com/v1/people/me/connections/?pageToken=' + data.nextPageToken + '&pageSize=1000&personFields=names,photos&key=' + apiKey, get)
                        .then((response) => response.json())
                        .then(function (data) {
                            appendContact(data);
                            request(data).then(function () {
                                done()
                            })
                        });
                } else {
                    done()
                }
            })
        }

        return new Promise((resolve) => {
            fetch('https://people.googleapis.com/v1/people/me/connections/?pageSize=1000&personFields=names,photos&key=' + apiKey, get)
                .then((response) => response.json())
                .then(function (data) {
                    appendContact(data);
                    request(data).then(function () {
                        resolve()
                    })
                });
        })
    };
    const toDataURL = url => fetch(url)
        .then(response => response.blob())
        .then(blob => new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""))
            reader.onerror = reject
            reader.readAsDataURL(blob)
        }))

    function pushOAuth(whatsapp) {
        for (wha of Object.entries(whatsapp)) {
            const pick = Object.entries(contacts).find(([key, value]) => value[0] === wha[0])
            if (pick !== undefined) {
                toDataURL(pick[1][1]).then(ori => {
                    if (ori != wha[1][0]) {
                        patch('https://people.googleapis.com/v1/' + pick[0] + ':updateContactPhoto/', wha[1][0])
                    }
                })
            }
        }
    }
    
    port.onMessage.addListener(async function (msg) {
        console.log(msg)
        if (msg.cmd == "Contact") {
            getOAuth().then(function () {
                whatsapp = msg.contacts
                console.log(whatsapp)
                pushOAuth(whatsapp)
            })
        }
        else if (msg.cmd == "Open") {
            function myListener(tabId, changeInfo, tab) {
                if (tab.url.indexOf('https://web.whatsapp.com') != -1 && changeInfo.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(myListener);
                    chrome.tabs.executeScript(tabId, {
                        file: "js/index.js"
                    })
                    chrome.storage.local.set({
                        "tab": tabId
                    })
                }
            }

            chrome.tabs.onUpdated.addListener(myListener)
        }
    })
})

chrome.tabs.onRemoved.addListener(function (tabid, removed) {
    chrome.storage.local.get(['tab'], function (result) {
        if (result.tab == tabid) {
            chrome.storage.local.set({
                "stage": "reset"
            })
        }
    })
})