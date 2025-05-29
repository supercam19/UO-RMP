type Packet = {
    type: string;
    payload: any;
}
type ProfMap = Record<string, any>;
type CachedData = {
    timestamp: number;
    avgRating: number;
}

async function handleMessage(request: Packet, sender: chrome.runtime.MessageSender, sendResponse: Function) {
    if (request && request.type === 'profNames') {
        let ratings = new Map<string, string>();
        for (const name of request.payload) {
            const storedObj = await chrome.storage.local.get(name);
            const stored: CachedData | undefined = storedObj[name];
            if (stored) {
                if (Date.now() - stored.timestamp < 1000 * 60 * 60) {
                    ratings.set(name, stored.avgRating.toString());
                    continue;
                }
            }
            // Name to use for the search on RMP
            let t = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            t = t.replace('-', ' ');
            const firstName = name.substring(0, name.indexOf(' '));
            const lastName = name.substring(name.lastIndexOf(' ') + 1);

            const url = "https://www.ratemyprofessors.com/search/professors/1452?q=" + firstName + '+' + lastName;
            
            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error("HTTP error " + res.status);
                const text = await res.text();
                const match = text.match(/window\.__RELAY_STORE__\s*=\s*(\{[\s\S]*?\});/)
                if (match) {
                    const rawJson = match[1];
                    const data = JSON.parse(rawJson);
                    const key = getKeyByName(firstName, lastName, data);
                    if (key) {
                        ratings.set(name, data[key].avgRating.toString());
                        chrome.storage.local.set({[name]:{timestamp: Date.now(), avgRating: data[key].avgRating}});
                    } else {
                        ratings.set(name, 'NA');
                        chrome.storage.local.set({[name]:{timestamp: Date.now(), avgRating: 'NA'}});
                    }
                }

            } catch (error) {
                ratings.set(name, 'NA');
                chrome.storage.local.set({[name]:{timestamp: Date.now(), avgRating: 'NA'}});
            }
}        
        sendResponse({payload: Object.fromEntries(ratings)});
    }
}

function getKeyByName(firstName: string, lastName: string, data: ProfMap): string | undefined {
    return Object.entries(data).find(([_, value]) =>
        value &&
        typeof value.firstName === 'string' &&
        typeof value.lastName === 'string' &&
        value.firstName === firstName &&
        value.lastName === lastName
      )?.[0];
}


chrome.runtime.onMessage.addListener((request: Packet, sender: chrome.runtime.MessageSender, sendResponse: Function) => {
    handleMessage(request, sender, sendResponse);
    return true;
});