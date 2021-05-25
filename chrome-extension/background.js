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

    // fetch(message.urlbase, {
    //         method: 'PATCH',
    //         async: true,
    //         body: JSON.stringify(message.image),
    //         headers: {
    //             'X-API-KEY': message.key,
    //             Authorization: 'Bearer ' + message.toke,
    //             'Content-Type': 'application/json'
    //         },
    //         'contentType': 'json'
    //     })
    //     .then((response) => {
    //         if (response.status !== 200) {
    //             setTimeout(function () {
    //                 console.log(response.url)
    //                 update(message)
    //             }, 60000)
    //         }
    //     })

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

    function getBase64Image(img) {
        return new Promise((data) => {
            var canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            data(canvas.toDataURL("image/png").replace(/^data:image\/(png|jpg|jpeg);base64,/, ""))
        })
    }

    function pushOAuth(whatsapp) {
        for (wha of Object.entries(whatsapp)) {
            const pick = Object.entries(contacts).find(([key, value]) => value[0] === wha[0])
            var img = new Image();
            console.log(img)
            img.crossOrigin = 'Anonymous';
            img.onload = function () {
                getBase64Image(this).then(data => {
                    if (pick !== undefined) {
                        pick[1].push(data)
                        var ori = new Image();
                        ori.src = pick[1][1]
                        ori.crossOrigin = "anonymous"
                        ori.onload = function (value) {
                            getBase64Image(value.target).then(data2 => {
                                if (data2 != data) {
                                    // chrome.runtime.sendMessage({
                                    //         urlbase: 'https://people.googleapis.com/v1/' + pick[0] + ':updateContactPhoto/',
                                    //         image: {
                                    //             "photoBytes": pick[1][2]
                                    //         },
                                    //         toke: token,
                                    //         key: apiKey
                                    //     },
                                    //     (response) => {

                                    //     })
                                }
                            })
                        }
                    }
                })
            }
            img.src = wha[1][0]
        }
    }
    
    port.onMessage.addListener(async function (msg) {
        if (msg.cmd == "Contact") {
            getOAuth().then(function () {
                whatsapp = msg.contacts
                pushOAuth(whatsapp)
            })
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