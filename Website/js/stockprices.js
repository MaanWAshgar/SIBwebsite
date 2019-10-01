/*jshint esversion: 6 */
/*
Javascript file for the budget tool in the resources section.
Author: Maan Ashgar
Last updated: 20/02/2019
*/

// Number of compaines added. Used in some functions.
let numOfCompanies = 0;

// When the page is done loading , lets do some setup
window.onload = function() {
  // If Local Storage has previous data, load it.
  if (typeof(Storage) !== "undefined") {
    if(restoreFromStorage()){
      console.log('Restored from Local Storage');
      showUserMessage('Restored from Local Storage');
      updateCalculation();
    } else {
      addNewRow(); // If nothing restored from the storage, create a row
    }
  } else {
    showUserMessage('Local Storage not supported. Data cant be saved');
    addNewRow(); // If Storage is not supported, create a row
  }
};

// Here is the entry point for the jqury code, when the document finish loading
$(document).ready(function(){
  // Set the stocks table to be editable
  const editor = new SimpleTableCellEditor("stockstable");

  // Set the class to identifiy editable cells
  editor.SetEditableClass("editable",{
    // ignore the validation here, it will be done with the event "cell:edited"
    validation : (value) => { return true; },
    // ignore the formatting here, it will be done with the event "cell:edited"
    formatter : (val) => { return val; },
    // Assign the keyboard keys for accepting or exiting (CR = 13, Esc = 27)
    keys : { validation: [13], cancellation: [27]}
  });

  // On entering an editable cell, this event is fired.
  $("#stockstable").on("cell:onEditEntered", (element) => {
    // Seems no changes needed at this point. Method kept for future usage.
  });

  /* On exiting an editable cell, this event is fired. Do the needed edits
  to return the cell to its normal look with the new value, and get the
  values from the dropboxes */
  $("#stockstable").on("cell:onEditExit", (element) => {
    // Seems no changes needed at this point. Method kept for future usage.
  });

  // This event is fired when a cell was edited
  $("#stockstable").on("cell:edited", function (element, oldValue, newValue) {
    // Get the new value
    let cellValue = editor.CellEdition.Elem.innerHTML;

    // if the new value is rejected, set the cell value to zero
    if (!checknumericalInput(Number(cellValue))) {
      editor.CellEdition.Elem.innerHTML = '0';
      showUserMessage('Value entered was not valid');
    }
    // Update the calculation using the new value and save to storage
    updateCalculation();
    saveToStorage();
  });
});

/* Check the submitted number using regex. Only allow positive num or positive
decimal number (e.g. 2 or 2.1 or 2.1111 or 22222.1 or 2. or 2.2.) */
function checknumericalInput(number) {
  let regexpattern = new RegExp("^\\d+\.?\\d*$");
  return regexpattern.test(number); // returns true if passed
}

/* Fetch yesterday's stock prices to update the table cells. Yesterday's price
was chosen to reduce the user's desire to refresh the page continusaly to get
an updated price */
function updatePrices(){
  let stocktable = document.getElementById('stockstablebody');
  let requestedSymbols = '';

  /* First we get the selected stocks symbols to generate only one request
  instead of doing one request per stock */
  for (let i = 0; i < stocktable.rows.length; i++){
    let selected = $('#stocksymbol'+i+' option:selected').val();
    if (selected !== 'none'){ //ignore unselected fields/rows
      requestedSymbols += selected+',';
    }
  }

  if (requestedSymbols === ''){  // No stock was selected, log error and exit
    console.log('Nothing to update!');
    showUserMessage('No stock was selected to retrieve its price');
    return;
  }

  // Remove the last comma as it wont be needed in the request
  requestedSymbols = requestedSymbols.slice(0, requestedSymbols.length-1);

  // Send the request to Worldtradingdata.com's API
  showUserMessage('Fetching stocks yesterday\'s prices');
  $.getJSON('https://www.worldtradingdata.com/api/v1/stock?symbol='+requestedSymbols+
  '&api_token=zuNHDPMklFFdpx8pjg4lrzDgOT02Bwl4Qvfugr6KFKYCEnM2bCTRrQWzEGoc ', data => {
    // test code: console.log(data);

    // For each stock symbol, see if the price was retrieved
    for (let i = 0; i < stocktable.rows.length; i++){
      let selected = $('#stocksymbol'+i+' option:selected').val();
      for(let j = 0; j < data.data.length; j++) {
        if (data.data[j].symbol === selected) {
          if (checknumericalInput(Number(data.data[j].close_yesterday))){
            // If the price data was found and is a number, update the table
            stocktable.rows[i].cells[4].textContent = data.data[j].close_yesterday;
          } else {
            // Something was wrong with the price. Log the error
            let msg = 'Problem retriving price for symbol: ' + selected +
            ', value found: '+ Number(data.data[j].close_yesterday);
            console.logmsg();
            showUserMessage(msg);
          }
        }
      }
    }
    /* With the new data, update the calculation and save. If a price was not
    updated, value remains at 0 or previously fetched data */
    updateCalculation();
    saveToStorage();
  });
  showUserMessage('Fetching data done!');
}

