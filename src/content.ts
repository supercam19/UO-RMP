// Stolen from Yong Wang
// https://stackoverflow.com/a/61511955
function waitForElm(selector: string) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
        // this can probably be improved by observing more specific
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    });
}
console.log('Content script loaded');
waitForElm('#win0divDERIVED_CLSRCH_GROUP6').then(() => {
    const ids = document.querySelectorAll('[id]'); 
    const filtered = Array.from(ids).filter(el => /^MTG_INSTR\$[0-9]+$/.test(el.id))
    const names = new Set<string>(filtered.map(el => (el.textContent ?? '').trim().split('\n')[0]));
    names.delete('');
    names.delete('To be Announced');
    console.log(names);
    chrome.runtime.sendMessage(
        {
            type: 'profNames',
            payload: Array.from(names)
        },
        (response) => {
            console.log('Response from background script:', response);
            for (const el of filtered) {
                if (el.textContent === 'To be Announced') continue;
                el.parentElement?.querySelector('.uormp-rating')?.remove();
                const div = document.createElement('div');
                div.textContent = response.payload[el.textContent?.trim().split('\n')[0] ?? ''] ?? 'NA';
                div.className = 'uormp-rating';
                div.style.background = ratingToColour(div.textContent ?? 'NA');
                el.parentElement?.appendChild(div);
            }
        }
    );
});

function ratingToColour(rating: string): string {
    if (rating === 'NA') return 'gray';
    const num = parseFloat(rating);
    if (isNaN(num)) return 'gray';
    if (num >= 4.5) return 'green';
    if (num >= 3.5) return 'yellow';
    if (num >= 2.5) return 'orange';
    return 'red';
}