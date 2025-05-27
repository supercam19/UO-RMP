type Packet = {
    type: string;
    payload: any;
}

async function handleMessage(request: Packet, sender: chrome.runtime.MessageSender, sendResponse: Function) {
    if (request && request.type === 'profNames') {
        console.log('Background script received message:', request.payload);
        let ratings = new Map<string, string>();
        for (const name of request.payload) {
            const url = "https://www.ratemyprofessors.com/search/professors/1452?q=" + name.replace(" ", "+");
            try {
                const res = await fetch(url);
            } catch (error) {
                ratings.set(name, 'NA');
            }
        }
        sendResponse({ status: 'received' });
        return true;
    }
}


chrome.runtime.onMessage.addListener(handleMessage)