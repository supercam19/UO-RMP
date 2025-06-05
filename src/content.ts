// Modified from Yong Wang
// https://stackoverflow.com/a/61511955
function waitForElm(selector: string, waitForExist: boolean = true) {
    return new Promise(resolve => {
        if ((document.querySelector(selector) !== null) === waitForExist) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if ((document.querySelector(selector) !== null) === waitForExist) {
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

function onEnrolPage() {
    const ids = document.querySelectorAll('[id]'); 
    const filtered = Array.from(ids).filter(el => /^MTG_INSTR\$[0-9]+$/.test(el.id))
    const names = new Set<string>(filtered.map(el => (parseName(el.textContent) ?? '')));
    names.delete('');
    names.delete('To be Announced');
    chrome.runtime.sendMessage(
        {
            type: 'profNames',
            payload: Array.from(names)
        },
        (response) => {
            for (const el of filtered) {
                const profName = parseName(el.textContent);
                if (profName === '') continue;
                el.parentElement?.querySelector('.uormp-rating')?.remove();
                const div = document.createElement('div');
                div.textContent = response.payload[profName]['avgRating'] ?? 'NA';
                div.className = 'uormp-rating';
                div.style.background = ratingToColour(div.textContent ?? 'NA');
                div.addEventListener("mouseover", (event) => {
                    createCard(div, response.payload[profName]['avgRating'], response.payload[profName]['profName'],
                        response.payload[profName]['numRatings'],
                        response.payload[profName]['wouldTakeAgainPercent'],
                        response.payload[profName]['avgDifficulty']
                    )
                });
                div.addEventListener("mouseout", (event) => {
                    const card = document.querySelector('.uormp-card');
                    if (card) {
                        card.remove();
                    }
                })
                el.parentElement?.appendChild(div);
            }
        }
    );
}

function createCard(parentElm: Element, avgRating: string, profName: string, numRatings: string, wouldTakeAgainPercent: string, avgDifficulty: string) {
    const card = document.createElement('div');
    card.className = 'uormp-card';
    const parentRect = parentElm.getBoundingClientRect();
    card.style.left = `${parentRect.right + 5}px`;
    card.style.top = `${parentRect.top}px`;
    card.innerHTML = `
        <div class="uormp-card-left">
            <h5>QUALITY</h5>
            <div claass=uormp-rating>${avgRating}</div>
            <h5>${numRatings} ratings</h5>
        </div>
        <div class="uormp-card-right">
            <h4>${profName}</h4>
            <h5>University of Ottawa</h5>
            <h5>${wouldTakeAgainPercent}% would take again</h5>
            <h5>${avgDifficulty} average difficulty</h5>
        </div>
    `
    parentElm.appendChild(card);
}

function parseName(str: string | null): string {
    if (!str) return '';
    str = str.replaceAll('To be Announced', '').trim();
    const names = str.split('\n');
    return names[0];
}

function ratingToColour(rating: string): string {
    if (rating === 'NA') return 'gray';
    const num = parseFloat(rating);
    if (isNaN(num)) return 'gray';
    if (num >= 4.5) return 'green';
    if (num >= 3.5) return 'yellow';
    if (num >= 2.5) return 'orange';
    return 'red';
}

async function main() {
    while (true) {
        await waitForElm('#win0divDERIVED_CLSRCH_GROUP6', true).then(onEnrolPage);
        await waitForElm('#win0divDERIVED_CLSRCH_GROUP6', false);
    }
}

main();

