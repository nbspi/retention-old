sap.ui.define([
	'sap/m/MessageBox',
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"com/apptech/app-retention/controller/AppUI5",
	"sap/ui/core/BusyIndicator"
], function (MessageBox, Controller, JSONModel, Fragment, MessageToast, Filter, FilterOperator,AppUI5,BusyIndicator) {
	"use strict";

  return Controller.extend("com.apptech.app-retention.controller.ContractReport", {

    onInit: function () {

	  //BLANK JSONMODEL FOR ALL BP FOR TEMPLATE
			this.oMdlAllBP = new JSONModel(); //
			this.oMdlAllBP.getData().allbp = [];
	  //BLANK JSONMODEL FOR ALL PROJECT CODE FOR TEMPLATE
	        this.oMdlAllProject = new JSONModel(); 
	        this.oMdlAllProject.getData().allbp = [];

	  //INPUT Contract Paramaters Model
		 	this.Contract = new JSONModel("model/ContractReport.json");
		  	this.getView().setModel(this.Contract, "Contract");	

      //Getting Data From LoginView
			this.Database = jQuery.sap.storage.get("Database");
			this.UserName = jQuery.sap.storage.get("Usename");
      
      //getButtons
			this.oMdlButtons = new JSONModel();
			this.oResults = AppUI5.fGetButtons(this.Database,this.UserName,"contractreport");
			var newresult = [];
				  this.oResults.forEach((e)=> {
					  var d = {};
					  d[e.U_ActionDesc] = JSON.parse(e.visible);
					  newresult.push(JSON.parse(JSON.stringify(d)));
				  });
			var modelresult = JSON.parse("{" + JSON.stringify(newresult).replace(/{/g,"").replace(/}/g,"").replace("[","").replace("]","") + "}");
			this.oMdlButtons.setJSON("{\"buttons\" : " + JSON.stringify(modelresult) + "}");
			this.getView().setModel(this.oMdlButtons, "buttons");

		//Vendor Code
		    this.VendorCode = "";


	},
	Export:function(){

		var doc = new jsPDF();
		doc.text(20, 20, 'Hello world.');
		doc.output('Test.pdf');

		// doc.save('Test.pdf');

	},


	
	//----------------------- Business Partner -------------------//
	//BP Search Fragment
	onHandleSearchBP: function (oEvent) {
		var sValue = oEvent.getParameter("value");
		var oFilter = new Filter("CardName", FilterOperator.Contains, sValue);
		var oBinding = oEvent.getSource().getBinding("items");
		oBinding.filter([oFilter]);
	},
	//BP Close Fragment
	onHandleValueHelpCloseBatch: function (oEvent) {
		var aContexts = oEvent.getParameter("selectedContexts");
		var CardDetails = {};
		if (aContexts && aContexts.length) {

			CardDetails = aContexts.map(function (oContext) {
				var oCard = {};
				oCard.CardCode = oContext.getObject().CardCode;
				oCard.CardName = oContext.getObject().CardName;
				return oCard;
			});
		}
		oEvent.getSource().getBinding("items").filter([]);
		this.VendorCode = CardDetails[0].CardCode;
		this.getView().byId("BPCode").setValue(CardDetails[0].CardName);
	},
	///BP LIST FROM FRAGMENT
	onHandleValueBPMaster: function () {
			Fragment.load({
				name: "com.apptech.app-retention.view.fragments.BPMasterFragment",
				controller: this
			}).then(function (oValueHelpDialogs) {
				this._oValueHelpDialogs = oValueHelpDialogs;
				this.getView().addDependent(this._oValueHelpDialogs);
				this.fConfigValueHelpDialogs();
				this._oValueHelpDialogs.open();
			}.bind(this));
	},
	//BP Fragment Dialog Configuration
	fConfigValueHelpDialogs: function () {
		var Database = this.Database;
		var sInputValue = this.byId("BPCode").getValue();

			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + Database +
					"&procName=spAppRetention&queryTag=getBPMaster&value1=&value2=&value3=&value4=",
				type: "GET",
				dataType: "json",
			  beforeSend: function (xhr) {
				xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:P@ssw0rd805~"));
			  },
				error: function (xhr, status, error) {
					// var Message = xhr.responseJSON["error"].message.value;
					sap.m.MessageToast.show(error);
				},
				success: function (json) {},
				context: this
			}).done(function (results) {
				if (results) {
					this.oMdlAllBP.getData().allbp = results;
					this.getView().setModel(this.oMdlAllBP, "oMdlAllBP");
					this.oMdlAllBP.refresh();

					var aList = this.oMdlAllBP.getProperty("/allbp");

					aList.forEach(function (oRecord) {
						oRecord.selected = (oRecord.CardCode === sInputValue);
					});

				}
			});

	},
	//----------------- Business Partner END -------------------//

	//------------------- Project Code ---------------------//
	onHandleSearchProjCode: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter("ProjectCode", FilterOperator.Contains, sValue);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);
	},
	onHandleValueProjCode: function (){
				Fragment.load({
					name: "com.apptech.app-retention.view.fragments.ProjCodeFragment",
					controller: this
				}).then(function (ValueHelpDialogs) {
	
					this._ValueHelpDialogs = ValueHelpDialogs;
					this.getView().addDependent(this._ValueHelpDialogs);
					this.fConfigValueHelpProjDialogs();
					this._ValueHelpDialogs.open();
				}.bind(this));
	},
	fConfigValueHelpProjDialogs: function () {
			var Database = this.Database;
			var sInputValue = this.byId("BPCode").getValue();
	
				$.ajax({
					url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + Database +
						"&procName=spAppRetention&queryTag=getAllActiveProjectCode&value1=&value2=&value3=&value4=",
					type: "GET",
					dataType: "json",
				  beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:P@ssw0rd805~"));
				  },
					error: function (xhr, status, error) {
						// var Message = xhr.responseJSON["error"].message.value;
						sap.m.MessageToast.show(error);
					},
					success: function (json) {},
					context: this
				}).done(function (results) {
					if (results) {
						this.oMdlAllProject.getData().allbp = results;
						this.getView().setModel(this.oMdlAllProject, "oMdlAllProject");
	
						var aList = this.oMdlAllProject.getProperty("/allbp");
						this.oMdlAllProject.refresh();
	
						aList.forEach(function (oRecord) {
							oRecord.selected = (oRecord.ProjectCode === sInputValue);
						});
	
					}
				});
	
	},
	onHandleValueHelpProjCloseBatch: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			var CardDetails = {};
			if (aContexts && aContexts.length) {
	
				CardDetails = aContexts.map(function (oContext) {
					var oCard = {};
					oCard.ProjectCode = oContext.getObject().ProjectCode;
					oCard.ProjectName = oContext.getObject().ProjectName;
					return oCard;
				});
			}
			oEvent.getSource().getBinding("items").filter([]);
			this.fConfigValueHelpProjDialogs();
			this.getView().byId("ProjCode").setValue(CardDetails[0].ProjectCode);
	},
	//------------------- Project Code End -----------------//



  });
});
