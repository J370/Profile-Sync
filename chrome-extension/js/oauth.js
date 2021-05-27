window.addEventListener("load", function () {
    console.log('OAuth alive')
    var status

    function cache() {
        chrome.storage.local.get(['key'], function (result) {
            if (result.key == "undefined") {
                document.getElementById("message").style.display = 'none'
                document.getElementById("first").style.display = 'none'
            } else {
                document.getElementById("authenticate").style.display = 'none'
                document.getElementById("inLoad").style.display = 'none'
                chrome.storage.local.get(['stage'], function (result) {
                    document.getElementById("message").style.display = 'block'
                    document.getElementById("first").style.display = 'none'
                    document.getElementById("button").classList.add('red')
                    if(status != undefined) {
                        document.getElementById("progress").innerHTML = status
                    }
                    document.getElementById("button").innerHTML = '<i class="material-icons left">warning</i>Cancel'
                    if (result.stage == 'begin') {
                        document.getElementById("status").innerHTML = "Step 1 of 2: Getting Whatsapp Images"
                        document.getElementById("updates").innerHTML = "Make yourself a cup of coffee and come back to see that it is still running. 😉"
                    }
                    else if (result.stage == 'duplicates') {
                        document.getElementById("status").innerHTML = "Step 1 of 2: Updating Duplicate Contacts"
                        document.getElementById("updates").innerHTML = "This process shouldn't take long... Hopefully."
                    }
                    else if (result.stage == 'done') {
                        document.getElementById("button").classList.remove('red')
                        document.getElementById("button").innerHTML = "Ok"
                        document.getElementById("status").innerHTML = "Contact Images Are Successfully Sync"
                        document.getElementById("updates").innerHTML = "Thanks for your patience."
                    }
                    else if (result.stage == 'reset') {
                        document.getElementById("message").style.display = 'none'
                        document.getElementById("first").style.display = 'block'
                    }
                });
            }
        })
    }

    cache()

    chrome.storage.local.get(['up'], function (result) {
        status = result.up
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
            cache()
        }
    });

    chrome.storage.local.onChanged.addListener(()=>{
        cache()
        chrome.storage.local.get(['up'], function (result) {
            status = result.up
        })
    })
});