window.addEventListener("load", function () {
    console.log('OAuth alive')
    var contacts = {}

    function cache() {
        chrome.storage.local.get(['stage'], function (result) {
            document.getElementById("message").style.display = 'block'
            document.getElementById("first").style.display = 'block'
            if(result.stage == 'begin') {
                document.getElementById("status").innerHTML = "Step 1 of 2: Getting Whatsapp Images"
                document.getElementById("updates").innerHTML = "Make yourself a cup of coffee and come back to see that it is still running. 😉"
                document.getElementById("first").style.display = 'none'
            }
            else if(result.stage == 'reset') {
                document.getElementById("message").style.display = 'none'
            }
        });
    }
    cache()

    chrome.identity.getAuthToken({
        interactive: true
    }, function (token) {
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
                console.log(contacts);
            }

            function request(data) {
                return new Promise((done) => {
                    if (data.nextPageToken) {
                        fetch('https://people.googleapis.com/v1/people/me/connections/?pageToken=' + data.nextPageToken + '&pageSize=1000&personFields=names,photos&key=AIzaSyBX-L2C9_IIRIJL3tPBli0dKfXAJTc4Lew', get)
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
                fetch('https://people.googleapis.com/v1/people/me/connections/?pageSize=1000&personFields=names,photos&key=AIzaSyBX-L2C9_IIRIJL3tPBli0dKfXAJTc4Lew', get)
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
                img.crossOrigin = 'Anonymous';
                img.onload = function () {
                    getBase64Image(this).then(data => {
                        if (pick !== undefined) {
                            console.log(data)
                            pick[1].push(data)
                            var ori = new Image();
                            ori.src = pick[1][1]
                            ori.crossOrigin = "anonymous"
                            ori.onload = function (value) {
                                // getBase64Image(value.target).then(data2 => {
                                //     if(data2 != data) {
                                //         chrome.runtime.sendMessage({
                                //             urlbase: 'https://people.googleapis.com/v1/' + pick[0] + ':updateContactPhoto/',
                                //             image: {
                                //                 "photoBytes": pick[1][2]
                                //             },
                                //             toke: token
                                //         }, 
                                //         (response) => {

                                //         })
                                //     }
                                // })
                            }
                        }
                    })
                }
                img.src = wha[1][0]
            }
        }

        chrome.runtime.onConnect.addListener(function (port) {
            console.assert(port.name == "final");
            port.onMessage.addListener(async function (msg) {
                if (msg.cmd == "Contact") {
                    getOAuth().then(function () {
                        whatsapp = msg.contacts
                        console.log(whatsapp)
                        pushOAuth(whatsapp)
                    })
                }
                if (msg.cmd == "Update") {
                    cache()
                }
            });
        });
    });
});

// fetch('https://people.googleapis.com/v1/contactGroups/all?maxMembers=100&key=AIzaSyBX-L2C9_IIRIJL3tPBli0dKfXAJTc4Lew',
//         get)
//     .then((response) => response.json())
//     .then(function (data) {
//         let photoDiv = document.querySelector('#friendDiv');
//         let returnedContacts = data.memberResourceNames;
//         for (let i = 0; i < returnedContacts.length; i++) {
//             fetch('https://people.googleapis.com/v1/' + returnedContacts[i] +
//                     '?personFields=photos&key=AIzaSyBX-L2C9_IIRIJL3tPBli0dKfXAJTc4Lew',
//                     get)
//                 .then((response) => response.json())
//                 .then(function (data) {
//                     let profileImg = document.createElement('img');
//                     profileImg.src = data.photos[0].url;
//                     photoDiv.appendChild(profileImg);
//                 });
//         };
//     });