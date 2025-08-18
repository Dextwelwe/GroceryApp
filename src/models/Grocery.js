export default class Grocery {
    constructor(id, data){
        this.id = id;
        this.name = data.name || "";
        this.groceryDate = data.groceryDate || "";
        this.dateCreation = data.dateCreation || "";
        this.repeatOn = data.repeatOn || "";
        this.items = data.items || [];
        this.dateLastUpdated = data.dateLastUpdated || "";
        this.status = data.status;
        this.sharedWith = data.sharedWith || []
    }

    getTitle(){
        return this.name;
    }

    getId(){
        return this.id;
    }

    getCategories() {
    const unique = new Set(this.items.map(item => item.category));
    const categories = Array.from(unique).map(c => ({value: c, label: c}));
    return [{value : "all", label: "All"}, ...categories];
}

    getStores() {
    const unique = new Set(this.items.map(item => item.store));
    const stores = Array.from(unique).map(c => ({value: c, label: c}));
    return [{value : "all", label: "All"}, ...stores];
}

}

