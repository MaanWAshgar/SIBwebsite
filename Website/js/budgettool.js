/*jshint esversion: 6 */
/*
Javascript file for the budget tool in the resources section.
Author: Maan Ashgar
Last updated: 17/02/2019
*/

// //////////////// Classes code begins ////////////////

/* This class is considered the base of the program. The program start by
creating an instance of this class. A Budget instance can contain multiple
accounts and each account can have multiple tranasctions. Currently, only one
account is used, but the design allows the tool to provide the user with
multiple accounts (e.g. house and work accounts, or cash and credit card
accounts)

Due to the requirements of the course this program was written for, local
storage was used to store the user's information, where in the real world a
datebase (local or remote) would have been used. */
class Budget {
  constructor() {
    this._accountList = [];  // List of all created accounts
    // List of tool's settings data. Currently not utilized.
    this._settings = [];
    // This is to keep a transaction ID unique between all accounts
    this._lastAssignedID = 0;
    console.log('New Budget Created!');
  }

  get accountList() {
    return this._accountList;
  }

  set accountList(newAccountList) {
    this._accountList = newAccountList;
  }

  get settings() {
    return this._settings;
  }

  set settings(newSettings) {
    this._settings = newSettings;
  }

  /* get lastAssignedID () is used to read the current value, where
  assignTransactionID () is used to get the value and update it */
  get lastAssignedID() {
    return this._lastAssignedID;
  }

  set lastAssignedID(newID) {
    this._lastAssignedID = newID;
  }

  /* Manages the assignments of ids. Use get lastAssignedID() to just read
  the value */
  assignTransactionID() {
    this._lastAssignedID += 1; // We start the IDs from 1
    return this._lastAssignedID;
  }

  /* Searchs for an account by name and return it */
  returnAccount(accountName) {
    const accountIndex = this.findAccountIndex(accountName);
    if (accountIndex > -1) {
      return this._accountList[accountIndex]; // return the account object ref
    } else {
      return 'Account not found'; // return a failure message
    }
  }

  /* Searchs for an account by name and return its index */
  findAccountIndex (accountName) {
    for (let i = 0; i < this._accountList.length; i++) {
      if (this._accountList[i]._accountName === accountName) {
        return i; // return the found index;
      }
    }
    return -1; // return -1 when no match is found
  }

  /* Create a new account, checks if its a duplicate, sets its name, adds it to
   the acccount list, then return it*/
  createAccount (name) {
    name = cleanTextInput(name);
    if (typeof name === 'string' && this.findAccountIndex(name) === -1) {
      this._accountList.push(new Account(name));
      return this._accountList[this._accountList.length-1];
    } else {
      console.log('Error creating an account.'+
      ' Account name was not a string or a duplicate');
    }
  }

  /* Finds an account by a given name and removes it from the accounts list
  (Which in turn deletes it)*/
  deleteAccount (accountName) {
    let accountIndex = this.findAccountIndex(accountName);
    if (accountIndex !== -1) {
      this._accountList.splice(accountIndex, 1);
    } else {
      console.log('Account by the name' + accountName + ' not found');
    }
  }

  /* Saves the the budget instance (and all the tools data) to Local Storage.
  Since Local Storage only stores text, the budget instance object is converted
  to JSON text before saving*/
  saveToStorage() {
    localStorage.setItem('accountList', JSON.stringify(this._accountList));
    localStorage.setItem('settings', JSON.stringify(this._settings));
    localStorage.setItem('lastAssignedID', JSON.stringify(this._lastAssignedID));
  }

  /* Restores the saved data in Local Storage. The check for available data
  happens before calling this method. Since direct parsing by JSON class does
  not return full objects, new objects of accounts and transactions are created
  from the data retrived */
  restoreFromStorage() {
    this._settings = JSON.parse(localStorage.getItem('settings'));
    this._lastAssignedID = JSON.parse(localStorage.getItem('lastAssignedID'));
    this._accountList = [];
    const tempList = JSON.parse(localStorage.getItem('accountList'));

    tempList.forEach( account => {
      let tempaccount = this.createAccount(account._accountName);
      tempaccount.currency = account._currency;
      tempaccount.startingAmount = account._startingAmount;
      for (let i = 0; i < account._transactionList.length ; i++){
        tempaccount.addTransaction( new Transaction(
          account._transactionList[i]._id,
          account._transactionList[i]._name,
          account._transactionList[i]._date,
          account._transactionList[i]._amount,
          account._transactionList[i]._category,
          account._transactionList[i]._type
        ));
      }
    });
  }

