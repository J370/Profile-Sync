//If you are seeing this, wish you luck to your eyes.

chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.create({
        url: 'newcomer.html'
    });
    chrome.identity.clearAllCachedAuthTokens(() => {})
    chrome.storage.local.set({
        "stage": "reset"
    })
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

var token;
chrome.storage.local.get(['key'], function (result) {
    token = result.key
})

chrome.runtime.onConnect.addListener(function begin(port) {
    console.assert(port.name == "pis");
    var apiKey
    var contacts = {}
    var whatsapp = {}
    var duplicates = {}
    var background = 0;
    var index = 0;
    var parallel = 3;
    var dup = 0;
    const controller = new AbortController();
    const signal = controller.signal;

    function storage(value, msg) {
        chrome.storage.local.set({
            [value]: msg
        })
    }

    chrome.storage.local.get(['key'], function (result) {
        token = result.key
    })

    fetch('config.json')
        .then((response) => response.json())
        .then((data) => {
            apiKey = data.key
        })

    function patch(url, img) {
        return new Promise((resolve) => {
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
                    'contentType': 'json',
                    signal: signal,
                })
                .then((response) => {
                    switch (response.status) {
                        case 200:
                            resolve()
                            break;
                        case 400:
                            resolve()
                            break;
                        default:
                            setTimeout(() => {
                                patch(url, img).then(() => {
                                    resolve()
                                })
                            }, 5000)
                    }
                })
                .catch(() => {
                    resolve()
                })
        })
    }

    let get = {
        method: 'GET',
        async: true,
        headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        'contentType': 'json',
        signal: signal
    };

    function getOAuth() {
        storage("up", [undefined])
        console.log('Getting Contacts');

        function appendContact(data) {
            for (var i = 0; i < Math.ceil(data.connections.length); i++) {
                contacts[data.connections[i].resourceName] = [data.connections[i].names[0].displayName, data.connections[i].phoneNumbers];
            }
        }

        function request(data) {
            return new Promise((done) => {
                if (data.nextPageToken) {
                    fetch('https://people.googleapis.com/v1/people/me/connections/?pageToken=' + data.nextPageToken + '&pageSize=1000&personFields=names,phoneNumbers&key=' + apiKey, get)
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
            fetch('https://people.googleapis.com/v1/people/me/connections/?pageSize=1000&personFields=names,phoneNumbers&key=' + apiKey, get)
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

    function pushOAuth(i) {
        var key = Object.keys(whatsapp)[0 + i]
        var value = whatsapp[key]
        if (background < index && value != undefined) {
            background++
            storage("up", [background + " out of " + index + " ..."])

            function run() {
                chrome.storage.local.get(['stage'], function (result) {
                    if(result.stage == "reset") {
                        controller.abort()
                    }
                    else {
                        pushOAuth(0)
                    }
                })
            }
            console.log(key)
            delete whatsapp[key]
            if (value[0] !== null && value[0][0] != "data:,") {
                var count = 0
                var person = []
                for (var contact in contacts) {
                    if (parallel > 0) {
                        if (contacts[contact][0] == key) {
                            count += 1
                            person.push(contact)
                        }
                    } else {
                        count = 1
                        for (i in contacts[contact][1]) {
                            if (contacts[contact][1][i].canonicalForm == key.replace(/\s/g, "")) {
                                person.push(contact)
                            }
                        }
                    }
                }
                if (count == 1) {
                    console.log("Updated")
                    toDataURL(value[0][1]).then((base64) => {
                        patch('https://people.googleapis.com/v1/' + person[0] + ':updateContactPhoto/', base64).then(() => {
                            run()
                        })
                    })
                } else {
                    for (var i in person) {
                        if (duplicates[key]) {
                            duplicates[key].push(contacts[[person[i]]][1][0])
                        } else {
                            duplicates[key] = [contacts[[person[i]]][1][0]]
                        }
                    }
                    console.log("Duplicate")
                    run()
                }
            } else {
                console.log("No image")
                run()
            }
        } else {
            var cantcatchme = index
            setTimeout(() => {
                if (cantcatchme == index) {
                    parallel--
                    if (parallel <= 0) {
                        if(dup == 1) {
                            pushOAuth(0)
                        }
                        else {
                            duplicate()
                        }
                    }
                } else {
                    pushOAuth(0)
                }
            }, 2000)
        }
    }

    function duplicate() {
        if (Object.keys(duplicates).length > 0) {
            port.postMessage({
                cmd: "duplicate",
                list: duplicates
            })
            storage("stage", "duplicates")
            duplicates = {}
        } else {
            storage("stage", "done")
        }
    }

    function addWhatsapp(data) {
        key = data[0]
        value = data[1]
        if (key in whatsapp) {
            for (i in whatsapp[key]) {
                if (whatsapp[key][i] == null) {
                    whatsapp[key][i] = value
                } else {
                    whatsapp[key].push(value)
                    index++
                }
            }
        } else {
            whatsapp[key] = [value]
            index++
        }
    }

    port.onMessage.addListener(async function (msg) {
        if (msg.cmd == "Contact") {
            addWhatsapp(msg.contacts)
        } else if (msg.cmd == "Flow") {
            if (parallel > 0) {
                getOAuth().then(() => {
                    for (var i = 0; i < parallel; i++) {
                        setTimeout((count) => {
                            pushOAuth(count)
                        }, 3000 * (i + 1), i)
                    }
                })
            } else {
                dup = 1
                setTimeout((count) => {
                    pushOAuth(count)
                }, 5000, 0)
            }
        } else if (msg.cmd == "Open") {
            contacts = {}
            whatsapp = {}
            duplicates = {}
            parallel = 3;
            dup = 0;
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
        } else if (msg.cmd == "Dup") {
            dup = 2
        }
    })

    chrome.storage.local.onChanged.addListener(()=>{
        chrome.storage.local.get(['stage'], function (result) {
            if(result.stage == "reset") {
                controller.abort()
            }
        })
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