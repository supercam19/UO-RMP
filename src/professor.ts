export class Professor {
    public firstName: string;
    public lastName: string;
    public rating: string = 'NA';
    public url: string = '';

    constructor(name: string) {
        // Remove accents and diacritics from the name
        name = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        name = name.replace('-', ' ');
        this.firstName = name.substring(0, name.indexOf(' '));
        this.lastName = name.substring(name.lastIndexOf(' ') + 1);
    }
}