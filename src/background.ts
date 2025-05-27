type Packet = {
    type: string;
    payload: any;
}
type ProfMap = Record<string, any>;

async function handleMessage(request: Packet, sender: chrome.runtime.MessageSender, sendResponse: Function) {
    if (request && request.type === 'profNames') {
        console.log('Background script received message:', request.payload);
        let ratings = new Map<string, string>();
        for (const name of request.payload) {
            const url = "https://www.ratemyprofessors.com/search/professors/1452?q=" + name.replace(" ", "+");
            const prof = new Professor(name);
            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error("HTTP error " + res.status);
                const text = await res.text();
                const match = text.match(/window\.__RELAY_STORE__\s*=\s*(\{[\s\S]*?\});/)
                if (match) {
                    const rawJson = match[1];
                    const data = JSON.parse(rawJson);
                    const key = getKeyByName(prof.firstName, prof.lastName, data);
                    if (key) {
                        ratings.set(name, data[key].avgRating || 'NA');
                    }
                }

            } catch (error) {
                ratings.set(name, 'NA');
            }
        }
        sendResponse({payload: Object.fromEntries(ratings)});
        return true;
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


chrome.runtime.onMessage.addListener(handleMessage)