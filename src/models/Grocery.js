export default class Grocery {
    constructor(id, data){
        this.id = id;
        this.groceryDate = data.groceryDate || "";
        this.dateCreation = data.dateCreation || "";
        this.repeatOn = data.repeatOn || "";
        this.categories = data.categories || [];
        this.customCategories = data.customCategories || [];
        this.customItems = data.customItems || [];
        this.items = data.items || [];
        this.dateLastUpdated = data.dateLastUpdated || "";
        this.status = data.status;
        this.sharedWith = data.sharedWith || []
    }
}