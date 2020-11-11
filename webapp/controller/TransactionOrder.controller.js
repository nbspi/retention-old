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

  return Controller.extend("com.apptech.app-retention.controller.TransactionOrder", {

	_data : {
		"number" : ""
	},
	// Contract Amount Value
	fContractAmount: function (){

		var oContractValue = this.byId("CntAmount").getValue();
		this.POData.getData().POCreation.ContractAmount = oContractValue;
		this.POData.refresh();
		
	},
    onInit:function(){

		var oModel = new JSONModel(this._data);
		this.getView().setModel(oModel);

      		//Getting Data From LoginView
			this.Database = jQuery.sap.storage.get("Database");
			this.UserName = jQuery.sap.storage.get("Usename");

			//BLANK JSONMODEL FOR ALL BP FOR FRAGMENT
			this.oMdlAllBP = new JSONModel();
			this.oMdlAllBP.getData().allbp = [];

			//BLANK JSONMODEL FOR ALL PROJECTS FOR FRAGMENT			
			this.oMdlAllProject = new JSONModel(); 
			this.oMdlAllProject.getData().allbp = [];

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
			this.fFilterPurchaseOrderTransaction("getUDTCPOR");
			this.fGetTransactionNumber();
			this.DraftCode = "";
			this.oPOStatus = "";
			this.VendorCode = "";
			//Get PO DocEntry 
			this.PODocEnrty = "";

			//CPA
			this.currentFile = {}; //File Object
			//Get File / Attachment Key
			this.FileKey = null;

			//getButtons
			this.oMdlButtons = new JSONModel();
			this.oResults = AppUI5.fGetButtons(this.Database,this.UserName,"transactionrecords");
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
	// Icon Tab Selector
	fIconTabSelect: function () {
		var Tab = this.getView().byId("idIconTabBarInlineMode").getSelectedKey();

		if (Tab === "tab1") {
			this.fRefresh();
			this.fGetTransactionNumber();
			this.Retention.getData().POCount.PONum = "";
			this.Retention.refresh();
			this.fSelectPurchaseTransaction();

		} else {
			this.getView().byId("btnTransUpdate").setEnabled(false);
		}
	},
	// Refresh Fields
	fRefresh: function () {
		var PoStatus = this.getView().byId("selectRecordGroup").getSelectedKey();

		if (PoStatus === "0") {
			this.fFilterPurchaseOrderTransaction("getUDTCPOR");
		} else {
			this.fFilterPurchaseOrderTransaction("getPOTransactions");
		}
		this.fDeleteData();
	},

	//--------------------- Business Partner Fragment -----------------//
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
		this.getView().byId("BPCode").setValue(CardDetails[0].CardName);
		this.VendorCode = CardDetails[0].CardCode;
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
				url: "https://xs.biotechfarms.net/app_xsjs/ExecQuery.xsjs?dbName=" + Database +
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
					this.oMdlAllBP.refresh();

					var aList = this.oMdlAllBP.getProperty("/allbp");

					aList.forEach(function (oRecord) {
						oRecord.selected = (oRecord.CardCode === sInputValue);
					});

				}
			});
	},
	//---------------------- Business Partner Fragmenr End -----------------//

	// To Get Transaction Number
	fGetTransactionNumber: function () {

		var oDatabase = this.Database;

		// Viewing Transaction Number
		this.oTransIDs = new JSONModel();
		$.ajax({
		    url: "https://xs.biotechfarms.net/app_xsjs/ExecQuery.xsjs?dbName=" + oDatabase +
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
	// Selection of PO Transaction
    fSelectPurchaseTransaction: function() {

		var PoStatus = this.getView().byId("selectRecordGroup").getSelectedKey();
	
		if (PoStatus === "0") {
			this.fFilterPurchaseOrderTransaction("getUDTCPOR");
			this.fDisableFields("1");
			this.oFilter.getData().Process.ProcName = "Process";
			this.oFilter.refresh();
			// this.getView().byId("btnTransCancel").setVisible(false);
			// this.getView().byId("btnTransPrint").setVisible(false);
		} else if (PoStatus === "1"){
			this.fFilterPurchaseOrderTransaction("getAllUnprocessedPO");
			this.getView().byId("btnTransUpdate").setEnabled(false);
			this.getView().byId("btnTransAdd").setEnabled(false);
			this.fDisableFields("0");
			this.oFilter.getData().Process.ProcName = "View";
			this.oFilter.refresh();
			// this.getView().byId("btnTransCancel").setVisible(true);
			// this.getView().byId("btnTransPrint").setVisible(true);
		} else {
			this.fFilterPurchaseOrderTransaction("getSubsequentBilling");
			this.getView().byId("btnTransUpdate").setEnabled(false);
			this.getView().byId("btnTransAdd").setEnabled(false);
			this.fDisableFields("0");
			this.oFilter.getData().Process.ProcName = "View";
			this.oFilter.refresh();
			// this.getView().byId("btnTransCancel").setVisible(false);
			// this.getView().byId("btnTransPrint").setVisible(false);
		}
	
	},
	// Process PO
	fProcess: function () {
		var that = this;
		that.oTable = that.getView().byId(that.tableId);
		that.oTable.setModel(that.oMdlAllRecord);

		var iIndex = this.oTable.getSelectedIndex();
		var sCode = "";

		var oRowSelected = that.oTable.getBinding().getModel().getData().allbp[that.oTable.getBinding().aIndices[iIndex]];
		this.STatus = oRowSelected.DocStatus;
		this.oSCode = oRowSelected.DocEntry;
		this.DocNum = oRowSelected.DocNum;
		this.oPOStatus = oRowSelected.oDocStatus;

		var oPoStatus = this.getView().byId("selectRecordGroup").getSelectedKey();

		if (oPoStatus === "0") {
			this.fGetDatafromHeaderUDT(this.DocNum);
			this.getView().byId("btnTransUpdate").setEnabled(true);
			this.getView().byId("btnTransAdd").setEnabled(true);
		} else if (oPoStatus === "1") {
			this.fGetDatafromPO(this.oSCode);
			this.getView().byId("btnTransAdd").setEnabled(false);
		} else {
			this.fGetDatafromPO(this.oSCode);
			this.getView().byId("btnTransAdd").setEnabled(false);
		}

		var otab1 = this.getView().byId("idIconTabBarInlineMode");
		otab1.setSelectedKey("tab2");

	},
	// Get Header Data In UDT
	fGetDatafromHeaderUDT: function (sCode) {
		$.ajax({
			url: "https://xs.biotechfarms.net/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database +
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
			this.getView().byId("Progressive").setSelectedKey(results[0].Progressive);	
			this.getView().byId("ProjCode").setSelectedKey(results[0].ProjectCode);			
			this.getView().byId("fileUploader").setValue(results[0].File);
			this.oMdlAllBP.getData().allbp.Vendor = results[0].CardName;
			this.oMdlAllBP.refresh();
			this.POData.getData().POCreation.Progressive = results[0].Progressive;
			this.POData.getData().POCreation.ProjectCode = results[0].ProjectCode;
			this.POData.getData().POCreation.ContractAmount = ooDocTotal;
			this.POData.refresh();
			this.VendorCode = results[0].CardCode;
			//this.oPOStatus = results[0].DocStatus;
			this.FileKey = Number([results[0].FileKey]);
		});
	},
	// To get PO Datas
	fGetDatafromPO: function (sCode) {
		$.ajax({
			url: "https://xs.biotechfarms.net/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database +
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
			this.getView().byId("Progressive").setSelectedKey(results[0].Progressive);	
			this.getView().byId("ProjCode").setValue(results[0].ProjectCode);	
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
	//Delete Data
	fDeleteData: function (oEvent) {
		this.byId("BPCode").setValue("");
		this.byId("fileUploader").setValue("");
		this.getView().byId("TextArea").setValue("");
		this.byId("CntAmount").setValue("");

		this.POData.getData().POCreation.Retention = "";
		this.POData.getData().POCreation.PostingDate = "";
		this.POData.getData().POCreation.Attachment = "";
		this.POData.getData().POCreation.Progressive = "";
		this.POData.getData().POCreation.ProjectCode = "";
		this.POData.getData().POCreation.ContractAmount = 0;
		this.POData.refresh();
		this.VendorCode = "";

		this.oMdlAllBP.getData().allbp.Vendor = "";
		this.oMdlAllBP.refresh();
		this.fGetTransactionNumber();

		this.FileKey = null;
	},
	// To get Date Today
	fGetTodaysDate: function () {
		var today = new Date();
		var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
		return date;
	},
	// For Disable Fields
    fDisableFields: function (Status) {

			if (Status === "0") {
				this.getView().byId("BPCode").setEnabled(false);
				this.getView().byId("Docnum").setEnabled(false);
				this.getView().byId("Retention").setEnabled(false);
				this.getView().byId("DateFrom").setEnabled(false);
				this.getView().byId("CntAmount").setEnabled(false);
				this.getView().byId("fileUploader").setEnabled(false);
				this.getView().byId("TextArea").setEnabled(false);
				this.getView().byId("Progressive").setEnabled(false);
				this.getView().byId("ProjCode").setEnabled(false);

			} else {

				this.getView().byId("BPCode").setEnabled(true);
				this.getView().byId("Docnum").setEnabled(false);
				this.getView().byId("Retention").setEnabled(true);
				this.getView().byId("DateFrom").setEnabled(true);
				this.getView().byId("CntAmount").setEnabled(true);
				this.getView().byId("fileUploader").setEnabled(true);
				this.getView().byId("TextArea").setEnabled(true);
				this.getView().byId("Progressive").setEnabled(true);
				this.getView().byId("ProjCode").setEnabled(true);

			}

	},
	// To get Data of Selectede PO in Grid
    fFilterPurchaseOrderTransaction: function (queryTag) {

		this.oModelOpenPO = new JSONModel();
		$.ajax({
			url: "https://xs.biotechfarms.net/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database + "&procName=spAppRetention&queryTag=" + queryTag +
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
	//Purchase Order Posting
	fSave: function () {
		this.fShowBusyIndicator(4000, 0);
		var oDatabase = this.Database;

		var TransCode = this.getView().byId("Docnum").getValue();
		var oVendor = this.VendorCode;
		var oRetention = this.POData.getData().POCreation.Retention;
		var oPostingDate = this.getView().byId("DateFrom").getValue();
		var oRemarks = this.getView().byId("TextArea").getValue();
		var oContranctAmount = this.byId("CntAmount").getValue();
		var ProjectCode = this.getView().byId("ProjCode").getValue();

		if (oVendor === "") {
			sap.m.MessageToast.show("Input Data First");
			this.fHideBusyIndicator();
			// this.fDeleteData();
		} else if (oContranctAmount === "" || oContranctAmount === 0 ){
			sap.m.MessageToast.show("Input Data First");
			this.fHideBusyIndicator();
			// this.fDeleteData();
		} else if (ProjectCode === "" ){
			sap.m.MessageToast.show("Input Project Code");
			this.fHideBusyIndicator();
		} else {

			var oPO = {};
			var oPOLines1 = {};
			var oPOLines2 = {};

			if (oRetention === "0") { // YES
				var poContract = oContranctAmount.replace(/,/g, '',/./g,'');
				var oContract = Number([poContract]);

				var oContract2 = oContract * 0.1;
				var iRetention = Number([oContract2]); //For Retention

				var oContract3 = oContract - iRetention;
				var oCWIP = Number([oContract3]); //For CWIP

				oPO.CardCode = oVendor;
				oPO.DocDate = oPostingDate;
				oPO.DocumentLines = [];
				oPO.DocType = "dDocument_Service";
				oPO.U_APP_IsForRetention = "Y";
				oPO.U_APP_Retention = "Y";
				if (this.FileKey !== 0){
					oPO.AttachmentEntry = this.FileKey;
				}
				oPO.U_APP_ProjCode = this.POData.getData().POCreation.ProjectCode;

				if (this.POData.getData().POCreation.Progressive === "0" ){
					oPO.U_APP_Progressive = "Yes";
				}else{
					oPO.U_APP_Progressive = "No" ;
				}

				oPOLines1.LineNum = 0;
				oPOLines1.AccountCode = this.fGetGLAccount("getCWIPGLAccountOnly",1); //CWIP
				oPOLines1.UnitPrice = oCWIP;
				oPOLines1.VatGroup = "IVAT-EXC";
				oPOLines1.U_APP_RtnRowType = "C";
				oPOLines1.ProjectCode = this.POData.getData().POCreation.ProjectCode;
				oPO.DocumentLines.push(oPOLines1);

				oPOLines2.LineNum = 1;
				oPOLines2.AccountCode = this.fGetGLAccount("getRPGLAccountOnly",1); //Retention
				oPOLines2.UnitPrice = iRetention;
				oPOLines2.VatGroup = "IVAT-EXC";
				oPOLines2.U_APP_RtnRowType = "R";
				oPOLines2.ProjectCode = this.POData.getData().POCreation.ProjectCode;
				oPO.DocumentLines.push(oPOLines2);

				oPO.Comments = oRemarks;

				$.ajax({
					//Posting PO in SAP
					url: "https://sl.biotechfarms.net/b1s/v1/PurchaseOrders",
					data: JSON.stringify(oPO),
					type: "POST",
					xhrFields: {
						withCredentials: true
					},
					error: function (xhr, status, error) {
						var ErrorMassage = xhr.responseJSON["error"].message.value;
						sap.m.MessageToast.show(ErrorMassage);
						this.fHideBusyIndicator();
						console.error(ErrorMassage);
						AppUI5.fErrorLogs("OPOR & POR1","Add PO","null","null",ErrorMassage,"Retention Adding PO",this.UserNmae,"null",this.Database,JSON.stringify(oPO));
					},
					context: this,
					success: function (json) {
						sap.m.MessageToast.show("Added Successfully");

						if (this.oPOStatus === "Draft") {
							this.fUPdate();
						}
						this.fHideBusyIndicator();
						this.fDeleteData();
						this.fSelectPurchaseTransaction();
					}
					}).done(function (results) {
					if (results) {
						sap.m.MessageToast.show("Added Successfully");

						if (this.oPOStatus === "Draft") {
							this.fUPdate();
						}
						this.fHideBusyIndicator();
						this.fDeleteData();
						this.fSelectPurchaseTransaction();
					}

				});


			} else { //NO

				var poContract = oContranctAmount.replace(/,/g, '',/./g,'');
				var oContract = Number([poContract]);

				oPO.CardCode = oVendor;
				oPO.DocDate = oPostingDate;
				oPO.U_APP_IsForRetention = "Y";
				oPO.DocumentLines = [];
				oPO.DocType = "dDocument_Service";
				oPO.U_APP_Retention = "N";
				if (this.FileKey !== 0){
					oPO.AttachmentEntry = this.FileKey;
				}
				oPO.U_APP_ProjCode = this.POData.getData().POCreation.ProjectCode;
				
				if (this.POData.getData().POCreation.Progressive === "0" ){
					oPO.U_APP_Progressive = "Yes";
				}else{
					oPO.U_APP_Progressive = "No" ;
				}

				oPOLines1.LineNum = 0;
				oPOLines1.AccountCode = this.fGetGLAccount("getCWIPGLAccountOnly",1); //CWIP
				oPOLines1.UnitPrice = oContract;
				oPOLines1.VatGroup = "IVAT-EXC";
				oPOLines1.U_APP_RtnRowType = "C";
				oPOLines1.ProjectCode = this.POData.getData().POCreation.ProjectCode;

				oPO.DocumentLines.push(oPOLines1);

				oPO.Comments = oRemarks;

				$.ajax({
					// Posting PO in SAP
					url: "https://sl.biotechfarms.net/b1s/v1/PurchaseOrders",
					data: JSON.stringify(oPO),
					type: "POST",
					xhrFields: {
						withCredentials: true
					},
					error: function (xhr, status, error) {
						var ErrorMassage = xhr.responseJSON["error"].message.value;
						sap.m.MessageToast.show(ErrorMassage);
						this.fHideBusyIndicator();
						console.error(ErrorMassage);
						AppUI5.fErrorLogs("OPOR & POR1","Posting PO","null","null",ErrorMassage,"Retention Posting PO",this.UserName,"null",this.Database,JSON.stringify(oPo));
					},
					context: this,
					success: function (json) {
						sap.m.MessageToast.show("Added Successfully");

						if (this.oPOStatus === "Draft") {
							this.fUPdate();
						}
						this.fHideBusyIndicator();
						this.fDeleteData();
					}
					}).done(function (results) {
					if (results) {
						sap.m.MessageToast.show("Added Successfully");

						if (this.oPOStatus === "Draft") {
							this.fUPdate();
						}
						this.fHideBusyIndicator();
						this.fDeleteData();
					}

				});

			}

		}

	},
	// To PO Status
	fUPdate: function () {

		var oCode = this.DraftCode;

		var oPo = {};

		oPo.U_App_Status = "Y";

		//To Update Data in UDT
		$.ajax({
			url: "https://sl.biotechfarms.net/b1s/v1/U_APP_CPOR('" + oCode + "')",
			data: JSON.stringify(oPo),
			type: "PATCH",
			xhrFields: {
				withCredentials: true
			},
			error: function (xhr, status, error) {
				BusyIndicator.hide();
				var ErrorMassage = xhr.responseJSON["error"].message.value;
				MessageToast.show(ErrorMassage);
				console.error(ErrorMassage);
			},
			context: this,
			success: function (json) {
				this.fHideBusyIndicator();
			}
		}).done(function (results1) {
			if (results1) {
				this.DraftCode = "";
				this.fHideBusyIndicator();
				this.fSelectPurchaseTransaction();
			}
		});

	},
	// Updating Draft
	fDraftUpdate: function () {
		this.fShowBusyIndicator(4000, 0);

		var TransacCode = this.getView().byId("Docnum").getValue(); 
		var Contractor = this.getView().byId("BPCode").getValue();
		var ContractAmount = this.getView().byId("CntAmount").getValue();
		var ProjectCode = this.getView().byId("ProjCode").getValue();

		if (Contractor === "" || ContractAmount === "" ||  ProjectCode === ""){

			sap.m.MessageToast.show("Input Data");
			this.fHideBusyIndicator();

		} else{

			var oCode = this.DraftCode;

			var oPo = {};
	
			oPo.U_App_Vendor = this.CardCode;
			oPo.U_App_VendorName = this.oMdlAllBP.getData().allbp.Vendor;
			oPo.U_App_Retention = this.POData.getData().POCreation.Retention;
			oPo.U_App_PostDate = this.POData.getData().POCreation.PostingDate;
			oPo.U_App_ConAmount = this.byId("CntAmount").getValue();
			oPo.U_App_Remarks = this.getView().byId("TextArea").getValue();
			oPo.U_App_Progressive = this.POData.getData().POCreation.Progressive;
			oPo.U_App_ProjectCode = this.POData.getData().POCreation.ProjectCode;
			oPo.U_App_File = this.getView().byId("fileUploader").getValue();
			oPo.U_App_FileKey = this.FileKey;
			oPo.U_App_UpdatedDate = this.fGetTodaysDate();
			oPo.U_App_UpdatedBy = this.UserName;
	
			$.ajax({
				url: "https://sl.biotechfarms.net/b1s/v1/U_APP_CPOR('" + oCode + "')",
				data: JSON.stringify(oPo),
				type: "PATCH",
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					var ErrorMassage = xhr.responseJSON["error"].message.value;
					sap.m.MessageToast.show(ErrorMassage);
					this.fHideBusyIndicator();
					console.error(ErrorMassage);
					AppUI5.fErrorLogs("U_APP_CPOR","Update PO Draft",TransacCode,"null",ErrorMassage,"Retention Update PO Draft",this.UserName,"null",this.Database,JSON.stringify(oPo));
				},
				context: this,
				success: function (json) {
					sap.m.MessageToast.show("Updated Successfully");
					this.fHideBusyIndicator();
					this.fDeleteData();
				}
			}).done(function (results1) {
				//-------Success--------//
			});

		}

	},
	//Filter Grid Value
	fFilterValue: function (oEvent) {

		var value = oEvent.mParameters.column.sId;
		var oVAlue1 = oEvent.mParameters.value;
		var PoStatus = this.getView().byId("selectRecordGroup").getSelectedKey();


		if (oVAlue1 !== "") {
			//Document Number
			if (value === "__xmlview3--colDoc" || value === "__xmlview2--colDoc" || value === "__xmlview1--colDoc") {

				if (PoStatus === "0") {
					this.fGetFilterValues("getFilterUDTCPORDocNum", oVAlue1);
				} else if (PoStatus === "1") {
					this.fGetFilterValues("oDownPaymentFilterDocNum", oVAlue1);
				} else if (PoStatus === "2") {
					this.fGetFilterValues("getFilterSubsequentBillingDocNum", oVAlue1);
				}
			// Vendor Name
			} else if (value === "__xmlview3--colVendor" || value === "__xmlview2--colVendor" || value === "__xmlview1--colVendor") {

				if (PoStatus === "0") {
					this.fGetFilterValues("getFilterUDTCPORCardName", oVAlue1);
				} else if (PoStatus === "1") {
					this.fGetFilterValues("oDownPaymentFilterCardName", oVAlue1);
				} else if (PoStatus === "2") {
					this.fGetFilterValues("getFilterSubsequentBillingCardName", oVAlue1);
				}
			//Posting Date
			} else if (value === "__column0" ){

				if (PoStatus === "0") {
					this.fGetFilterValues("getFilterUDTCPORDate", oVAlue1);
				} else if (PoStatus === "1") {
					this.fGetFilterValues("oDownPaymentFilterDate", oVAlue1);
				} else if (PoStatus === "2") {
					this.fGetFilterValues("getFilterSubsequentBillingDate", oVAlue1);
				}
 
			} else if (value === "__xmlview1--colProjCode" || value === "__xmlview2--colProjCode" || value === "__xmlview3--colProjCode"){
				if (PoStatus === "0") {
					this.fGetFilterValues("getFilterUDTCPORProjCode", oVAlue1);
				} else if (PoStatus === "1") {
					this.fGetFilterValues("oDownPaymentFilterProjCode", oVAlue1);
				} else if (PoStatus === "2") {
					this.fGetFilterValues("getFilterSubsequentBillingProjCode", oVAlue1);
				}

			}
		} else {

			if (PoStatus === "0") {
				this.fFilterPurchaseOrderTransaction("getUDTCPOR");
			} else if (PoStatus === "1") {
				this.fFilterPurchaseOrderTransaction("getAllUnprocessedPO");
			} else if (PoStatus === "2") {
				this.fFilterPurchaseOrderTransaction("getSubsequentBilling");
			}

		}

	},
	// To Get Filter Value in SAP
	fGetFilterValues: function (queryTag, oValue) {

		this.oModelOpenPO = new JSONModel();
		$.ajax({
			url: "https://xs.biotechfarms.net/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database + "&procName=spAppRetention&queryTag=" + queryTag +
				"&value1=" + oValue + "&value2=&value3=&value4=",
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
				this.oModelOpenPO.setJSON("{\"allbp\" : " + JSON.stringify(results) + "}");
				this.getView().setModel(this.oModelOpenPO, "oModelOpenPO");
			}
		});

	},
	//Hide indicator function
	fHideBusyIndicator : function() {
		BusyIndicator.hide();
	},
	//Show indicator Process
	fShowBusyIndicator : function (iDuration, iDelay) {
		BusyIndicator.show(iDelay);

		if (iDuration && iDuration > 0) {
			if (this._sTimeoutId) {
				clearTimeout(this._sTimeoutId);
				this._sTimeoutId = null;
			}
		}
	},
	onCancel: function (){

		var DocEntry = this.byId("Docnum").getValue();
		this.foGetDocEntry("getPODocEntry",DocEntry);
		var oDocEntry =  this.PODocEnrty;
		
		if (oDocEntry !== ""){
			this.fShowBusyIndicator(4000, 0);
			this.fPOCancellation(oDocEntry);
			this.fFilterPurchaseOrderTransaction("getAllUnprocessedPO");
		}
	},
	foGetDocEntry: function (QueryTag,oDocEntry){
		var DocEntry  = "";

			$.ajax({
				url: "https://xs.biotechfarms.net/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database + "&procName=spAppRetention&queryTag=" + QueryTag +
					"&value1=" + oDocEntry + "&value2=&value3=&value4=",
					type: "GET",
					dataType: "json",
				  beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:P@ssw0rd805~"));
			  	},
					error: function (xhr, status, error) {
						sap.m.MessageToast.show(error);
					},
					success: function (json) {
						this.PODocEnrty = json[0].DocEntry;
						
					},
					context: this
			}).done(function (results) {
				this.PODocEnrty = results[0].DocEntry;
			});
	},
	fPOCancellation: function (oDocEntry){

		
		$.ajax({
			//Posting PO in SAP
			url: "https://sl.biotechfarms.net/b1s/v1/PurchaseOrders("+ oDocEntry +")/Cancel",
			type: "POST",
			xhrFields: {
				withCredentials: true
			},
			error: function (xhr, status, error) {
				var Message = xhr.responseJSON["error"].message.value;
				sap.m.MessageToast.show(Message);
				console.error(Message);
				this.fHideBusyIndicator();
			},
			context: this,
			success: function (json) {				
				sap.m.MessageToast.show("Cancel Successfully");
				this.fHideBusyIndicator();
				this.fDeleteData();
			}
			}).done(function (results) {
			if (results) {

			}

		});

	},

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
					url: "https://xs.biotechfarms.net/app_xsjs/ExecQuery.xsjs?dbName=" + Database +
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
						this.oMdlAllProject.refresh();

						var aList = this.oMdlAllProject.getProperty("/allbp");
	
						aList.forEach(function (oRecord) {
							oRecord.selected = (oRecord.CardCode === sInputValue);
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
			this.fGetTransactionNumber();
	
	},
	//------------------- Project Code End -----------------//
	//Selection of Retention Type
	fSelectRetention: function(){

		var Retention = this.getView().byId("Retention").getSelectedKey();

		if (Retention === "1"){
			this.getView().byId("Progressive").setSelectedKey("1");
			this.getView().byId("Progressive").setEnabled(false);
		}else{
			this.getView().byId("Progressive").setSelectedKey("");
			this.getView().byId("Progressive").setEnabled(true);
		}

	},
	//Attachment Posting
	handleValueChange: function (oEvt){
		var aFiles = oEvt.getParameters().files;
		this.currentFile = aFiles[0];
		var FileName = this.getView().byId("fileUploader").getValue();

		var form = new FormData();
		form.append("",this.currentFile,FileName);

		//Postinf Attachment in SAP
		$.ajax({
			url: "https://sl.biotechfarms.net/b1s/v1/Attachments2",
			data: form,
			type: "POST",
			processData:false,
			mimeType: "multipart/form-data",
			contentType: false,
			xhrFields: {
				withCredentials: true
			},
			error: function (xhr, status, error) {
				var ErrorMassage = xhr.responseJSON["error"].message.value;
				sap.m.MessageToast.show(ErrorMassage);
				this.fHideBusyIndicator();
				console.error(ErrorMassage);
			},
			context: this,
			success: function (json) {}
		}).done(function (results) {			
			if (results) {
				var oResult =JSON.parse(results);
				this.FileKey = oResult.AbsoluteEntry;
			}	

		}); 

	},
	fGetGLAccount: function (QueryTag,Active) {

		var oGLAccount = "";

		//To Get Code for UDT
		$.ajax({
			url: "https://xs.biotechfarms.net/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database +
			"&procName=spAppRetention&queryTag=" + QueryTag + "&value1=" +
			Active + "&value2=&value3=&value4=",
			type: "GET",
			async: false,
			beforeSend: function (xhr) {
				xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:P@ssw0rd805~"));
		  	},

			error: function (xhr, status, error) {
				jQuery.sap.log.error("This should never have happened!");
			},
			success: function (json) {
				oGLAccount = json[0].AcctCode;

			},
			context: this
		}).done(function (results) {
			if (results) {
				oGLAccount = results[0].AcctCode;
			}
		});
		return oGLAccount;
	}

  });
});
