export function encodeSearch(name: string): string {
    let t = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    t = t.replace('-', ' ');
    return t;
}

export function nameMatches(name: string, firstName: string, lastName: string): boolean {
    let a = encodeSearch(name).toLowerCase();
    let b = encodeSearch(firstName).toLowerCase();
    let c = encodeSearch(lastName).toLowerCase();

    if (!a.startsWith(b)) return false;
    if (!a.includes(c)) return false;
    return true;
}