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

  return Controller.extend("com.apptech.app-retention.controller.PurchaseOrder", {

    onInit: function () {

			//Getting Data From LoginView
			this.Database = jQuery.sap.storage.get("Database");
			this.UserNmae = jQuery.sap.storage.get("Usename");

			//BLANK JSONMODEL FOR ALL BP FOR TEMPLATE
			this.oMdlAllBP = new JSONModel();
			this.oMdlAllBP.getData().allbp = [];

			// Retention
			this.Retention = new JSONModel("model/TaxType.json");
			this.getView().setModel(this.Retention, "Retention");

			//INPUT PO CREATION DATA
			this.POData = new JSONModel("model/POCreation.json");
			this.getView().setModel(this.POData, "POData");

		},
		handleSearchBP: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter("CardCode", FilterOperator.Contains, sValue);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);
		},
		handleValueHelpCloseBatch: function (oEvent) {
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
			this.getView().byId("BPCode").setValue(CardDetails[0].CardCode);
		},
		///BP LIST FROM FRAGMENT
		handleValueBPMaster: function () {
			if (!this._oValueHelpDialogs) {
				Fragment.load({
					name: "com.apptech.app-retention.view.fragments.BPMasterFragment",
					controller: this
				}).then(function (oValueHelpDialogs) {
					this._oValueHelpDialogs = oValueHelpDialogs;
					this.getView().addDependent(this._oValueHelpDialogs);
					this._configValueHelpDialogs();
					this._oValueHelpDialogs.open();
				}.bind(this));
			} else {
				this._configValueHelpDialogs();
				this._oValueHelpDialogs.open();
			}
		},
		_configValueHelpDialogs: function () {
			var Database = this.Database;
			var sInputValue = this.byId("BPCode").getValue();
			if (this.oMdlAllBP.getData().allbp.length <= 0) {
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
					}
				});
			}

			var aList = this.oMdlAllBP.getProperty("/allbp");

			aList.forEach(function (oRecord) {
				oRecord.selected = (oRecord.CardCode === sInputValue);
			});
		},
		// onSave: function () {

		// 	// PURCHASE ORDER POSTING

		// 	var oDatabase = this.Database;

		// 	var Vendor = this.getView().byId("BPCode").getValue();
		// 	var Retention = this.POData.getData().POCreation.Retention;
		// 	var PostingDate = this.getView().byId("DateFrom").getValue();
		// 	var Remarks = this.getView().byId("TextArea").getValue();
		// 	var ContranctAmount = this.POData.getData().POCreation.ContractAmount;

		// 	if (Vendor === "") {
		// 		sap.m.MessageToast.show("Input Data First");
		// 		this.DeleteData();
		// 	} else {

		// 		var oPO = {};
		// 		var oPOLines1 = {};
		// 		var oPOLines2 = {};

		// 		if (Retention === "0") { // YES

		// 			var oContract = Number([ContranctAmount]);

		// 			var oContract2 = oContract * 0.1;
		// 			var Retention = Number([oContract2]); //For Retention

		// 			var oContract3 = oContract - Retention;
		// 			var oCWIP = Number([oContract3]); //For CWIP

		// 			oPO.CardCode = Vendor;
		// 			oPO.DocDate = PostingDate;
		// 			oPO.DocumentLines = [];
		// 			oPO.DocType = "dDocument_Service";
		// 			oPO.U_APP_IsForRetention = "Y";

		// 			oPOLines1.LineNum = 0;
		// 			oPOLines1.AccountCode = 161111; //CWIP
		// 			oPOLines1.UnitPrice = oCWIP;
		// 			oPOLines1.VatGroup = "IVAT-EXC";
		// 			oPOLines1.U_APP_RtnRowType = "C";
		// 			oPO.DocumentLines.push(oPOLines1);

		// 			oPOLines2.LineNum = 1;
		// 			oPOLines2.AccountCode = 242001; //Retention
		// 			oPOLines2.UnitPrice = Retention;
		// 			oPOLines2.VatGroup = "IVAT-EXC";
		// 			oPOLines2.U_APP_RtnRowType = "R";
		// 			oPO.DocumentLines.push(oPOLines2);

		// 			oPO.Comments = Remarks;

		// 			$.ajax({

		// 				url: "/destinations/BiotechSL/b1s/v1/PurchaseOrders",
		// 				type: "POST",
		// 				contentType: "application/json",
		// 				data: JSON.stringify(oPO),
		// 				error: function (xhr, status, error) {
		// 					var Message = xhr.responseJSON["error"].message.value;
		// 					sap.m.MessageToast.show(Message);
		// 				},
		// 				success: function (json) {
		// 					sap.m.MessageToast.show("Added Successfully");
		// 				},
		// 				context: this

		// 			}).done(function (results) {
		// 				if (results) {
		// 					sap.m.MessageToast.show("Added Successfully");
		// 				}

		// 			});

		// 		} else { //NO
				
		// 			var oContract = Number([ContranctAmount]);

		// 			oPO.CardCode = Vendor;
		// 			oPO.DocDate = PostingDate;
		// 			oPO.U_APP_IsForRetention = "Y";
		// 			oPO.DocumentLines = [];
		// 			oPO.DocType = "dDocument_Service";

		// 			oPOLines1.LineNum = 0;
		// 			oPOLines1.AccountCode = 161111; //CWIP
		// 			oPOLines1.UnitPrice = oContract;
		// 			oPOLines1.VatGroup = "IVAT-EXC";
		// 			oPOLines1.U_APP_RtnRowType = "C";
		// 			oPO.DocumentLines.push(oPOLines1);

		// 			oPO.Comments = Remarks;

		// 			$.ajax({

		// 				url: "/destinations/BiotechSL/b1s/v1/PurchaseOrders",
		// 				type: "POST",
		// 				contentType: "application/json",
		// 				data: JSON.stringify(oPO),
		// 				error: function (xhr, status, error) {
		// 					var Message = xhr.responseJSON["error"].message.value;
		// 					sap.m.MessageToast.show(Message);
		// 				},
		// 				success: function (json) {
		// 					sap.m.MessageToast.show("Added Successfully");
		// 				},
		// 				context: this

		// 			}).done(function (results) {
		// 				if (results) {
		// 					sap.m.MessageToast.show("Added Successfully");
		// 				}

		// 			});

		// 		}
		// 		this.DeleteData();
		// 	}

		// },
		DeleteData: function (oEvent) {
			this.byId("BPCode").setValue("");
			this.POData.getData().POCreation.Retention = "";
			this.POData.getData().POCreation.PostingDate = "";
			this.POData.getData().POCreation.Attachment = "";
			this.POData.getData().POCreation.ContractAmount = 0;
			this.byId("fileUploader").setValue("");
			this.getView().byId("TextArea").setValue("");
			this.POData.refresh();
		}

  });
});
