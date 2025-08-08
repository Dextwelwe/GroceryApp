export default class User {
  constructor(uid, data) {
    this.uid = uid;
    this.firstName = data.firstName || "";
    this.lastName = data.lastName || "";
    this.profileIconURL = data.profileIcon || "";
    this.groceries = data.groceries || [];
    this.sharedGroceries = data.sharedGroceries || [];
    this.customItems = data.customItems || [];
    this.customStores = data.customStores || [];
}

    getGroceries(){
      return [...this.groceries, ...this.sharedGroceries];
    }

    getSharedGroceries(){
      return this.sharedGroceries;
    }
    
    getPersonalGroceries(){
      return this.groceries;
    }

    getCustomItems(){
      return this.customItems;
    }

    getCustomStores(){
      return this.customStores;
    }
}