  /* Delete all the data of the tool and clear the Local Storage */
  clearAllData() {
    localStorage.clear();
    this._accountList = [];
    this._settings = [];
    this._lastAssignedID = 0;
  }

  /* Converts the budget instance object (and all the tool's data) to a JSON
  text and returns it */
  exportToText() {
    return JSON.stringify(budget);
  }

  // TODO: importFromText() to allow importing previously saved budget data
}

/* This class represent an account in a budget (e.g. home budget, project
budget ...etc) It holds all the transaction related to a specific account */
class Account {
  constructor(name) {
    this._transactionList = []; // List of all transactions in this account
    this._accountName = name;
    // Starting amount to be used in budget calculation (not yet implemented).
    this._startingAmount = 0;
    this._currency = 'C$'; // Allowing accounts to have different currencies.
    this._analysis = []; // transactions analysis data.

    console.log('New Account Created!');
  }

  get transactionList() {
    return this._transactionList;
  }

  set transactionList (newTransactionList) {
    this._transactionList = newTransactionList;
  }

  get accountName() {
    return this._accountName;
  }

  set accountName(newAccountName) {
    this._accountName = cleanTextInput(newAccountName);
  }

  get startingAmount() {
    return this._startingAmount;
  }

  set startingAmount(newStartingAmount) {
    this._startingAmount = checkAmountInput(newStartingAmount);
  }

  get currency() {
    return this._currency;
  }

  set currency(newCurrency) {
    this._currency = newCurrency;
  }

  get analysis() {
    return this._analysis;
  }

  addTransaction(newTransaction) {
    this._transactionList.push(newTransaction);
  }

  // Generate the analytics data for the current transactions.
  analyzeAccount () {
    let resultsArray = [];

    // Apply the following code for each transaction in this account
    this._transactionList.forEach( transaction =>{
      // Group transactions by month
      let transactionYearMonth = transaction.date.slice(0,7);
      let monthIndex = -1;
      for(let i = 0; i < resultsArray.length; i++){
        if (resultsArray[i].yymm.toString() === transactionYearMonth.toString()){
          monthIndex = i;
          break;
        }
      }
      /* If the month entry for this transaction was not found, generate a new one
        for that month */
      if (monthIndex === -1) {
        resultsArray.push({
          yymm: transactionYearMonth, //The month name is in yyyy-mm format
          expense: 0,  // Total of all expense transactions
          income: 0,  // Total of all income transactions
          balance: 0, // income total - expense total
          num: 0,  // number of all transactions this month (income and expense)
          // each category expense and income transactions
          cat: {expense:{}, income:{}}
        }) ;
        monthIndex = resultsArray.length - 1;
      }

      // Update expense or income total (based on the transaction type)
      resultsArray[monthIndex][transaction.type] += parseFloat(transaction.amount);

      /* Update the category expense or income total
      (based on the transaction type and category) */
      if (typeof resultsArray[monthIndex].cat[transaction.type][transaction.category] === 'undefined'){
        resultsArray[monthIndex].cat[transaction.type][transaction.category] = 0;
      }
      resultsArray[monthIndex].cat[transaction.type][transaction.category] +=
        parseFloat(transaction.amount);

      // Update the month's balance
      resultsArray[monthIndex].balance =
        parseFloat(resultsArray[monthIndex].income) -
        parseFloat(resultsArray[monthIndex].expense);

      // Increase the number of transactions for this month
      resultsArray[monthIndex].num += 1;
    });

    // Sort the analysis array by recent month first
    resultsArray.sort( (monthA, monthB) => {
      return new Date(monthB.yymm+'-01') - new Date(monthA.yymm+'-01');
    });
    this._analysis = resultsArray;
  }

  // a method to delete a transaction from the list
  deleteTransaction(transactionID) {
    console.log('deleteing ID: '+ transactionID);
    this._transactionList.splice(this.findTransactionIndex(transactionID), 1);
  }

  // a method to edit a transaction. Feature not yet implemented.
  editTransaction(transactionID, cellType, newValue, oldValue) {

  }

  /* Searchs for a transaction by id and return its index */
  findTransactionIndex(transactionID) {
    for (let i = 0; i < this._transactionList.length; i++) {
      //test code: console.log(transactionID +' === '+ this._transactionList[i]._id);
      if (this._transactionList[i]._id === Number(transactionID)) {
        return i; // return the found index;
      }
    }
    return -1; // return -1 when no match is found
  }
}


