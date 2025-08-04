export default class User {
  constructor(uid, data) {
      console.log(data)
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

    getCustomItems(){
      return this.customItems;
    }

    getCustomStores(){
      return this.customStores;
    }
}