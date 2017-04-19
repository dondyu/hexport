var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var parse = require('csv-parse/lib/sync');


//HELPER FUNCTION TO IMPORT DATA
var saveDataToObj = (fileNameStr, inputDataObj)=>{
  //PATH ASSUMES APP FOLDER IS ON THE SAME LEVEL AS DB FOLDER, WHERE ALL THE CSV FILES ARE
  var path = '../db/'.concat(fileNameStr);
  var data = fs.readFileSync(path);
  var records = parse(data)
  var keyName = fileNameStr.substr(0, fileNameStr.length-4)
  inputDataObj[keyName]=records
}

//RECORD CONSTRUCTOR
var Record = function(shipment, companyID){
  this.id=parseInt(shipment[0]);
  this.name=shipment[1];
  this.products=[];
}

//PRODUCT CONSTRUCTOR
var Product = function(shipment_product){
  this.quantity = parseInt(shipment_product[3]);
  this.id = parseInt(shipment_product[0]);
}


router.get('/api/v1/shipments', function(req,res){
  //INITIALIZE STORAGE FOR DATA WITHIN THE APP
  var inputDataObj = {};
  var outputDataObj = {};
  outputDataObj.records = []
  var sortedOutputDataObj = {};
  sortedOutputDataObj.records = [];
  //IMPORT DATA
  saveDataToObj('companies.csv',inputDataObj);
  saveDataToObj('products.csv',inputDataObj);
  saveDataToObj('shipment_products.csv',inputDataObj);
  saveDataToObj('shipments.csv',inputDataObj);
  //ACCESS TO COLLECTIONS VIA VARIABLES
  var companies = inputDataObj.companies;
  var products = inputDataObj.products;
  var shipment_products = inputDataObj.shipment_products;
  var shipments = inputDataObj.shipments;
  //SORT BY DATE IN CASE QUERIES ARE APPROPRIATE
  if(req.query.sort==='international_departure_date'){
    switch(req.query.direction){
      case 'asc':
        shipments.sort(function(a,b){
          return (new Date(a[6]))-(new Date(b[6]))
        })
        break;
      case 'desc':
        shipments.sort(function(a,b){
          return (new Date(b[6]))-(new Date(a[6]))
        })
        break;
    }
  }
  //FILTER BY INTERNATIONAL_TRANSPORTATION_MODE
  if(req.query.international_transportation_mode){
    shipments = shipments.filter(function(shipment){
      return shipment[5]===req.query.international_transportation_mode
    })
  }

  //FORMING THE OUTPUT PROJECT
  //SAVING EACH RECORD OBJECT
  var active_shipment_count = 1;
  shipments.forEach(function(shipment){
    if (shipment[2]===req.query.company_id){
      var newRecord = new Record (shipment,2)
      //SAVING EACH PRODUCT OBJECT WITHIN ONE RECORD
      shipment_products.forEach(function(shipment_product){
        if (shipment_product[2]===newRecord.id.toString()){
          var newProduct = new Product(shipment_product)
          for(var i = 0; i<products.length; i++){
            var product = products[i]
            if (product[0]===newProduct.id.toString()){
              //ADDING LAST FEW PROPERTIES TO EACH PRODUCT FROM THE OTHER COLLECTION
              newProduct.sku = product[1];
              newProduct.description = product[2];
              newProduct.active_shipment_count = active_shipment_count++;
            }
          }
          newRecord.products.push(newProduct);
        }
      })
      outputDataObj.records.push(newRecord)
    }
  })
  //PAGINATION
  var page = req.query.page;
  var per = req.query.per;
  if(page){
    if (per){
      outputDataObj.records = outputDataObj.records.slice(per*(page-1), per*page)
    }
    else{
      outputDataObj.records = outputDataObj.records.slice(4*(page-1),4*page)
    }
  } else {
    outputDataObj.records = outputDataObj.records.slice(0,4)
  }
  //ERROR_MESSAGE
  if(!req.query.company_id){
    outputDataObj = {};
    outputDataObj.errors=['company_id is required']
    res.status(422)
  }
  res.send(outputDataObj)
})



module.exports = router;
