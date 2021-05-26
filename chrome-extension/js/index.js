var port = chrome.runtime.connect({
    name: "final"
});

port.onMessage.addListener(function (msg) {});

function storage(msg) {
    chrome.storage.local.set({
        "stage": msg
    })
    port.postMessage({cmd: "Update"});
}

function begin() {
    
    storage("begin")

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
            if (key in dict) {
                for (i in dict[key]) {
                    if (dict[key][i] == null) {
                        dict[key][i] = value
                    } else {
                        dict[key].push(value)
                    }
                }
            } else
                dict[key] = [value]
        }

        const callback = function (mutationsList, observer) {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    try {
                        if (mutation.addedNodes[0].nodeName == "IMG" && mutation.target.className === "-y4n1") {
                            pername = mutation.addedNodes[0].offsetParent.offsetParent.lastChild.firstChild.firstChild.firstChild.firstChild.title
                            var canvas = document.createElement('CANVAS');
                            var ctx = canvas.getContext('2d');
                            canvas.height = mutation.addedNodes[0].naturalHeight;
                            canvas.width = mutation.addedNodes[0].naturalWidth;
                            ctx.drawImage(mutation.addedNodes[0], 0, 0);
                            dataURL = canvas.toDataURL().replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
                            if (dataURL == "data:,") {
                                addValue(pername, null)
                            }
                            else {
                                addValue(pername, dataURL)
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
            console.log('Scrolling')

            document.querySelector("._1C2Q3._36Jt6").scroll({
                top: 0,
                left: 0,
                behavior: 'smooth'
            });

            for (var i = 0; i < document.querySelectorAll(".Akuo4 ._35k-1._1adfa._3-8er").length; i++) {
                if (document.querySelectorAll(".OMoBQ._3wXwX.copyable-area .-y4n1")[i].querySelector("img")) {
                    var canvas = document.createElement('CANVAS');
                    var ctx = canvas.getContext('2d');
                    canvas.height = document.querySelectorAll(".OMoBQ._3wXwX.copyable-area .-y4n1")[i].querySelector("img").naturalHeight;
                    canvas.width = document.querySelectorAll(".OMoBQ._3wXwX.copyable-area .-y4n1")[i].querySelector("img").naturalWidth;
                    ctx.drawImage(document.querySelectorAll(".OMoBQ._3wXwX.copyable-area .-y4n1")[i].querySelector("img"), 0, 0);
                    dataURL = canvas.toDataURL().replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
                    addValue(document.querySelectorAll(".Akuo4 ._35k-1._1adfa._3-8er")[i].title, dataURL);
                } else {
                    addValue(document.querySelectorAll(".Akuo4 ._35k-1._1adfa._3-8er")[i].title, null);
                }
                observer.observe(document.querySelectorAll("._1Flk2._2DPZK ._2aBzC")[i], config);
            }
        }, 200);

        scroll = 0

        function scrolling() {
            if (Math.ceil(document.querySelector("._1C2Q3._36Jt6").scrollHeight - document.querySelector("._1C2Q3._36Jt6").scrollTop) > document.querySelector("._1C2Q3._36Jt6").clientHeight + document.querySelector("[data-list-scroll-offset]").clientHeight / 5) {
                setTimeout(function () {
                    try {
                        document.querySelector("._1C2Q3._36Jt6").scrollBy({
                            top: document.querySelector("._1C2Q3._36Jt6").clientHeight,
                            left: 0,
                            behavior: 'smooth'
                        });
                        scroll++
                        scrolling();
                    } catch {
                        storage("reset")
                        observer.disconnect
                    }
                }, 1500);
            } else {
                const contact = {}
                for (i in dict) {
                    var value = false
                    for (con in dict[i]) {
                        if (dict[i][con] != null) {
                            value = true
                        }
                    }
                    if (value) {
                        contact[i] = Array.from(new Set(dict[i]))
                        if (contact[i].length > 1) {
                            console.log("Duplicates detected")
                        }
                    }
                }
                storage("reset")
                console.log(contact)
                observer.disconnect
                port.postMessage({
                    cmd: "Contact",
                    contacts: contact
                });
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

console.log(document.querySelectorAll("._1XaX-").length)
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