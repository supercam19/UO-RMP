// Stolen from Yong Wang
// https://stackoverflow.com/a/61511955
function waitForElm(selector: string) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                console.log('Found');
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
console.log('Content script loaded: ' + document.querySelector('#win0divDERIVED_CLSRCH_GROUP6'));
waitForElm('#win0divDERIVED_CLSRCH_GROUP6').then(() => {
    console.log('Element found');
    const ids = document.querySelectorAll('[id]'); 
    console.log(ids);
    const filtered = Array.from(ids).filter(el => /INSTR\$[0-9]+/.test(el.id))
    console.log(filtered);
    const names = new Set<string>(filtered.map(el => (el.textContent ?? '').trim().split('\n')[0]));
    names.delete('');
    console.log(names);
});