/* Method to update the calculation of the Totals when a value is changed or
when a new price is fetched. */
function updateCalculation() {
  let stocktable = document.getElementById('stockstablebody');
  let totalCost = 0;
  let sharesValue = 0;

  // Do the calculation for every row and update totalCost and sharesValue
  for (let i = 0; i < stocktable.rows.length; i++){
    // Update Tota cost [3] with Purchase price [1] * Num of shares [2]
    let tempTC = Number(stocktable.rows[i].cells[1].textContent) *
      Number(stocktable.rows[i].cells[2].textContent);
    // Round to 2 decimal places
    stocktable.rows[i].cells[3].textContent = Math.round(tempTC * 100) / 100;
    totalCost += Number(stocktable.rows[i].cells[3].textContent);

    // Update Shares value [5] with Yesterday's price [4] * Num of shares [2]
    let tempSV = Number(stocktable.rows[i].cells[4].textContent) *
      Number(stocktable.rows[i].cells[2].textContent);
    // Round to 2 decimal places
    stocktable.rows[i].cells[5].textContent = Math.round(tempSV * 100) / 100;
    sharesValue += Number(stocktable.rows[i].cells[5].textContent);
  }
  // Update the gain/loss, totalCost, sharesValue in the table's footer
  let stocktablefooter = document.getElementById('stockstablefooter');
  stocktablefooter.rows[0].cells[2].textContent = Math.round(totalCost * 100) / 100;
  stocktablefooter.rows[0].cells[4].textContent = Math.round(sharesValue * 100) / 100;

  stocktablefooter.rows[0].cells[0].textContent =
    'Total gained/lost = '+ Math.round((sharesValue - totalCost) * 100) / 100;
}

/* setup and add a new row to the table*/
function addNewRow() {
  let stocktable = document.getElementById('stockstablebody');

  // add a new row at the bottom
  let insertAtIndex = -1;
  let newRow = stocktable.insertRow(insertAtIndex);
  let symbolCell = newRow.insertCell(0);
  let purchasePriceCell = newRow.insertCell(1);
  let numOfSharesCell = newRow.insertCell(2);
  let totalCostCell = newRow.insertCell(3);
  let yesterdayPriceCell = newRow.insertCell(4);
  let sharesValueCell = newRow.insertCell(5);

  // get the list of available companies and setup the cells
  symbolCell.innerHTML = getSymbolDropDownHTML(numOfCompanies);
  purchasePriceCell.innerHTML = 0;
  numOfSharesCell.innerHTML = 0;
  totalCostCell.innerHTML = 0;
  yesterdayPriceCell.innerHTML = 0;
  sharesValueCell.innerHTML = 0;

  purchasePriceCell.classList.add('editable');
  numOfSharesCell.classList.add('editable');

  totalCostCell.classList.add('readonly');
  yesterdayPriceCell.classList.add('readonly');
  sharesValueCell.classList.add('readonly');

  // Increase the number of rows/companies counter
  numOfCompanies++;
}

