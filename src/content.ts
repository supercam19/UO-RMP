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
    const ids = document.querySelectorAll<HTMLElement>('[id]'); 

    const filteredCourses = Array.from<HTMLElement>(ids).filter(el => /^win0divSSR_CLSRSLT_WRK_GROUPBOX2GP\$[0-9]+/.test(el.id));
    const coursesMap = new Map<HTMLElement, HTMLElement>(filteredCourses.map(el => {
        for (let i = 0; i < filteredCourses.length; i++) {
            const div = el.closest<HTMLElement>(`#win0divSSR_CLSRSLT_WRK_GROUPBOX2\\\$${i}`);
            if (div != null) return [div,el];
        }
        return [el, el];
    }));
    
    const filteredNames = Array.from<HTMLElement>(ids).filter(el => /^MTG_INSTR\$[0-9]+$/.test(el.id));
    const namesMap = new Map<HTMLElement, HTMLElement>(filteredNames.map(el => {
        for (let i = 0; i < filteredCourses.length; i++) {
            const div = el.closest<HTMLElement>(`#win0divSSR_CLSRSLT_WRK_GROUPBOX2\\\$${i}`);
            if (div != null) return [el,div];
        }
        return [el, el];
    }));

    const encyclopedia = new Map<HTMLElement, Array<string>>(filteredNames.map(el => {
        const div = namesMap.get(el);
        if (div == undefined) return [el, []];
        return [el, [parseName(el.textContent), parseCourse(coursesMap.get(div)!.textContent)]];
    }));

    const names = new Set<string>(filteredNames.map(el => (parseName(el.textContent) ?? '')));
    names.delete('');
    names.delete('To be Announced');

    const courses = new Set<string>(filteredCourses.map(el => (parseCourse(el.textContent) ?? '')));
    courses.delete('');

    chrome.runtime.sendMessage(
        {
            type: 'profNames',
            payload: [Array.from(names), Array.from(courses)]
        },
        (response) => {
            for (const el of filteredNames) {
                const profCoursePair = encyclopedia.get(el);
                if (profCoursePair == undefined) continue;
                const profName = profCoursePair[0];
                const course = profCoursePair[1];

                if (profName === '') continue;
                if (course === '') continue;

                let courseData = response.payload.courses[course][profName];
                if (!courseData) courseData = response.payload.courses[course]['None'];
                const ratings = response.payload.ratings[profName];

                const stats = [GPAToGrade(courseData["mean"]), courseData["median"], courseData["mode"]];
                el.parentElement?.querySelector('.uormp-rating')?.remove();
                const div = document.createElement('div');
                div.textContent = ratings['avgRating'] ?? 'NA';
                div.className = 'uormp-rating';
                div.style.background = ratingToColour(div.textContent ?? 'NA');
                div.addEventListener("mouseover", (event) => {
                    createCard(div, ratings['avgRating'], profName,
                        ratings['numRatings'],
                        ratings['wouldTakeAgainPercent'],
                        ratings['avgDifficulty'],
                        ratings['department'],
                        stats
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

function createCard(parentElm: Element, avgRating: string, profName: string, numRatings: string, wouldTakeAgainPercent: string, avgDifficulty: string, department: string, stats: Array<string>) {
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
    if (stats) {
        card.innerHTML += `
            <div class="uogrades-card">
                <div class="uormp-light">Mean: ${stats[0]}</div>
                <div class="uormp-light">Median: ${stats[1]}</div>
                <div class="uormp-light">Mode: ${stats[2]}</div>
            </div>
        `
    }
    parentElm.appendChild(card);
}

function parseName(str: string | null): string {
    if (!str) return '';
    str = str.replaceAll('To be Announced', '').trim();
    const names = str.split('\n');
    return names[0];
}

function parseCourse(str: string | null): string {
    if (!str) return '';
    str = str.replaceAll(' ', '').toLowerCase().substring(1, 8);
    return str;
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

function GPAToGrade(GPA: number): string {
    if (!GPA) return '';
    const rounded = Math.round(GPA);
    if (rounded == 10) return 'A+';
    if (rounded == 9) return 'A';
    if (rounded == 8) return 'A-';
    if (rounded == 7) return 'B+';
    if (rounded == 6) return 'B';
    if (rounded == 5) return 'C+';
    if (rounded == 4) return 'C';
    if (rounded == 3) return 'D+';
    if (rounded == 2) return 'D';
    if (rounded == 1) return 'E';
    return 'F';
    
}

async function main() {
    while (true) {
        await waitForElm('#win0divDERIVED_CLSRCH_GROUP6', true).then(onEnrolPage);
        await waitForElm('#win0divDERIVED_CLSRCH_GROUP6', false);
    }
}

main();

