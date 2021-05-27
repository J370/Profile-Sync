window.addEventListener("load", function () {
    console.log('OAuth alive')

    function cache() {
        chrome.storage.local.get(['stage'], function (result) {
            document.getElementById("message").style.display = 'block'
            document.getElementById("first").style.display = 'none'
            if (result.stage == 'begin') {
                document.getElementById("status").innerHTML = "Step 1 of 2: Getting Whatsapp Images"
                document.getElementById("updates").innerHTML = "Make yourself a cup of coffee and come back to see that it is still running. 😉"
            }
            else if (result.stage == 'duplicates') {
                document.getElementById("status").innerHTML = "Step 1 of 2: Updating Duplicate Contacts"
                document.getElementById("updates").innerHTML = "This process shouldn't take long... Hopefully."
            }
            else if (result.stage == 'done') {
                document.getElementById("status").innerHTML = "Contact Images Are Successfully Sync"
                document.getElementById("updates").innerHTML = "Thanks for your patience."
            }
            if (result.stage == 'reset') {
                document.getElementById("message").style.display = 'none'
                document.getElementById("first").style.display = 'block'
            }
        });
    }

    chrome.storage.local.get(['key'], function (result) {
        if (result.key == "undefined") {
            document.getElementById("message").style.display = 'none'
            document.getElementById("first").style.display = 'none'
        } else {
            document.getElementById("authenticate").style.display = 'none'
            document.getElementById("inLoad").style.display = 'none'
            cache()
        }
    })

    chrome.identity.getAuthToken({
        interactive: true
    }, function (token) {
        if (token === undefined) {
            chrome.storage.local.set({
                "key": "undefined"
            })
        } else {
            chrome.storage.local.set({
                "key": token
            })
        }
        cache()
    });

    chrome.runtime.onConnect.addListener(function (port) {
        console.assert(port.name == "final");

        port.onMessage.addListener(async function (msg) {
            if (msg.cmd == "Update") {
                cache()
            }
        });
    })
});