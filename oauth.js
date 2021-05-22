window.addEventListener("load", function () {
    console.log('OAuth alive')
    var contacts = {}
    chrome.identity.getAuthToken({
        interactive: true
    }, function (token) {
        let patch = {
            method: 'PATCH',
            async: true,
            headers: {
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            'contentType': 'json'
        };
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
                        // console.warn(data.results[0].person.resourceName)
                    });
            })
        };

        function toDataURL(src, callback, outputFormat) {
            var img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = function () {
                var canvas = document.createElement('CANVAS');
                var ctx = canvas.getContext('2d');
                var dataURL;
                canvas.height = this.naturalHeight;
                canvas.width = this.naturalWidth;
                ctx.drawImage(this, 0, 0);
                dataURL = canvas.toDataURL(outputFormat);
                callback(dataURL);
            };
            img.src = src;
            if (img.complete || img.complete === undefined) {
                img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
                img.src = src;
            }
        }

        function pushOAuth(whatsapp) {
            for(wha in whatsapp) {
                toDataURL(whatsapp[wha])
                console.log(a)
            }
        }

        chrome.runtime.onConnect.addListener(function (port) {
            console.assert(port.name == "final");
            port.onMessage.addListener(async function (msg) {
                if (msg.cmd == "Contact") {
                    getOAuth()
                        .then(() => {
                            console.log("completed")
                            whatsapp = msg.contacts
                            console.log(whatsapp)
                            pushOAuth(whatsapp)
                        })
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