var token;
var parallel = 3;
chrome.storage.local.get(['key'], function (result) {
    token = result.key
})
chrome.runtime.onInstalled.addListener(() => {
    // chrome.tabs.create({
    //     url: 'newcomer.html'
    // });
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

chrome.runtime.onConnect.addListener(function (port) {
    console.assert(port.name == "final");
    var contacts = {}
    var whatsapp = {}
    var dict = {}
    var duplicates = []

    var apiKey
    fetch('config.json')
        .then((response) => response.json())
        .then((data) => {
            apiKey = data.key
        })

    function patch(url, img) {
        return new Promise((resolve)=>{
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
                    console.log(response.url)
                    patch(url, img)
                }
                else {
                    resolve()
                }
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
        'contentType': 'json'
    };

    function getOAuth() {
        console.log('Getting Contacts');

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
            reader.onloadend = () => resolve([reader.result.replace(/^data:image\/(png|jpg|jpeg);base64,/, "")])
            reader.onerror = reject
            reader.readAsDataURL(blob)
        }))

    function pushOAuth(i) {
        function run() {
            delete whatsapp[key]
            pushOAuth(parallel - 1)
        }
        var key = Object.keys(whatsapp)[0+i]
        var value = whatsapp[key]
        console.log(key)
        if(value != undefined) {
            if(value[0] !== null) {
                var imageData = value[0][0]
                // var source = value[0][1]
                var count = 0
                var personId
                for(var contact in contacts) {
                    if(contacts[contact][0] == key)
                    {
                        count += 1
                        personId = contact
                    }
                }
                if (count == 1) {
                    toDataURL(contacts[personId][1]).then(ori => {
                        if (ori[0] != imageData) {
                            console.log("Updated")
                            patch('https://people.googleapis.com/v1/' + personId + ':updateContactPhoto/', imageData).then(() => {
                                run()
                            })
                        } else {
                            console.log("Kept")
                            run()
                        }
                    })
                }
                else {
                    console.log("Duplicated")
                    duplicates.push(key)
                    run()
                }
            } else {
                console.log("No image")
                run()
            }
        }
    }

    function addWhatsapp(data) {
        key = data[0]
        value = data[1]
        if (key in dict) {
            for (i in dict[key]) {
                if (dict[key][i] == null) {
                    dict[key][i] = value
                } else {
                    dict[key].push(value)
                }
            }
        } else {
            dict[key] = [value]
        }
        if (key in whatsapp) {
            for (i in whatsapp[key]) {
                if (whatsapp[key][i] == null) {
                    whatsapp[key][i] = value
                } else {
                    whatsapp[key].push(value)
                }
            }
        } else {
            whatsapp[key] = [value]
        }
    }
    
    port.onMessage.addListener(async function (msg) {
        if (msg.cmd == "Contact") { 
            addWhatsapp(msg.contacts)
        }
        else if (msg.cmd == "Flow") {
            getOAuth().then(()=>{
                for(var i = 0; i < parallel; i++) {
                    setTimeout((count)=>{
                        pushOAuth(count)
                    }, 2000 * (i + 1), i)
                }
            })
        }
        else if (msg.cmd == "Open") {
            function myListener(tabId, changeInfo, tab) {
                if (tab.url.indexOf('https://web.whatsapp.com') != -1 && changeInfo.status === 'complete') {
                    cconsthrome.tabs.onUpdated.removeListener(myListener);
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