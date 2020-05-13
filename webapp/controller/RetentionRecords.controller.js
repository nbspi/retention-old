sap.ui.define([
  "sap/m/MessageBox",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"com/apptech/app-retention/controller/AppUI5",
	"sap/ui/core/BusyIndicator"
], function(MessageBox, Controller, JSONModel, MessageToast,Fragment, Filter, FilterOperator,AppUI5,BusyIndicator) {
  "use strict";

  return Controller.extend("com.apptech.app-retention.controller.RetentionRecords", {

    onInit: function () {

			this.Database = jQuery.sap.storage.get("Database");
			this.UserName = jQuery.sap.storage.get("Usename");
      
      		//Selection Menu
			this.POData = new JSONModel("model/POCreation.json");
			
			this.getView().setModel(this.POData, "POData");


			//getButtons
			this.oMdlButtons = new JSONModel();
			this.oResults = AppUI5.fGetButtons(this.Database,this.UserName,"contractransaction");
				var newresult = [];
					this.oResults.forEach((e)=> {
						  var d = {};
						  d[e.U_ActionDesc] = JSON.parse(e.visible);
						  newresult.push(JSON.parse(JSON.stringify(d)));
				});
			var modelresult = JSON.parse("{" + JSON.stringify(newresult).replace(/{/g,"").replace(/}/g,"").replace("[","").replace("]","") + "}");
			this.oMdlButtons.setJSON("{\"buttons\" : " + JSON.stringify(modelresult) + "}");
			this.getView().setModel(this.oMdlButtons, "buttons");
    }

  });
});
