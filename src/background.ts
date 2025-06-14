import {encodeSearch, nameMatches} from './searchUtility';

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
        let ratings = new Map<string, any>();
        for (const name of request.payload) {
            const storedObj = await chrome.storage.local.get(name);
            const stored: CachedData | undefined = storedObj[name];
            if (stored) {
                if (Date.now() - stored.timestamp < 1000 * 60 * 60) {
                    ratings.set(name, stored);
                    continue;
                }
            }
            let t = encodeSearch(name).split(' ');
            let firstName = t[0];
            let lastName = t[t.length - 1];
            const url = "https://www.ratemyprofessors.com/search/professors/1452?q=" + firstName + '+' + lastName;
            
            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error("HTTP error " + res.status);
                const text = await res.text();
                const match = text.match(/window\.__RELAY_STORE__\s*=\s*(\{[\s\S]*?\});/)
                if (match) {
                    const rawJson = match[1];
                    const data = JSON.parse(rawJson);
                    const key = getKeyByName(name, data);
                    if (key) {
                        const info ={timestamp: Date.now(), avgRating: data[key].avgRating, wouldTakeAgainPercent: isNaN(data[key].wouldTakeAgainPercent) ? 'NA' : Math.round(data[key].wouldTakeAgainPercent).toString(), avgDifficulty: data[key].avgDifficulty, numRatings: data[key].numRatings, department: data[key].department};
                        ratings.set(name, info)
                        chrome.storage.local.set({[name]:info});
                    } else {
                        const info = {timestamp: Date.now(), avgRating: 'NA', wouldTakeAgainPercent: 'NA', avgDifficulty: 'NA', numRatings: 'NA', department: 'NA'};
                        ratings.set(name, info);
                        chrome.storage.local.set({[name]:info});
                    }
                }

            } catch (error) {
                const info = {timestamp: Date.now(), avgRating: 'NA', wouldTakeAgainPercent: 'NA', avgDifficulty: 'NA', numRatings: 'NA', department: 'NA'};
                ratings.set(name, info);
                chrome.storage.local.set({[name]:info});
            }
}        
        sendResponse({payload: Object.fromEntries(ratings)});
    }
}

function getKeyByName(name: string, data: ProfMap): string | undefined {
    return Object.entries(data).find(([_, value]) =>
        value &&
        typeof value.firstName === 'string' &&
        typeof value.lastName === 'string' &&
        nameMatches(name, value.firstName, value.lastName)
      )?.[0];
}


chrome.runtime.onMessage.addListener((request: Packet, sender: chrome.runtime.MessageSender, sendResponse: Function) => {
    handleMessage(request, sender, sendResponse);
    return true;
});