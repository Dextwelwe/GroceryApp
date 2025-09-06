import i18n from "../i18n.js";
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
        this.customCategories = data.customCategories || [];
        this.customStores = data.customStores || [];
    }

    getTitle(){
        return this.name;
    }

    getId(){
        return this.id;
    }

    getCategoriesFromAddedItems() {
        const unique = new Set(this.items.map(item => item.category));
        const categories = Array.from(unique).map(c => ({desc: c, label: c, type: 'item'}));
        return categories;
    }

    getCustomCategories(){
        return this.customCategories.map(el => {
           return {
             desc : el,
             type : 'custom'
            }
        });
    }

    getCustomStores(){
        return this.customStores.map(el =>{
            return {
                desc : el,
                type : 'custom'
            }
        })
    }

    getStoresFromAddedItems(){
        const unique = new Set(this.items.map(item => item.store));
        const stores = Array.from(unique).map(c => ({desc : c, label : c, type : 'item'}))
        return stores;
    }

    getCategoryOptionAll(){
        return {value : "all", label: i18n.t("ALL")};
    }

    getCategoryOptionUnspecified(){
         return {value : "unspecified", label: i18n.t("UNSPECIFIED")};
    }

    getStores() {
    const unique = new Set(this.items.map(item => item.store));
    const stores = Array.from(unique).map(c => ({value: c, label: c}));
    return [{value : "all", label: i18n.t("ALL")}, ...stores];
    }

}

