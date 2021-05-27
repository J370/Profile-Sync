//If you are seeing this, wish you luck to your eyes.

var background = 0;
var index = 0;

var token;
var parallel = 3;
var nucBtn = false;
chrome.storage.local.get(['key'], function (result) {
    token = result.key
})
chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.create({
        url: 'newcomer.html'
    });
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
    var duplicates = {}

    function storage(value, msg) {
        chrome.storage.local.set({
            [value]: msg
        })
    }
    storage("up", ["0 out of 0 ..."])

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
                    setTimeout(()=>{
                        patch(url, img).then(()=>{
                            resolve()
                        })
                    },5000)
                }
                else {
                    resolve()
                }
            })
            .catch(()=>{
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
        'contentType': 'json'
    };

    function getOAuth() {
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

    function pushOAuth(i) {
        function run() {
            if(!nucBtn) {
                background++
                storage("up", [background + " out of " + index + " ..."])
                pushOAuth(0)
            }
        }
        var key = Object.keys(whatsapp)[0+i]
        var value = whatsapp[key]
        console.log(key)
        delete whatsapp[key]
        if(value != undefined) {
            if(value[0] !== null) {
                var count = 0
                var person = []
                for(var contact in contacts) {
                    if(parallel > 0) {
                        if(contacts[contact][0] == key)
                        {
                            count += 1
                            person.push(contact)
                        }
                    }
                    else {
                        count = 1
                        for (i in contacts[contact][1]){
                            if(contacts[contact][1][i].canonicalForm == key.replace(/\s/g, ""))
                            {
                                person.push(contact)
                            }
                        }
                    }
                }
                if (count == 1) {
                    console.log("Updated")
                    patch('https://people.googleapis.com/v1/' + person[0] + ':updateContactPhoto/', value[0][0]).then(() => {
                        run()
                    })
                }
                else {
                    for(var i in person) {
                        if(duplicates[key]) {
                            duplicates[key].push(contacts[[person[i]]][1][0])
                        }
                        else {
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
        }
        else {
            duplicate()
        }
    }

    function duplicate() {
        --parallel
        if(parallel <= 0) {
            if (Object.keys(duplicates).length > 0) {
                port.postMessage({
                    cmd: "duplicate",
                    list: duplicates
                })
                storage("stage", "duplicates")
            }
            else {
                storage("stage", "done")
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
            index ++
        }
        else if (msg.cmd == "Flow") {
            nucBtn = false
            if(parallel > 0) {
                getOAuth().then(()=>{
                    for(var i = 0; i < parallel; i++) {
                        setTimeout((count)=>{
                            pushOAuth(count)
                        }, 2000 * (i + 1), i)
                    }
                })
            }
            else {
                duplicates = {}
                for(var i = 0; i < 3; i++) {
                    setTimeout((count)=>{
                        pushOAuth(count)
                    }, 2000 * (i + 1), i)
                }
            }
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
        }else if (msg.cmd == "Stop") {
            nucBtn = true
        }
    })
})

chrome.tabs.onRemoved.addListener(function (tabid, removed) {
    chrome.storage.local.get(['tab'], function (result) {
        if (result.tab == tabid) {
            storage("stage", "reset")
        }
    })
})