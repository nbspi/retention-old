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

	_data : {
		"number" : ""
	},
	ContractAmount: function (){

		var oContractValue = this.byId("CntAmount").getValue();
		this.POData.getData().POCreation.ContractAmount = oContractValue;
		this.POData.refresh();
		
	},
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
			this.oGetTransactionNumber();
			this.DraftCode = "";
			this.oPOStatus = "";


	},
	IconTabSelect: function () {
		var Tab = this.getView().byId("idIconTabBarInlineMode").getSelectedKey();

		if (Tab === "tab1") {
			this.onRefresh();
			this.oGetTransactionNumber();
			this.Retention.getData().POCount.PONum = "";
			this.Retention.refresh();
		}
	},
	onRefresh: function () {
		var PoStatus = this.getView().byId("selectRecordGroup").getSelectedKey();

		if (PoStatus === "0") {
			this.oFilterPurchaseOrderTransaction("getUDTCPOR");
		} else {
			this.oFilterPurchaseOrderTransaction("getPOTransactions");
		}
		this.DeleteData();
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
				beforeSend: function(xhr) {
					xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:P@ssw0rd805~"));
				},
				error: function(xhr, status, error) {
					MessageToast.show(error);
				},
				success: function(json) {},
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
	oGetTransactionNumber: function () {

		var oDatabase = this.Database;

		// Viewing Transaction Number
		this.oTransIDs = new JSONModel();
		$.ajax({
		    url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + oDatabase +
		    "&procName=spAppRetention&queryTag=getPODraftCount&value1=&value2=&value3=&value4=",
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
		        this.POData.getData().POCreation.DocumentNum = results[0].DocNum;
		        this.POData.refresh();
		    }
		});
	},
    onSelectPurchaseTransaction: function() {

		var PoStatus = this.getView().byId("selectRecordGroup").getSelectedKey();
	
		if (PoStatus === "0") {
			this.oFilterPurchaseOrderTransaction("getUDTCPOR");
			this.getView().byId("btn1").setEnabled(false);
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
	onProcess: function () {

		var that = this;
		that.oTable = that.getView().byId(that.tableId);
		that.oTable.setModel(that.oMdlAllRecord);

		var iIndex = this.oTable.getSelectedIndex();
		var sCode = "";

		var oRowSelected = that.oTable.getBinding().getModel().getData().allbp[that.oTable.getBinding().aIndices[iIndex]];
		this.STatus = oRowSelected.DocStatus;
		this.oSCode = oRowSelected.DocEntry;
		this.DocNum = oRowSelected.DocNum;

		var oPoStatus = this.getView().byId("selectRecordGroup").getSelectedKey();

		if (oPoStatus === "0") {
		    this.oGetDatafromHeaderUDT(this.DocNum);
		} else {
		    this.oGetDatafromPO(this.oSCode);
		}

		var otab1 = this.getView().byId("idIconTabBarInlineMode");
		otab1.setSelectedKey("tab2");

	},
	oGetDatafromHeaderUDT: function (sCode) {
		$.ajax({
			url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database +
				"&procName=spAppRetention&queryTag=getDataUDTCPOR&value1=" +
				sCode + "&value2=&value3=&value4=",
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
			// var oDownPayment = oDowPayment1.toFixed(2);
			this.Retention.getData().POCount.PONum = results[0].DocNum;
			this.Retention.refresh();
			this.DraftCode = results[0].Code;
			this.byId("BPCode").setValue(results[0].CardName);
			this.byId("Docnum").setValue(results[0].DocNum);
			this.byId("DateFrom").setValue(results[0].DocDate);
			var DocTototal = results[0].DocTotal;
			var oDocTotal = Number([DocTototal]);
			var ooDocTotal = oDocTotal.toFixed(2);
			this.byId("CntAmount").setValue(ooDocTotal);
			this.getView().byId("TextArea").setValue(results[0].Remarks);
			this.getView().byId("Retention").setSelectedKey(results[0].Retention);
			this.oMdlAllBP.getData().allbp.Vendor = results[0].CardName;
			this.oMdlAllBP.refresh();
			this.oPOStatus = results[0].DocStatus;
		});
	},
	oGetDatafromPO: function (sCode) {
		$.ajax({
			url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database +
				"&procName=spAppRetention&queryTag=getDataPOTransactions&value1=" +
			sCode + "&value2=&value3=&value4=",
			type: "GET",
			beforeSend: function(xhr) {
				xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:P@ssw0rd805~"));
			},
			error: function(xhr, status, error) {
				MessageToast.show(error);
			},
			success: function(json) {},
			context: this
		}).done(function (results) {
			// var oDownPayment = oDowPayment1.toFixed(2);
			this.Retention.getData().POCount.PONum = results[0].DocNum;
			this.Retention.refresh();
			this.byId("BPCode").setValue(results[0].CardName);
			this.byId("Docnum").setValue(results[0].DocNum);
			this.byId("DateFrom").setValue(results[0].DocDate);
			var DocTototal = results[0].DocTotal;
			var oDocTotal = Number([DocTototal]);
			var ooDocTotal = oDocTotal.toFixed(2);
			this.byId("CntAmount").setValue(ooDocTotal);
			this.getView().byId("TextArea").setValue(results[0].Comments);
			this.getView().byId("Retention").setSelectedKey(results[0].Retention);
			this.oMdlAllBP.getData().allbp.Vendor = results[0].CardName;
			this.oMdlAllBP.refresh();
		});
	},
	DeleteData: function (oEvent) {
		this.byId("BPCode").setValue("");
		this.byId("fileUploader").setValue("");
		this.getView().byId("TextArea").setValue("");
		this.byId("CntAmount").setValue("");

		this.POData.getData().POCreation.Retention = "";
		this.POData.getData().POCreation.PostingDate = "";
		this.POData.getData().POCreation.Attachment = "";
		this.POData.getData().POCreation.ContractAmount = 0;
		this.POData.refresh();

		this.oMdlAllBP.getData().allbp.Vendor = "";
		this.oMdlAllBP.refresh();
		this.oGetTransactionNumber();
	},
	getTodaysDate: function () {
		var today = new Date();
		var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
		return date;
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
				this.oModelOpenPO.setJSON("{\"allbp\" : " + JSON.stringify(results) + "}");
				this.getView().setModel(this.oModelOpenPO, "oModelOpenPO");
			}
		});

	},
	onSave: function () {

		// PURCHASE ORDER POSTING

		var oDatabase = this.Database;

		var Vendor = this.getView().byId("BPCode").getValue();
		var Retention = this.POData.getData().POCreation.Retention;
		var PostingDate = this.getView().byId("DateFrom").getValue();
		var Remarks = this.getView().byId("TextArea").getValue();
		var ContranctAmount = this.POData.getData().POCreation.ContractAmount;

		if (Vendor === "") {
			sap.m.MessageToast.show("Input Data First");
			this.DeleteData();
		} else {

			var oPO = {};
			var oPOLines1 = {};
			var oPOLines2 = {};

			if (Retention === "0") { // YES

				var oContract = Number([ContranctAmount.replace(',','.')]);

				var oContract2 = oContract * 0.1;
				var Retention = Number([oContract2]); //For Retention

				var oContract3 = oContract - Retention;
				var oCWIP = Number([oContract3]); //For CWIP

				oPO.CardCode = Vendor;
				oPO.DocDate = PostingDate;
				oPO.DocumentLines = [];
				oPO.DocType = "dDocument_Service";
				oPO.U_APP_IsForRetention = "Y";
				oPO.U_APP_Retention = "Y";

				oPOLines1.LineNum = 0;
				oPOLines1.AccountCode = 161111; //CWIP
				oPOLines1.UnitPrice = oCWIP;
				oPOLines1.VatGroup = "IVAT-EXC";
				oPOLines1.U_APP_RtnRowType = "C";
				oPO.DocumentLines.push(oPOLines1);

				oPOLines2.LineNum = 1;
				oPOLines2.AccountCode = 242001; //Retention
				oPOLines2.UnitPrice = Retention;
				oPOLines2.VatGroup = "IVAT-EXC";
				oPOLines2.U_APP_RtnRowType = "R";
				oPO.DocumentLines.push(oPOLines2);

				oPO.Comments = Remarks;

				$.ajax({

					url: "https://18.136.35.41:50000/b1s/v1/PurchaseOrders",
					data: JSON.stringify(oPO),
					type: "POST",
					xhrFields: {
						withCredentials: true
					},
					error: function (xhr, status, error) {
						var Message = xhr.responseJSON["error"].message.value;
						sap.m.MessageToast.show(Message);
					},
					context: this,
					success: function (json) {
						sap.m.MessageToast.show("Added Successfully");
					}
					}).done(function (results) {
					if (results) {
						sap.m.MessageToast.show("Added Successfully");

						if (this.oPOStatus === "Draft") {
							this.oUPdate();
						}
					}

				});


			} else { //NO

				var oContract = Number([ContranctAmount.replace(',','.')]);

				oPO.CardCode = Vendor;
				oPO.DocDate = PostingDate;
				oPO.U_APP_IsForRetention = "Y";
				oPO.DocumentLines = [];
				oPO.DocType = "dDocument_Service";
				oPO.U_APP_Retention = "N";

				oPOLines1.LineNum = 0;
				oPOLines1.AccountCode = 161111; //CWIP
				oPOLines1.UnitPrice = oContract;
				oPOLines1.VatGroup = "IVAT-EXC";
				oPOLines1.U_APP_RtnRowType = "C";

				oPO.DocumentLines.push(oPOLines1);

				oPO.Comments = Remarks;

				$.ajax({

					url: "https://18.136.35.41:50000/b1s/v1/PurchaseOrders",
					data: JSON.stringify(oPO),
					type: "POST",
					xhrFields: {
						withCredentials: true
					},
					error: function (xhr, status, error) {
						var Message = xhr.responseJSON["error"].message.value;
						sap.m.MessageToast.show(Message);
					},
					context: this,
					success: function (json) {
						sap.m.MessageToast.show("Added Successfully");
					}
					}).done(function (results) {
					if (results) {
						sap.m.MessageToast.show("Added Successfully");

						if (this.oPOStatus === "Draft") {
							this.oUPdate();
						}

					}

				});

			}
			this.DeleteData();
		}

	},
	onDraft: function () {

		var oCode = this.DraftCode;

		var oPo = {};

		oPo.U_App_Vendor = this.oMdlAllBP.getData().allbp.Vendor;
		oPo.U_App_Retention = this.POData.getData().POCreation.Retention;
		oPo.U_App_PostDate = this.POData.getData().POCreation.PostingDate;
		oPo.U_App_ConAmount = this.POData.getData().POCreation.ContractAmount;
		oPo.U_App_Remarks = this.getView().byId("TextArea").getValue();
		// oDraft.U_App_File = "";
		oPo.U_App_CreatedDate = this.getTodaysDate();
		oPo.U_App_CreatedBy = this.UserName;

		$.ajax({
			url: "https://18.136.35.41:50000/b1s/v1/U_APP_CPOR('" + oCode + "')",
			data: JSON.stringify(oPo),
			type: "PATCH",
			xhrFields: {
				withCredentials: true
			},
			error: function (xhr, status, error) {
				var Message = xhr.responseJSON["error"].message.value;
				sap.m.MessageToast.show(Message);
			},
			context: this,
			success: function (json) {
				sap.m.MessageToast.show("Updated Successfully");
			}
		}).done(function (results1) {
			if (results1) {
				sap.m.MessageToast.show("Updated Successfully");
			}
		});
		this.DeleteData();
	},

  });
});
