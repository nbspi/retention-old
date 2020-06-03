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

			//Get All Contract and Retention Records
			this.oMdlAllRecords = new JSONModel();
			this.fGetAllRecords("getContractRecords",2);

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
	},	
	fGetAllRecords: function (queryTag,Param) {

		$.ajax({
		  url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database + "&procName=spAppRetention&queryTag=" + queryTag +"&value1=" + Param + "&value2=&value3=&value4=",
		  type: "GET",
		  beforeSend: function(xhr) {
			xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:P@ssw0rd805~"));
		  },
		  error: function(xhr, status, error) {
			MessageToast.show(error);
		  },
		  success: function(json) {},
		  context: this
		}).done(function(results) {
		  if (results) {
			this.oMdlAllRecords.setJSON("{\"allbp\" : " + JSON.stringify(results) + "}");
			this.getView().setModel(this.oMdlAllRecords, "oMdlAllRecords");
		  }
		});
	
	},
	fSelectRetentionTransaction:function (){

		var RetentionRecords = this.getView().byId("selectRecordGroup").getSelectedKey();

		switch(RetentionRecords)
		{
			case "1":
			this.fGetAllRecords("getContractRecords",2);
			break;
			case "2":
			this.fGetAllRecords("getContractRecords",3);
			break;
			case "3":
			this.fGetAllRecords("getContractRecords",4);
			break;
			case "4":
			this.fGetAllRecords("getContractRecords",5);
			break;
		}

	},
	fProcess:function (){

		this.oTable = this.getView().byId("tblTransaction");
		this.oTable.setModel(this.oMdlAllRecord);

		var iIndex = this.oTable.getSelectedIndex();

		var oRowSelected = this.oTable.getBinding().getModel().getData().allbp[this.oTable.getBinding().aIndices[iIndex]];

		this.POData.getData().RetenTransaction.Contractor = oRowSelected.CardName;
		this.POData.getData().RetenTransaction.TransactionNumber = oRowSelected.DocNum;
		this.POData.getData().RetenTransaction.ContractAmount = oRowSelected.DocTotal;
		this.POData.getData().RetenTransaction.PostingDate = oRowSelected.DocDate;
		this.POData.getData().RetenTransaction.ProjectCode = oRowSelected.U_APP_ProjCode;
		this.POData.getData().RetenTransaction.ProgressBIll = oRowSelected.ProgbillRate;
		this.POData.getData().RetenTransaction.RetenYCWIP = oRowSelected.U_APP_CWIP;
		this.POData.getData().RetenTransaction.RetenNCWIP = oRowSelected.U_APP_YCWIP;
		this.POData.getData().RetenTransaction.GrossAmount = oRowSelected.U_APP_GrossAmount;
		this.POData.getData().RetenTransaction.ProratedReten = oRowSelected.U_APP_ProRetention;
		this.POData.getData().RetenTransaction.ProgBillAmount = oRowSelected.U_APP_ProgBillAmount;
		this.POData.getData().RetenTransaction.ProratedDP = oRowSelected.U_APP_ProratedDP;
		this.POData.refresh();

		var otab1 = this.getView().byId("idIconTabBarInlineMode");
		otab1.setSelectedKey("tab2");    

	},
	fPrint:function (){

		var Contractor = "";
		var TransactionNumber = "";
		var ContractAmount = "";
		var PostingDate = "";
		var ProjectCode = "";
		var ProgressBIll = "";
		var RetenYCWIP =  "";
		var RetenNCWIP = "";
		var GrossAmount = "";
		var ProratedReten = "";
		var ProgBillAmount = "";
		var ProratedDP = "";


		Contractor = this.POData.getData().RetenTransaction.Contractor;
		TransactionNumber = this.POData.getData().RetenTransaction.TransactionNumber;
		ContractAmount = this.getView().byId("CntAmount").getValue();
		PostingDate = this.POData.getData().RetenTransaction.PostingDate;
		ProjectCode = this.POData.getData().RetenTransaction.ProjectCode;
		ProgressBIll = this.POData.getData().RetenTransaction.ProgressBIll;
		RetenYCWIP = this.getView().byId("RetYCwip").getValue();
		RetenNCWIP = this.getView().byId("RetNCwip").getValue();
		GrossAmount = this.getView().byId("GrossAmnt").getValue();
		ProratedReten =  this.getView().byId("ProReten").getValue();
		ProgBillAmount =  this.getView().byId("ProgBillAmnt").getValue();
		ProratedDP =  this.getView().byId("ProDP").getValue();

		var doc = new jsPDF('landscape');
		// doc.text(20, 20, 'Hello world.');
		doc.autoTable({html:'#tblTransaction'});
		doc.autoTable({
			head: [['Contractor','Transaction Number','Contract Amount','Posting Date','Project Code','Progress Bill','Retention Yes CWIP']],
			body: [
				[Contractor,TransactionNumber,ContractAmount,PostingDate,ProjectCode,ProgressBIll,RetenYCWIP],
			]
		});
		doc.autoTable({
			head: [['Retention No CWIP','Gross Amount','Prorated Retention','Progress Billing Amount','Prorated DP']],
			body: [
				[RetenNCWIP,GrossAmount,ProratedReten,ProgBillAmount,ProratedDP],
			]
		});
		// doc.text(20, 20, 'Hello world.');
		doc.save('Test.pdf');
	}

  });
});
 