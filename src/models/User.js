export default class User {
  constructor(uid, data) {
    this.uid = uid;
    this.email = data.email;
    this.firstName = data.firstName || "";
    this.lastName = data.lastName || "";
    this.profileIconURL = data.profileIcon || "";
    this.groceries = data.groceries || [];
}

    getGroceries(){
      return [...this.groceries, ...this.sharedGroceries];
    }

    getName(){
      return this.name;
    }
     
}