/* Class to represent a single transaction. Mostly a data object, but migth
be extended in the future*/
class Transaction {
  constructor (id, name, date, amount, category, type) {
    this._id = id;  // unqiue transaction id across all accounts.
    this._name = name; // Transaction name (e.g. Enterprise car rental 2 days)
    this._date = date; // The transaction date
    this._amount = amount; // The transaction amount
    this._category = category; // The transaction category
    this._type = type; // The transaction type (income or expense)

    console.log('New Transaction Created!');
  }

  get id () {
    return this._id;
  }

  set id (newID) {
    this._id = newID;
  }

  get name () {
    return this._name;
  }

  set name (newName) {
    this._name = cleanTextInput(newName);
  }

  get date () {
    return this._date;
  }

  set date (newDate) {
    this._date = newDate;
  }

  get amount () {
    return this._amount;
  }

  set amount (newAmount) {
    this._amount = newAmount;
  }

  get category () {
    return this._category;
  }

  set category (newCategory) {
    this._category = newCategory;
  }

  get type () {
    return this._type;
  }

  set type (newType) {
    if (newType === 'income' || newType === 'expense'){
      this._type = newType;
    }
    else {
      console.log('Error: value: '+newType+' cannot be assigned to type');
    }
  }
// TODO: add toString and fromString methods.
}
// //////////////// Classes code ends ////////////////

// Start by creating a budget instance, and add a default account to it.
const budget = new Budget();
let account = budget.createAccount('main budget');

// When the page is done loading , lets do some setup
window.onload = function() {
  $('#linechart').hide(); // Hide the chart area as it maybe empty

  //Check if local storage is available to inform the user
  checkForLocalStorage();

  /* If Local Storage has previous data, load it. This overwrites the budget
  instance and the main account created above */
  if (typeof(Storage) !== "undefined") {
    if (JSON.parse(localStorage.getItem('accountList'))) {
      budget.restoreFromStorage();  // restore previous data
      /* Set account to 'main budget' as the tool currently allows for one account
      Once the tool allow for multiple account, it should load the account that
      was active when the tool last ran */
      account = budget.returnAccount('main budget');
      /* Since previous data was loaded, update the transaction table with
      available transactions */
      updateTable(account);
      account.analyzeAccount(); // Analyze the transactions that were restored
      draw(account); // Show the analysis data and draw the bar charts
      drawLineChart();
    }
  }

  //give default value to the date picker (set to today)
  document.getElementById('date').valueAsDate = new Date();
  // Set the currency picker to the current account currency
  document.getElementById('currency').value = account.currency;

};