// Remove the last row in the table
function removeLastRow() {
  // Show warning to the user and act based on the user's decision
  if (confirm("Pressing OK will remove the last row.\n"+
  "This action can not be undone!\nPress Cancel to retrun without removing.")){
    document.getElementById('stockstablebody').deleteRow(-1);
    // decrease the counter of the rows/companies
    numOfCompanies--;

    // Update the calculations and save
    updateCalculation();
    saveToStorage();
    // If last row removed, add a new empty one
    if (document.getElementById('stockstablebody').rows.length === 0) {
      addNewRow();
    }

  } else {
    // The user cancelled. Do nothing!
  }
}

/* Display the passed string as warning/msg to the user.
 Solution for the delayed remove acquired from:
 https://stackoverflow.com/questions/3655627/jquery-append-object-remove-it-with-delay
 */
function showUserMessage(message) {
  $('#warnings').append('<p>'+message+'</p>');
  setTimeout( () => {
    $('#warnings').find(':first-child').remove();
  }, 5000);
}

// Save the data to Local Storage
function saveToStorage() {
  let stocktable = document.getElementById('stockstablebody');
  for (let i = 0; i < stocktable.rows.length; i++){
    let row = {
      stock: $('#stocksymbol'+i+' option:selected').val(),
      purchasePrice: stocktable.rows[i].cells[1].textContent,
      numOfShares: stocktable.rows[i].cells[2].textContent,
      yesterdayPrice: stocktable.rows[i].cells[4].textContent
    };
    // ignore the rows that have no company selection
    if (row.stock !== 'none'){
      localStorage.setItem('stocksymbol'+i, JSON.stringify(row));
    }
    // test code: console.log('Saving: '+'stocksymbol'+i+' = '+JSON.stringify(row));
  }
}

// Retrive the data saved in the Local Storage
function restoreFromStorage() {
  let atLeastOneFound = false;
  let i = 0;
  let stocktable = document.getElementById('stockstablebody');
  // Load the available data
  while (localStorage.getItem('stocksymbol'+i) !== null) {
    atLeastOneFound = true;
    let row = JSON.parse(localStorage.getItem('stocksymbol'+i));
    addNewRow();
    $('#stocksymbol'+i).val(row.stock).change();
    stocktable.rows[i].cells[1].textContent = row.purchasePrice;
    stocktable.rows[i].cells[2].textContent = row.numOfShares;
    stocktable.rows[i].cells[4].textContent = row.yesterdayPrice;
    i++;
  }
  // return that at least one or more companies/rows were previously saved
  return atLeastOneFound;
}

/* Delete all the data of the tool and clear the Local Storage */
function removeAllData() {
  // Show warning to the user and act based on the user's decision
  if (confirm("Pressing OK will clear all saved data.\n"+
  "This action can not be undone!\nPress Cancel to retrun without clearning.")){
    let stocktable = document.getElementById('stockstablebody');
    while(stocktable.rows.length > 0){
      stocktable.deleteRow(stocktable.rows.length-1);
    }
    // Clear the footer
    let stocktablefooter = document.getElementById('stockstablefooter');
    stocktablefooter.rows[0].cells[2].textContent = 0;
    stocktablefooter.rows[0].cells[4].textContent = 0;
    stocktablefooter.rows[0].cells[0].textContent = 'Total gained/lost = 0';

    // Remove the data from local storage
    localStorage.clear();

    // After deleting all data, add a new empty row
    addNewRow();
  } else {
    // The user cancelled. Do nothing!
  }
}

