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
                    createCard(div, response.payload[profName]['avgRating'], profName,
                        response.payload[profName]['numRatings'],
                        response.payload[profName]['wouldTakeAgainPercent'],
                        response.payload[profName]['avgDifficulty'],
                        response.payload[profName]['department']
                    )
                });
                div.addEventListener("mouseout", (event) => {
                    const card = document.querySelector('.uormp-card');
                    if (card) {
                        card.remove();
                    }
                });
                div.addEventListener("click", (event) => {
                    window.open(`https://www.ratemyprofessors.com/search/professors/1452?q=${encodeURIComponent(profName)}`, '_blank');
                })
                el.parentElement?.appendChild(div);
            }
        }
    );
}

function createCard(parentElm: Element, avgRating: string, profName: string, numRatings: string, wouldTakeAgainPercent: string, avgDifficulty: string, department: string) {
    const card = document.createElement('div');
    card.className = 'uormp-card';
    const parentRect = parentElm.getBoundingClientRect();
    card.style.left = `${parentRect.right + 5}px`;
    card.style.top = `${parentRect.top - 23}px`;
    card.innerHTML = `
        <div class="uormp-card-left">
            <div class="uormp-heavy" style="font-size: 12px;">QUALITY</div>
            <div class="uormp-rating" style="background: ${ratingToColour(avgRating)};">${avgRating}</div>
            <div class="uormp-light" style="font-size: 12px;">${numRatings} ratings</div>
        </div>
        <div class="uormp-card-right">
            <div class="uormp-heavy">${profName}</div>
            <div class="uormp-light" style="color: #222;font-size: 12px;">${department}</div>
            <div class="uormp-light">${wouldTakeAgainPercent}% would take again</div>
            <div class="uormp-light">${avgDifficulty} average difficulty</div>
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
    if (rating === 'NA') return 'lightgray';
    const num = parseFloat(rating);
    if (isNaN(num)) return 'lightgray';
    if (num >= 4.5) return 'lightgreen';
    if (num >= 3.5) return 'yellow';
    if (num >= 2.5) return 'orange';
    return 'rgb(255, 156, 156)';
}

async function main() {
    while (true) {
        await waitForElm('#win0divDERIVED_CLSRCH_GROUP6', true).then(onEnrolPage);
        await waitForElm('#win0divDERIVED_CLSRCH_GROUP6', false);
    }
}

main();