// Here is the entrie point for the jqury code, when the document finish loading
$(document).ready(function(){
    //test code: $('div').css("border", "3px solid red");

    // Set the transactions table to be editable
    const editor = new SimpleTableCellEditor("transactionTable");

    // Set the class to identifiy editable cells
    editor.SetEditableClass("editable",{
      // ignore the validation here, it will be done with the event "cell:edited"
      validation : (value) => { return true; }, //return checkAmountInput(value);
      // ignore the formatting here, it will be done with the event "cell:edited"
      formatter : (val) => { return val; },
      // Assign the keyboard keys for accepting or exiting (CR = 13, Esc = 27)
      keys : { validation: [13], cancellation: [27]}
    });

    /* On entering an editable cell, this method is called. Change input
    depending on the cell type */
    $("#transactionTable").on("cell:onEditEntered", (element) => {
      // Get the edited transaction ID and the cell type
      let transactionID = $(editor.CellEdition.Elem).siblings()[0].innerHTML;
      let cellType = editor.CellEdition.Elem.classList[0];

      // find the index of the transaction with the ID in the account
      let trIndex = account.findTransactionIndex(transactionID);
      if (trIndex === -1){
        // Seems like the transaction no longer exists. Break out
        console.log('Oops, transaction not found!');
        return;
      }

      // Get the current row
      let currentRow = $(editor.CellEdition.Elem).parent()[0];

      // Handel edits to an amount cell
      if (cellType === 'amountcell'){
        /* Lets give some space to the new cells by shrinking the date and
        name cells. The solution was acquired from:
        https://stackoverflow.com/questions/15819716/how-to-slowly-change-the-letter-spacing-of-an-h1-once-the-div-its-in-is-clicked*/
        $('.namecell, .datecell, .categorycell').stop().animate({ fontSize: '12px' });
        //$('.namecell').style.letterSpacing= "-8px";

        let type = account.transactionList[trIndex].type;
        let otherType = type === 'income'? 'expense' : 'income';

        // Show a 'Type' selection next to the cell (income/expense)
        let typeCell = currentRow.insertCell(-1);
        typeCell.innerHTML =
          '<select name="type" id="typeinacell">' +
            '<option value="'+type+'">'+type+'</option>' +
            '<option value="'+otherType+'">'+otherType+'</option>' +
          '</select>';
      }

      // Handel edits to a category cell
      if (cellType === 'categorycell'){
        let category = account.transactionList[trIndex].category;

        editor.CellEdition.Elem.innerHTML =
          '<select name="category" id="categorycell">' +
            '<option value="nocategory">Select a category</option>' +
            '<option value="groceries">Groceries</option>' +
            '<option value="eatingout">Eating Out</option>' +
            '<option value="entertainment">Entertainment</option>' +
            '<option value="personalexpenses">Personal Expenses</option>' +
            '<option value="homeandKitchen">Home and Kitchen</option>' +
            '<option value="food">Food</option>' +
            '<option value="rent">Rent</option>' +
            '<option value="utilities">Utilities</option>' +
            '<option value="medical">Medical</option>' +
            '<option value="extra">Extra</option>' +
            '<option value="cashflow">Cash flow</option>' +
            '<option value="salary">Salary</option>' +
            '<option value="refund">Refund</option>' +
          '</select>';

          // Set the selected option to the current category
        $('#categorycell').val(category).change();
      }
      // Handel edits to a category cell
      if (cellType === 'datecell'){
        // add the date picker
        editor.CellEdition.Elem.innerHTML =
        '<input type="date" name="date" id="datecell">';

        //give the current date value to the date picker
        let currentDate = account.transactionList[trIndex].date;
        document.getElementById('datecell').valueAsDate = new Date(currentDate);
      }
      // Add a 'delete/remove transaction' button to the end of the current row
      let deleteCell = currentRow.insertCell(-1);
      deleteCell.innerHTML =
      '<input type="button" onclick="htmlDeleteTransactionButton('+transactionID+')" value="remove">';
    });

    /* On exiting an editable cell, this method is called. Do the needed edits
    to return the cell to its normal look with the new value, and get the
    values from the dropboxes */
    $("#transactionTable").on("cell:onEditExit", (element) => {
      // Get the edited transaction ID and the cell type
      let transactionID = $(editor.CellEdition.Elem).siblings()[0].innerHTML;
      let cellType = editor.CellEdition.Elem.classList[0];

      // find the index of the transaction with the ID in the account
      let trIndex = account.findTransactionIndex(transactionID);
      if (trIndex === -1){
        // Seems like the transaction no longer exists. Break out
        console.log('Oops, transaction not found!');
        return;
      }

      // Get the current row
      let currentRow = $(editor.CellEdition.Elem).parent()[0];

      // remove the last cell which should be the remove transaction button
      currentRow.deleteCell(-1);

      // Handle the type input if the cell was an amount cell
      if (cellType === 'amountcell') {
        // Check if there was a type change
        let type = account.transactionList[trIndex].type;
        let selected = $('#typeinacell option:selected').val();

        if (type !== selected && typeof selected !== 'undefined' ) {
          account.transactionList[trIndex].type = selected;
          // Save budget to Local Storage to save the change
          budget.saveToStorage();
        }
        // Delete the cell that contains the type input
        currentRow.deleteCell(-1);
        // now lets put the following cells back to their normal font size
        $('.namecell, .datecell, .categorycell').stop().animate({ fontSize: '16px' });
      }

      // Handle the category input if the cell was a category cell
      if (cellType === 'categorycell') {
        let category = account.transactionList[trIndex].category;
        let selected = $('#categorycell option:selected').val();

        if (category !== selected && typeof selected !== 'undefined' ) {
          account.transactionList[trIndex].category = selected;
          // Save budget to Local Storage to save the change
          budget.saveToStorage();
        }
      }
    });


    $("#transactionTable").on("cell:edited", function (element, oldValue, newValue) {
      // Get the edited transaction ID and what was changed
      let transactionID = $(editor.CellEdition.Elem).siblings()[0].innerHTML;
      let cellType = editor.CellEdition.Elem.classList[0];

      // find the index of the transaction with the ID in the account
      let trIndex = account.findTransactionIndex(transactionID);
      if (trIndex === -1){
        // Seems like the transaction no longer exists. Break out
        console.log('Oops, transaction not found!');
        return;
      }

      // Get the new value
      newValue = editor.CellEdition.Elem.innerHTML;

      /* Depending on the edited cell type, check the new value then change
      the transaction with the new value */
      switch (cellType) {
        case "amountcell":
          newValue = Number(newValue);

          // if the new value is accepted, update the transaction and save
          if (checkAmountInput(newValue)) {
            account.transactionList[trIndex].amount = newValue;

          } else {
            // show the original amount if the new value was not accepted
            editor.CellEdition.Elem.innerHTML =
                  account.transactionList[trIndex].amount;
          }
          break;

        case "namecell":
          // Clean the input text that may contain code breaking/altering text
          newValue = cleanTextInput(newValue);

          // update with the new value as long as it is no empty text
          if (newValue !== '') {
            account.transactionList[trIndex].name = newValue;
            editor.CellEdition.Elem.innerHTML =
                  account.transactionList[trIndex].name;
          } else {
            editor.CellEdition.Elem.innerHTML =
                  account.transactionList[trIndex].name;
          }
          break;

          /* Category cells update are handled on exiting, here we just updat
          the cell text to reflect the saved change. */
        case "categorycell":
          editor.CellEdition.Elem.innerHTML =
                account.transactionList[trIndex].category;
          break;

        case "datecell":
          let currentDate = account.transactionList[trIndex].date;
          if(newValue === '') {
            editor.CellEdition.Elem.innerHTML =
                account.transactionList[trIndex].date;
          } else if ( newValue !== currentDate) {
            account.transactionList[trIndex].date = newValue;
          }
          break;
        default:
          //cell type unknown, revert the change
      }

      // Save budget to Local Storage to save the change
      budget.saveToStorage();

      // Update the HTML table
      updateTable(account);
      draw(account); // Redraw the analysis area using the new data
      drawLineChart(); // Redaw the line chart using the new data

    });

});