/* Return the following text to create a dropdown of available companies to
choose from. This was made to have this large text in just one location in
the code */
function getSymbolDropDownHTML(rowNum){
  let htmlText =
    '<select name="stocksymbol'+rowNum+'" id="stocksymbol'+rowNum+'">\n' +
    '<option value="none">Select a company</option>\n' +
    '<option value="1010.SR">Riyad Bank SJSC</option>\n' +
    '<option value="1020.SR">Bank Aljazira</option>\n' +
    '<option value="1030.SR">Saudi Investment Bank SJSC</option>\n' +
    '<option value="1040.SR">Alawwal Bank</option>\n' +
    '<option value="1050.SR">Banque Saudi Fransi SJSC</option>\n' +
    '<option value="1060.SR">Saudi British Bank SJSC</option>\n' +
    '<option value="1080.SR">Arab National Bank</option>\n' +
    '<option value="1090.SR">Samba Financial Group SJSC</option>\n' +
    '<option value="1120.SR">Al Rajhi Banking & Investment Corp SJSC</option>\n' +
    '<option value="1140.SR">Bank Albilad</option>\n' +
    '<option value="1150.SR">Alinma Bank</option>\n' +
    '<option value="1180.SR">National Commercial Bank SJSC</option>\n' +
    '<option value="1201.SR">Takween Advanced Industries JSC</option>\n' +
    '<option value="1202.SR">Middle East Paper Company Saudi Arabia</option>\n' +
    '<option value="1210.SR">Basic Chemical Industries Company SJSC</option>\n' +
    '<option value="1211.SR">Saudi Arabian Mining Company (Ma\'aden)</option>\n' +
    '<option value="1212.SR">Astra Industrial Group</option>\n' +
    '<option value="1213.SR">Al Sorayai Trading & Indu Grp Com SJSC</option>\n' +
    '<option value="1214.SR">Al Hassan Ghazi Ibrahim Shaker Co LLC</option>\n' +
    '<option value="1301.SR">United Wire Factories Co JSC</option>\n' +
    '<option value="1302.SR">Bawan Co SJSC</option>\n' +
    '<option value="1303.SR">Electrical Industries Company JSC</option>\n' +
    '<option value="1304.SR">Al Yamamah Steel Industries Company CJSC</option>\n' +
    '<option value="1320.SR">Saudi Steel Pipes Company SJSC</option>\n' +
    '<option value="1330.SR">Abdullah A M Al Khodari Sons Co</option>\n' +
    '<option value="1810.SR">Al Tayyar Travel Grp Hds SJSC</option>\n' +
    '<option value="1820.SR">Abdulmohsen Al Hokair Gp for T&D Co CJSC</option>\n' +
    '<option value="1830.SR">Leejam Sports Company SJSC</option>\n' +
    '<option value="2001.SR">Methanol Chemicals Company SJSC</option>\n' +
    '<option value="2002.SR">National Petrochemical Co</option>\n' +
    '<option value="2010.SR">Saudi Basic Industries Corporation SJSC</option>\n' +
    '<option value="2020.SR">Saudi Arabia Fertilizers Co.</option>\n' +
    '<option value="2030.SR">Saudi Arabia Refineries Company</option>\n' +
    '<option value="2040.SR">Saudi Ceramic Co.</option>\n' +
    '<option value="2050.SR">Savola Group Company SJSC</option>\n' +
    '<option value="2060.SR">National Industrialization Company</option>\n' +
    '<option value="2070.SR">Saudi Pharmaceutical Indust&Mdcl Applncs</option>\n' +
    '<option value="2080.SR">National Gas & Industrialization Co.</option>\n' +
    '<option value="2090.SR">National Gypsum Company</option>\n' +
    '<option value="2100.SR">Wafrah for Industry and Devel Co SJSC</option>\n' +
    '<option value="2110.SR">Saudi Cable Co JSC</option>\n' +
    '<option value="2120.SR">Saudi Advanced Industries Company</option>\n' +
    '<option value="2130.SR">Saudi Industrial Development Co.</option>\n' +
    '<option value="2140.SR">Al-Ahsa Development Company</option>\n' +
    '<option value="2150.SR">National Co for Glass Industries</option>\n' +
    '<option value="2160.SR">Saudi Arabian Amiantit Co SJSC</option>\n' +
    '<option value="2170.SR">Alujain Corporation SJSC</option>\n' +
    '<option value="2180.SR">Filing & Packing Materials Manufacturing</option>\n' +
    '<option value="2190.SR">Saudi Industrial Services Company</option>\n' +
    '<option value="2200.SR">Arabian Pipes Company</option>\n' +
    '<option value="2210.SR">Nama Chemicals Company SJSC</option>\n' +
    '<option value="2220.SR">National Metal Manufacturing & Casting</option>\n' +
    '<option value="2230.SR">Saudi Chemical Company</option>\n' +
    '<option value="2240.SR">Zamil Industrial Investment Co SJSC</option>\n' +
    '<option value="2250.SR">Saudi Industrial Investment Group</option>\n' +
    '<option value="2260.SR">Sahara Petrochemicals Company</option>\n' +
    '<option value="2270.SR">Saudi Dairy & Foodstuff Company</option>\n' +
    '<option value="2280.SR">Almarai Co</option>\n' +
    '<option value="2290.SR">Yanbu National Petrochemicals Company</option>\n' +
    '<option value="2300.SR">Saudi Paper Manufacturing Co SJSC</option>\n' +
    '<option value="2310.SR">Saudi International Petrochemichal Co.</option>\n' +
    '<option value="2320.SR">Al-Babtain Power & Telecommunication Co.</option>\n' +
    '<option value="2330.SR">Advanced Petrochemical Co Ltd</option>\n' +
    '<option value="2340.SR">Al Abdullatif Industrial Investment Co.</option>\n' +
    '<option value="2350.SR">Saudi Kayan Petrochemical Company</option>\n' +
    '<option value="2360.SR">Saudi Vitrified Clay Pipe Company</option>\n' +
    '<option value="2370.SR">Middle East Specialized Cables CmpnySJSC</option>\n' +
    '<option value="2380.SR">Rabigh Refining and Petrochemical JSC</option>\n' +
    '<option value="3001.SR">Hail Cement Co SJSC</option>\n' +
    '<option value="3002.SR">Najran Cement Co</option>\n' +
    '<option value="3003.SR">City Cement Company CJSC</option>\n' +
    '<option value="3004.SR">Northern Region Cement Co</option>\n' +
    '<option value="3005.SR">Umm Al Qura Cement Co SJSC</option>\n' +
    '<option value="3007.SR">Zahrat Al Waha for Trading Company CJSC</option>\n' +
    '<option value="3020.SR">Yamama Cement Company SJSC</option>\n' +
    '<option value="3030.SR">Saudi Cement Company</option>\n' +
    '<option value="3040.SR">Qassim Cement Company SJSC</option>\n' +
    '<option value="3050.SR">Southern Province Cement Company</option>\n' +
    '<option value="3060.SR">Yanbu Cement Compay SJSC</option>\n' +
    '<option value="3080.SR">Eastern Province Cement Company</option>\n' +
    '<option value="3090.SR">Tabuk Cement Company</option>\n' +
    '<option value="3091.SR">Al Jouf Cement Co</option>\n' +
    '<option value="4001.SR">Abdullah Al Othaim Markets Co</option>\n' +
    '<option value="4002.SR">Al Mouwasat Medical Services Co</option>\n' +
    '<option value="4003.SR">United Electronics Company JSC</option>\n' +
    '<option value="4004.SR">Dallah Healthcare Company SJSC</option>\n' +
    '<option value="4005.SR">National Medical Care Company JSC</option>\n' +
    '<option value="4006.SR">Saudi Marketing Company SJSC</option>\n' +
    '<option value="4007.SR">Al Hammadi Development and Investment Co</option>\n' +
    '<option value="4008.SR">Saudi Company for Hardware</option>\n' +
    '<option value="4009.SR">Middle East Healthcare Co CJSC</option>\n' +
    '<option value="4010.SR">Dur Hospitality Company SJSC</option>\n' +
    '<option value="4011.SR">Lazurde Company for Jewelry SCJC</option>\n' +
    '<option value="4020.SR">Saudi Real Estate Company</option>\n' +
    '<option value="4030.SR">The National Shipping Co. Saudi Arabia</option>\n' +
    '<option value="4031.SR">Saudi Ground Services Co</option>\n' +
    '<option value="4040.SR">Saudi Public Transport Company SJSC</option>\n' +
    '<option value="4050.SR">Saudi Automotive Services Company</option>\n' +
    '<option value="4061.SR">Anaam International Holding Group Co.</option>\n' +
    '<option value="4070.SR">Tihama Advertsg&Pbl Rltns&Mrktg Hld SJSC</option>\n' +
    '<option value="4080.SR">Aseer Trading, Tourism & Mfg. Company</option>\n' +
    '<option value="4090.SR">Taiba Holding SJSC</option>\n' +
    '<option value="4100.SR">Makkah Construction & Development Co.</option>\n' +
    '<option value="4110.SR">Batic Investments and Logistics Co</option>\n' +
    '<option value="4130.SR">Al Baha Investment and Dev Company SJSC</option>\n' +
    '<option value="4140.SR">Saudi Industrial Export Company</option>\n' +
    '<option value="4150.SR">Arriyadh Development Co</option>\n' +
    '<option value="4160.SR">National Agriculture Mrkting Com SJSC</option>\n' +
    '<option value="4170.SR">Tourism Enterprise Company (Shams)</option>\n' +
    '<option value="4180.SR">Fitaihi Holding Group</option>\n' +
    '<option value="4190.SR">Jarir Marketing Company</option>\n' +
    '<option value="4200.SR">Aldrees Petroleum &Transport Services</option>\n' +
    '<option value="4210.SR">Saudi Research and Marketing Group SJSC</option>\n' +
    '<option value="4220.SR">Emaar The Economic City</option>\n' +
    '<option value="4230.SR">Red Sea International Company</option>\n' +
    '<option value="4240.SR">Fawaz Abdulaziz Al Hokair Company</option>\n' +
    '<option value="4250.SR">Jabal Omar Development Co</option>\n' +
    '<option value="4260.SR">United International Transportation Co.</option>\n' +
    '<option value="4270.SR">Saudi Printing & Packaging Co.</option>\n' +
    '<option value="4280.SR">Kingdom Holding Company</option>\n' +
    '<option value="4290.SR">Al Khaleej Training and Education Co.</option>\n' +
    '<option value="4291.SR">National Company fr Lrnng Edctn SJSC</option>\n' +
    '<option value="4300.SR">Dar Al Arkan Real Est Devmt Cmpny SJSC</option>\n' +
    '<option value="4310.SR">Knowledge Economic City Co</option>\n' +
    '<option value="4320.SR">Al Andalus Property Co SJSC</option>\n' +
    '<option value="4330.SR">RIYAD REIT UNT</option>\n' +
    '<option value="4331.SR">AL JAZIRA MAWTEN REIT UNT</option>\n' +
    '<option value="4332.SR">JADWA REIT AL HARAMAIN ORD</option>\n' +
    '<option value="4333.SR">Taleem REIT Fund</option>\n' +
    '<option value="4334.SR">AL MAATHER REIT UNT</option>\n' +
    '<option value="4335.SR">MUSHARAKA REIT UNT</option>\n' +
    '<option value="4336.SR">MULKIA GULF REAL ESTATE REIT ORD</option>\n' +
    '<option value="4337.SR">Al Mashaar REIT</option>\n' +
    '<option value="4338.SR">ALAHLI REIT FUND UNT</option>\n' +
    '<option value="4339.SR">DERAYAH REIT FUND UNT</option>\n' +
    '<option value="4340.SR">Al Rajhi REIT</option>\n' +
    '<option value="4342.SR">JADWA REIT SAUDI FUND UNT</option>\n' +
    '<option value="4344.SR">SEDCO CAPITAL REIT UNT</option>\n' +
    '<option value="4345.SR">Swicorp Wabel REIT</option>\n' +
    '<option value="4347.SR">Bonyan REIT Fund</option>\n' +
    '<option value="5110.SR">Saudi Electricity Company SJSC</option>\n' +
    '<option value="6001.SR">Halwani Brothers Company JSC</option>\n' +
    '<option value="6002.SR">Herfy Food Services Co</option>\n' +
    '<option value="6004.SR">Saudi Airlines Catering Company</option>\n' +
    '<option value="6010.SR">National Agricultural Development Co</option>\n' +
    '<option value="6020.SR">Al Gassim Investment Holding Co SJSC</option>\n' +
    '<option value="6040.SR">Tabuk Agriculture Development Company</option>\n' +
    '<option value="6050.SR">Saudi Fisheries Co.</option>\n' +
    '<option value="6060.SR">Ash Sharqiyah Development Co</option>\n' +
    '<option value="6070.SR">Al Jouf Agricultural Development Co.</option>\n' +
    '<option value="6090.SR">Jazan Development Company SJSC</option>\n' +
    '<option value="7010.SR">Saudi Telecom Company SJSC</option>\n' +
    '<option value="7020.SR">Etihad Etisalat Company</option>\n' +
    '<option value="7030.SR">Mobile Telecommunications Co Su Arb SJSC</option>\n' +
    '<option value="8010.SR">Company for Cooperative Insurance SJSC</option>\n' +
    '<option value="8011.SR">Metlife American Intnl Grp&Arb Ntn Bk Co</option>\n' +
    '<option value="8012.SR">Aljazira Takaful Taawuni Company SJSC</option>\n' +
    '<option value="8020.SR">Malath Cooperative Insurance Com SJSC</option>\n' +
    '<option value="8030.SR">Mediterranean&Gulf Coop Insrnc&Rinsrn Co</option>\n' +
    '<option value="8040.SR">Allianz Saudi Fransi Coprativ Ins CoSJSC</option>\n' +
    '<option value="8050.SR">Salama Cooperative Insurance Co</option>\n' +
    '<option value="8060.SR">Walaa Cooperative Insurance Company SJSC</option>\n' +
    '<option value="8070.SR">Arabian Shield Coprtv Insrnc Compny SJSC</option>\n' +
    '<option value="8080.SR">SABB Takaful Company</option>\n' +
    '<option value="8100.SR">Saudi Arabian Cooperative Insurance Co.</option>\n' +
    '<option value="8110.SR">N/A</option>\n' +
    '<option value="8120.SR">Gulf Union Cooperative Insurance Company</option>\n' +
    '<option value="8130.SR">Alahli Takaful Company SJSC</option>\n' +
    '<option value="8140.SR">AlAhlia for Cooperative Insurance Co</option>\n' +
    '<option value="8150.SR">Allied Cooperative Insurance Group</option>\n' +
    '<option value="8160.SR">Arabia Insurance Cooperative Co.</option>\n' +
    '<option value="8170.SR">Al-Etihad Cooperative Insurance Co</option>\n' +
    '<option value="8180.SR">Al Sagr Co. for Cooperative Insurance</option>\n' +
    '<option value="8190.SR">United Cooperative Assurance Com SJSC</option>\n' +
    '<option value="8200.SR">Saudi Re for Cooperative Reinsurance Co</option>\n' +
    '<option value="8210.SR">Bupa Arabia for Cooperative Insu Co SJSC</option>\n' +
    '<option value="8230.SR">Al Rajhi for Cooperative Insurance</option>\n' +
    '<option value="8240.SR">CHUBB Arabia Cooperative Insurnc Co SJSC</option>\n' +
    '<option value="8250.SR">AXA Cooperative Insurance Company</option>\n' +
    '<option value="8260.SR">Gulf General Cooperative Insurance Co</option>\n' +
    '<option value="8270.SR">Buruj Cooperative Insurance Co SJSC</option>\n' +
    '<option value="8280.SR">Al Alamiya for Cooperative Insurance Co</option>\n' +
    '<option value="8290.SR">Solidarity Saudi Takaful Company</option>\n' +
    '<option value="8300.SR">Wataniya Insurance Company</option>\n' +
    '<option value="8310.SR">Amana Cooperative Insurance Company SJSC</option>\n' +
    '<option value="8311.SR">Saudi Enaya Cooperative Insur Com SJSC</option>\n' +
    '<option value="8312.SR">Alinma Tokio Marine Co</option>\n' +
    '</select>\n';
  return htmlText;
}
