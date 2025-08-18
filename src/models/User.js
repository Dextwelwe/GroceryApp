export default class User {
  constructor(uid, data) {
    this.uid = uid;
    this.email = data.email;
    this.firstName = data.firstName || "";
    this.lastName = data.lastName || "";
    this.profileIconURL = data.profileIcon || "";
    this.groceries = data.groceries || [];
    this.sharedGroceries = data.sharedGroceries || [];
    this.customItems = data.customItems || [];
    this.customStores = data.customStores || [];
    this.isTestUser = data.isTestUser || false;
}

    getGroceries(){
      return [...this.groceries, ...this.sharedGroceries];
    }

    getName(){
      return this.name;
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