// Check for Local Storage support in the browser and inform/warn the user
function checkForLocalStorage(){
  const warning = document.getElementById('storagewarning');
  const storagesafe = document.getElementById('storagesafe');
  /*
  The following checking code was retrived from the MDN web docs
  https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
  */
  if (typeof(Storage) !== "undefined") {
    storagesafe.style.display = 'block'; // LocaL Storage supported
    warning.style.display = 'none';
  } else {
    warning.style.display = 'block'; // Local Storage not supported
    storagesafe.style.display = 'none';
  }
}

/* Check the submitted amount using regex. Only allow positive num or positive
decimal number (e.g. 2 or 2.1 or 2.1111 or 22222.1 or 2. or 2.2.) */
function checkAmountInput(amount) {
  let regexpattern = new RegExp("^\\d+\.?\\d*$");
  return regexpattern.test(amount); // returns true if passed
}

/* Clean the submitted text from characters that might cause problems
Solution acquired from:
https://codereview.stackexchange.com/questions/153691/escape-user-input-for-use-in-js-regex
by: https://codereview.stackexchange.com/users/9357/200-success
 */
function cleanTextInput(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* Function called when the add transaction button is pressed. */
function htmlTransactionAddButton() {
  // First, get all the values from the input fields
  let name = document.getElementById('name').value;
  let date = document.getElementById('date').value;
  let amount = document.getElementById('amount').value;
  let category = document.getElementById('category').value;
  let type = document.getElementById('type').value;

  // check that amount is a positive number (even if it was expense)
  if(!checkAmountInput(amount)){
    // Show an error message if the amount is not accepted
    document.getElementById('amountcheck').style.display = 'block';
    return; // exit the function since the amount value was not accepted
  }
  // Make sure the error message for the amount input is removed if accepted
  document.getElementById('amountcheck').style.display = 'none';

  // If the date input was empty, default to today's date
  if (date === '') {
    const today = new Date();
    const day = today.getDate() < 10 ? '0' + today.getDate(): today.getDate();
    const month = today.getMonth() < 10 ?
      '0' + (today.getMonth()+1) : (today.getMonth()+1);
    date = today.getFullYear() + '-' + month + '-' + day;
  }
  /* If the name input was empty, default to 'Unnamed transaction', else
  clean the name first */
  name = name === '' ? 'Unnamed transaction' : cleanTextInput(name);
  // TODO: more input error checking for the name. Strip away HTML

  /* test code:
  console.log(name +"|"+ date +"|"+ amount +"|"+ category +"|"+ type);*/
  // If all values are good, create and add a new transaction to the account
  const transaction = new Transaction(budget.assignTransactionID(),
    name, date, amount, category, type);
  account.addTransaction(transaction);

  // re-analyze the account's transactions then redraw the results
  account.analyzeAccount();
  draw(account);
  drawLineChart(); // Redaw the line chart using the new data

  // Add the transaction to the transaction HTML table.
  addToTable(transaction);

  // Reset the input fields
  restTransactionInputFields();

  // Save the current budget instance to Local Storage
  budget.saveToStorage();
}

// Funcation to reset the input fields by reseting the form
function restTransactionInputFields() {
  document.getElementById('budgetToolInput').reset();
  // Set the date input to today's date
  document.getElementById('date').valueAsDate = new Date();
}

/* Add a transaction to the HTML table. The transaction is inserted in the table
 based on its date. Show most recent transaction on top */
function addToTable(transaction) {
  let transactionTable = document.getElementById('transactionTableBody');
  let insertAtIndex = -1;
  let transactionDate = new Date(transaction.date);

  // find the index to insert the transaction based on its date
  for(let i = 0; i < transactionTable.rows.length ; i++) {
    let rowDate = new Date(transactionTable.rows[i].cells[1].textContent);
    if(rowDate < transactionDate){
      insertAtIndex = i;
      break;
    }
  }

  // Create a new row at found index and insert the transaction data
  let newRow = transactionTable.insertRow(insertAtIndex);
  let idCell = newRow.insertCell(0);
  let dateCell = newRow.insertCell(1);
  let nameCell = newRow.insertCell(2);
  let categoryCell = newRow.insertCell(3);
  let amountCell = newRow.insertCell(4);

  idCell.innerHTML = transaction.id;
  dateCell.innerHTML = transaction.date;
  nameCell.innerHTML = transaction.name;
  categoryCell.innerHTML = transaction.category;
  amountCell.innerHTML = transaction.amount;

  dateCell.classList.add('datecell','editable');
  nameCell.classList.add('namecell','editable');
  categoryCell.classList.add('categorycell','editable');
  amountCell.classList.add('amountcell','editable');

  /* based on the transaction type (income or expense),
  color the transaction amount */
  amountCell.style.color = transaction.type === 'income' ? 'green' : 'red';
}

// To update the HTML table when the page is loaded and previous data was found
function updateTable(account) {
  // First we clear the table from any previous rows
  let transactionTable = document.getElementById('transactionTableBody');
  while(transactionTable.rows.length > 0){
    transactionTable.deleteRow(transactionTable.rows.length-1);
  }

  const tList = account.transactionList;
  // Go over every transaction and add it to the HTML table
  tList.forEach( transaction => addToTable(transaction));
  account.analyzeAccount(); // After adding the transactions, analyze them again
}

/* This function get called when the user click on 'Clear all Saved Data' button
  First show a confirmation message, and if the user agrees, delete all the
  transactions rows in the HTML table and clear the Local Storage Data */
function removeAllData() {
  if (confirm("Pressing OK will clear all saved data.\n"+
  "This action can not be undone!\nPress Cancel to retrun without clearning.")){
    let transactionTable = document.getElementById('transactionTableBody');
    while(transactionTable.rows.length > 0){
      transactionTable.deleteRow(transactionTable.rows.length-1);
    }
    budget.clearAllData();
  } else {
    // The user cancelled. Do nothing!
  }
}

// Show the result of the analysis data and draw the bar charts
function draw(account) {
  let htmlText = '';
  let analysisArea = document.getElementById('analysis');

  // First, remove all previous added data, "2" here saves div 'donotdeletetags'
  while (analysisArea.childNodes.length > 2){
    analysisArea.removeChild(analysisArea.childNodes[analysisArea.childNodes.length -1]);
  }

  // If there are no analysis data (ie no transactions), show error message
  if (account.analysis.length === 0){
    $('#linechart').hide(); // Hide the chart
    htmlText = '<h4>' + 'There are no transactions to analyze' + '<br />' +
    'Enter your transactions to see your budget analysis'+  '</h4>';
    analysisArea.insertAdjacentHTML("beforeend", htmlText);
    // exit the funcation since there is nothing more to do
    return;
  }
  //Show the chart div since there are transactions to show
  $('#linechart').show();

  // Go over every analysis month group
  account.analysis.forEach( monthStat => {
    tempDateObj = new Date(monthStat.yymm+'-15');
    // Set the month title [Month name, Year. E.g April 2019]
    let monthTitle = getMonthName(tempDateObj.getMonth()) +
      ' ' + tempDateObj.getFullYear();

    // Add the title to the HTML page
    htmlText = '<h4>' + monthTitle + '</h4>';
    analysisArea.insertAdjacentHTML("beforeend", htmlText);

    // Add the month's analysis data to the HTML page
    htmlText = '<p> Expense: ' + account.currency + monthStat.expense +'<br />'+
    'income: ' + account.currency + monthStat.income + '<br />' +
    'Month&apos;s balance: ' + account.currency +monthStat.balance + '<br />' +
    'Numbrt of transactions: ' + monthStat.num + '<br />'+
    '</p>';
    analysisArea.insertAdjacentHTML("beforeend", htmlText);

    // Now we show the month's category analysis
    htmlText = '<h5>' + 'Expense' + '</h5>';
    analysisArea.insertAdjacentHTML("beforeend", htmlText);

    // If there are no expense transactions, show error message
    if (Object.keys(monthStat.cat.expense).length === 0) {
      htmlText = '<p>' + 'No transactions under this type' + '</p>';
      analysisArea.insertAdjacentHTML("beforeend", htmlText);
    }

    // Go over all expense transactions to draw the bar charts
    Object.keys(monthStat.cat.expense).forEach(category => {
      drawCategroy(monthStat, 'expense', category, analysisArea);
    });

    htmlText = '<h5>' + 'Income' + '</h5>';
    analysisArea.insertAdjacentHTML("beforeend", htmlText);

    // If there are no income transactions, show error message
    if (Object.keys(monthStat.cat.income).length === 0) {
      htmlText = '<p>' + 'No transactions under this type' + '</p>';
      analysisArea.insertAdjacentHTML("beforeend", htmlText);
    }

    // Go over all income transactions to draw the bar charts
    Object.keys(monthStat.cat.income).forEach(category => {
      drawCategroy(monthStat, 'income', category, analysisArea);
    });

    // Close the month's analysis data by adding a horizontal ruler
    htmlText = '<br /><hr />';
    analysisArea.insertAdjacentHTML("beforeend", htmlText);
  });


}

/* Handles the drawing of the line chart using ChartJS
https://www.chartjs.org/ */
function drawLineChart() {
  // Get the drawing area in the html file
  let chartarea = document.getElementById("linechart");
  let lineMonthLabels = []; // the months labels for the line chart
  let availableExpenseCat = []; // list of avoilable expense categories
  let availableIncomeCat = []; // list of avoilable income categories
  let dataSetArray = []; // The datasets that will be used to draw the line chart
  let colorSets = [];
  // Get the available categories and months labels
  let tempArray = [];
  let tempArrayTwo = [];
  for(let i = 0; i < account.analysis.length; i++) {
    for(let j = 0; j < Object.keys(account.analysis[i].cat.expense).length; j++) {
      tempArray.push(Object.keys(account.analysis[i].cat.expense)[j]);
    }
    for(let j = 0; j < Object.keys(account.analysis[i].cat.income).length; j++) {
      tempArrayTwo.push(Object.keys(account.analysis[i].cat.income)[j]);
    }
    lineMonthLabels.push(account.analysis[i].yymm);
  }
  availableExpenseCat = filterArray(tempArray);
  availableIncomeCat = filterArray(tempArrayTwo);

  // Create the datasets for the expenses categories.
  availableExpenseCat.forEach(category => {
    let color = [getLineChartColor('expense')];
    dataSetArray.push({ label: category + ' expense',
      data: getCategoryChartData(category, 'expense').reverse(),
      fill: false,
      borderColor: color,
      backgroundColor: color
    }); //reverse() to show the chart old --to--> recent (left to right)

  });

  // Create the datasets for the income categories
  availableIncomeCat.forEach(category => {
    let color = [getLineChartColor('income')];
    dataSetArray.push({ label: category + ' income',
      data: getCategoryChartData(category, 'income').reverse(),
      fill: false,
      borderColor: color,
      backgroundColor: color
    }); //reverse() to show the chart old --to--> recent (left to right)
  });
  // Create the line chart using ChartJS
  let myChart = new Chart(chartarea, {
    type: 'line',
    data: {
      labels: lineMonthLabels.reverse(),
      datasets: dataSetArray,
    }
  }); //reverse() to show the chart old --to--> recent (left to right)

}

// Funcation to draw the categories analysis data and bar charts
function drawCategroy(monthStat, type, category, drawingArea) {
  let graphEmptyText = '';
  let graphFullText = '';

  // If the category total is 0, dont draw a bar chart and show only a 0
  if (monthStat.cat[type][category] === 0) {
    htmlText = '<p><span class="graphkey'+type+'">'+category+':</span> '+
    account.currency+'0' + '</p><br />';
    drawingArea.insertAdjacentHTML("beforeend", htmlText);
  } else {
    // category total is not 0 and therefor draw the bar chart
    let categoryPercentage  =
      Math.floor((monthStat.cat[type][category] / monthStat[type]) * 100);

    /* Add a number of characters equal to the % of category total to type
      (income/expense) total*/
    for (let i = 0; i < categoryPercentage; i++){
      graphFullText += '&#9600;';
    }
    /* Add a number of characters equal to the % - 100 of category total to
    type (income/expense) total */
    for (let i = 0; i < (100-categoryPercentage); i++){
      graphEmptyText += '&#9600;';
    }

    // Use the characters to create the bar chart and color them using CSS classes
    htmlText = '<p class ="categorybars"><span class="graphkey'+ type +'">' +
    category+': </span>' + account.currency+monthStat.cat[type][category] +
    '<br />'+ '<span class="graphbarfull">'+ graphFullText +'</span>'+
    '<span class="graphbarempty">'+ graphEmptyText +'</span>'+
    '<span class="graphkey'+type+'">&nbsp;&nbsp;&nbsp;%'+ categoryPercentage +
    '</span>'+ '</p>';
    drawingArea.insertAdjacentHTML("beforeend", htmlText);
  }
}

// Convert month's number to the month name, since no native function does this
function getMonthName(monthNum){
  month = [];
  month[0] = "January";
  month[1] = "February";
  month[2] = "March";
  month[3] = "April";
  month[4] = "May";
  month[5] = "June";
  month[6] = "July";
  month[7] = "August";
  month[8] = "September";
  month[9] = "October";
  month[10] = "November";
  month[11] = "December";

  return month[monthNum];
}

/* Function gets called when the user changes the account's currency
in the settings area */
function changeCurrency() {
  account.currency = document.getElementById('currency').value;
  // Save budget to Local Storage to save the currency change
  budget.saveToStorage();
  draw(account); // Redraw the analysis area using the new currency
}

/* Function gets called when the user click on 'Export Data As JSON'
in the settings area. Shows a textarea with JSON text of the current Budget data.
Currently importing this data is not supported, but should be easily added */
function exportData() {
  let settingsArea = document.getElementById('settings');
  htmlText = '<textarea>' + budget.exportToText() +  '</textarea>';
  settingsArea.insertAdjacentHTML("beforeend", htmlText);
}

/* Function gets called when the user click on the 'Remove' button next to
a transaction in the transaction table. It removes the transaction and redraw
the analysis */
function htmlDeleteTransactionButton(transactionID) {
  account.deleteTransaction(transactionID);
  // Save budget to Local Storage to save the change
  budget.saveToStorage();
  // Update the HTML table
  updateTable(account);
  draw(account); // Redraw the analysis area using the new data
  drawLineChart(); // Redaw the line chart using the new data
}

/* Function to return a unqiue set of items in an array since it seems there
is no native way to do this. Solution from:
https://itsolutionstuff.com/post/how-to-remove-duplicate-value-from-array-in-jqueryexample.html
By Hardik Savani */
function filterArray(array){
  return array.filter((elem, index, self) => {
    return index === self.indexOf(elem);
  });
}

/* Function to generate a dataset array for each category of the type that gets
passed as a parameter*/
function getCategoryChartData(category, type){
  let dataPointsArray = [];
  let datapoint = 0;

  // Go over each month in the analysis data
  for(let i = 0; i < account.analysis.length; i++){
    datapoint = 0;
    // if the category has a sum in this month, set the datapoint to that sum
    if (typeof account.analysis[i].cat[type][category] !== 'undefined'){
      datapoint = account.analysis[i].cat[type][category];
    }
    dataPointsArray.push(datapoint);
  }

  /* return the dataset of this category for each month. 0 if not in a month, or
  the sum in the month if it exists in that month */
  return dataPointsArray;
}

function getLineChartColor(type){
  let color = '';
  let red = 0;
  let blue = 0;
  let green = 0;
  if (type === 'expense') {
    red = Math.floor(Math.random() * 150) + 105 ;
    blue = Math.floor(Math.random() * 130);
    green = Math.floor(Math.random() * 130);
  } else {
    red = Math.floor(Math.random() * 10);
    blue = Math.floor(Math.random() * 155) + 50;
    green = Math.floor(Math.random() * 200) + 55;
  }
  //green = blue = Math.floor(Math.random() * 150);

  return 'rgba(' + red +
  ',' + green +
  ',' + blue +
  ',0.7)';
}
