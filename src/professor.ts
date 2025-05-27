class Professor {
    public firstName: string;
    public lastName: string;
    public rating: string = 'NA';
    public url: string = '';

    constructor(name: string) {
        this.firstName = name.substring(0, name.lastIndexOf(' '));
        this.lastName = name.substring(name.lastIndexOf(' ') + 1);
    }
}