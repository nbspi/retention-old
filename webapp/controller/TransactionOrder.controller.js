sap.ui.define([
	'sap/m/MessageBox',
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (MessageBox, Controller, JSONModel, Fragment, MessageToast, Filter, FilterOperator) {
	"use strict";

  return Controller.extend("com.apptech.app-retention.controller.TransactionOrder", {

    onInit:function(){

      //Getting Data From LoginView
			this.Database = jQuery.sap.storage.get("Database");
			this.UserName = jQuery.sap.storage.get("Usename");

			//BLANK JSONMODEL FOR ALL BP FOR TEMPLATE
			this.oMdlAllBP = new JSONModel();
			this.oMdlAllBP.getData().allbp = [];

			// Retention
			this.Retention = new JSONModel("model/TaxType.json");
			this.getView().setModel(this.Retention, "Retention");

			//INPUT PO CREATION DATA
			this.POData = new JSONModel("model/POCreation.json");
			this.getView().setModel(this.POData, "POData");

			// FilterGrid
			this.oFilter = new JSONModel("model/GridFilter.json");
			this.getView().setModel(this.oFilter, "oFilter");

			//INPUT PO CREATION DATA
			this.POData = new JSONModel("model/POCreation.json");
			this.getView().setModel(this.POData, "POData");

			this.tableId = "tblTransaction";
			this.oFilterPurchaseOrderTransaction("getUDTCPOR");
			// this.oGetTransactionNumber();
			this.DraftCode = "";
			this.oPOStatus = "";


    },
    onSelectPurchaseTransaction: function (){

      var PoStatus = this.getView().byId("selectRecordGroup").getSelectedKey();

      if (PoStatus === "0") {
        this.oFilterPurchaseOrderTransaction("getUDTCPOR");
				this.getView().byId("btn1").setEnabled(true);
				this.getView().byId("btn2").setEnabled(true);
        this.DisableFields("1");
        this.oFilter.getData().Process.ProcName = "Process";
				this.oFilter.refresh();
			} else {
        this.oFilterPurchaseOrderTransaction("getPOTransactions");
				this.getView().byId("btn1").setEnabled(false);
				this.getView().byId("btn2").setEnabled(false);
        this.DisableFields("0");
        this.oFilter.getData().Process.ProcName = "View";
				this.oFilter.refresh();
      }
      

    },
    DisableFields: function (Status) {

			if (Status === "0") {
				this.getView().byId("BPCode").setEnabled(false);
				this.getView().byId("Docnum").setEnabled(false);
				this.getView().byId("Retention").setEnabled(false);
				this.getView().byId("DateFrom").setEnabled(false);
				this.getView().byId("CntAmount").setEnabled(false);
				this.getView().byId("fileUploader").setEnabled(false);
				this.getView().byId("TextArea").setEnabled(false);

			} else {

				this.getView().byId("BPCode").setEnabled(true);
				this.getView().byId("Docnum").setEnabled(false);
				this.getView().byId("Retention").setEnabled(true);
				this.getView().byId("DateFrom").setEnabled(true);
				this.getView().byId("CntAmount").setEnabled(true);
				this.getView().byId("fileUploader").setEnabled(true);
				this.getView().byId("TextArea").setEnabled(true);

			}

    },
    oFilterPurchaseOrderTransaction: function (queryTag) {

			this.oModelOpenPO = new JSONModel();
			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database + "&procName=spAppRetention&queryTag=" + queryTag +
					"&value1=&value2=&value3=&value4=",
          type: "GET",
          beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:P@ssw0rd805~"));
            },
          error: function (xhr, status, error) {
            MessageToast.show(error);
          },
          success: function (json) {},
          context: this
			}).done(function (results) {
				if (results) {
					this.oModelOpenPO.setJSON("{\"allbp\" : " + JSON.stringify(results) + "}");
					this.getView().setModel(this.oModelOpenPO, "oModelOpenPO");
				}
			});

		}

  });
});
