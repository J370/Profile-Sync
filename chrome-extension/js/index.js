var nucBtn = false

var port = chrome.runtime.connect({
    name: "final"
});

function storage(value, msg) {
    chrome.storage.local.set({
        [value]: msg
    })
    port.postMessage({cmd: "Update"});
}

port.onMessage.addListener(async function (msg) {
    if (msg.cmd == "duplicate") { 
        duplicate(msg.list)
    }else if (msg.cmd == "stop") {
        nucBtn = true
    }
});

function begin() {
    
    storage("stage", "begin")

    document.querySelectorAll('._1XaX-')[1].click();

    function scrollbegin() {
        var dict = {};
        height = []
        const config = {
            attributes: true,
            childList: true,
            subtree: true
        };

        function addValue(key, value) {
            port.postMessage({
                cmd: "Contact",
                contacts: [key, value]
            });
        }

        function toBase(image) {
            var canvas = document.createElement('CANVAS');
            var ctx = canvas.getContext('2d');
            canvas.height = image.naturalHeight;
            canvas.width = image.naturalWidth;
            ctx.drawImage(image, 0, 0);
            return canvas.toDataURL().replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
        }

        const callback = function (mutationsList, observer) {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    try {
                        if (mutation.addedNodes[0].nodeName == "IMG" && mutation.target.className === "-y4n1") {
                            pername = mutation.addedNodes[0].offsetParent.offsetParent.lastChild.firstChild.firstChild.firstChild.firstChild.title
                            dataURL = toBase(mutation.addedNodes[0])
                            if (dataURL == "data:,") {
                                addValue(pername, null)
                            }
                            else {
                                addValue(pername, [dataURL, mutation.addedNodes[0].src])
                            }
                        }
                    } catch {}
                } else if (mutation.type === 'attributes') {
                    if (mutation.attributeName == "title" && mutation.target.className === "_35k-1 _1adfa _3-8er") {
                        addValue(mutation.target.title, null)
                    }
                    // _1SjZ2 _2RfNG (Loading About...)
                }
            }
        };

        const observer = new MutationObserver(callback);

        setTimeout(function () {

            document.querySelector("._1C2Q3._36Jt6").scroll({
                top: 0,
                left: 0,
                behavior: 'smooth'
            });

            port.postMessage({
                cmd: "Flow",
            });

            var selection = document.querySelectorAll(".Akuo4 ._35k-1._1adfa._3-8er")
            for (var i = 0; i < selection.length; i++) {
                var image = document.querySelectorAll(".OMoBQ._3wXwX.copyable-area .-y4n1")[i].querySelector("img")
                if (image) {
                    dataURL = toBase(image)
                    addValue(selection[i].title, [dataURL, image.src]);
                } else {
                    addValue(selection[i].title, null);
                }
                observer.observe(document.querySelectorAll("._1Flk2._2DPZK ._2aBzC")[i], config);
            }
        }, 200);

        function scrolling() {
            if (Math.ceil(document.querySelector("._1C2Q3._36Jt6").scrollHeight - document.querySelector("._1C2Q3._36Jt6").scrollTop) > document.querySelector("._1C2Q3._36Jt6").clientHeight + document.querySelector("[data-list-scroll-offset]").clientHeight / 5) {
                setTimeout(function () {
                    try {
                        document.querySelector("._1C2Q3._36Jt6").scrollBy({
                            top: document.querySelector("._1C2Q3._36Jt6").clientHeight,
                            left: 0,
                            behavior: 'smooth'
                        });
                        if(nucBtn) {
                            observer.disconnect
                        }else {
                            scrolling();
                        }
                    } catch {
                        observer.disconnect
                    }
                }, 1500);
            } else {
                setTimeout(()=>{
                    observer.disconnect
                }, 2000)
            }
        }

        scrolling();
    }

    if (document.querySelectorAll("._1C2Q3._36Jt6").length == 0) {
        var frontscroll = new MutationObserver(function (mutations, me) {
            if (document.querySelectorAll("._1C2Q3._36Jt6").length == 1) {
                scrollbegin();
                me.disconnect();
                return;
            }
        });

        frontscroll.observe(document, {
            childList: true,
            subtree: true
        });
    } else {
        scrollbegin();
    }
}

click = phoneNum => new Promise((resolve)=>{
    var contact = document.createElement("a")
    contact.id = phoneNum
    contact.href = "https://web.whatsapp.com/send?phone=" + phoneNum
    document.body.appendChild(contact)
    document.getElementById(phoneNum).click()
    // Mutation Observer in progress
    setTimeout(()=> {
        if(document.querySelector("._1gmLA") == null) {
            document.querySelector("._1-qgF ._35k-1._1adfa._3-8er").click()
            if(document.querySelectorAll("._3ZEdX._3hiFt")[3].querySelectorAll("._2kOFZ ._1Kn3o._1AJnI._29Iga")[1]) {
                var phone = document.querySelectorAll("._3ZEdX._3hiFt")[3].querySelectorAll("._2kOFZ ._1Kn3o._1AJnI._29Iga")[1].getInnerHTML()
            }
            else {
                var phone = document.querySelectorAll("._3ZEdX._3hiFt")[5].querySelectorAll("._2kOFZ ._1Kn3o._1AJnI._29Iga")[1].getInnerHTML()
            }
            var image = document.querySelectorAll(".OMoBQ._3wXwX.copyable-area .-y4n1")[0].querySelector("img")
            if (image) {
                var canvas = document.createElement('CANVAS');
                var ctx = canvas.getContext('2d');
                canvas.height = image.naturalHeight;
                canvas.width = image.naturalWidth;
                ctx.drawImage(image, 0, 0);
                dataURL = canvas.toDataURL().replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
                port.postMessage({
                    cmd: "Contact",
                    contacts: [phone, [dataURL, image.src]]
                });
                port.postMessage({
                    cmd: "Flow"
                });
            }
        }
        setTimeout(()=> {
            resolve()
        }, 1000)
    }, 2000)
})

async function duplicate(contacts) {
    for(i in contacts) {
        for(person in contacts[i]) {
            var phoneNum = contacts[i][person].canonicalForm
            await click(phoneNum)
        }
    }
    storage("stage", "done")
}

if(document.querySelectorAll("._1XaX-").length !== 0) {
    document.querySelectorAll('._1XaX-')[1].click();
}

var loaded = true
var front = new MutationObserver(function (mutations, me) {
    if(document.querySelectorAll("._1XaX-").length !== 0) {
        if(loaded) {
            begin();
        }
        else {
            setTimeout(()=> {
                begin();
            },3000)
        }
        me.disconnect();
        return;
    }
    else {
        loaded = false
    }
});

front.observe(document, {
    childList: true,
    subtree: true
});