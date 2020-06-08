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

  return Controller.extend("com.apptech.app-retention.controller.RetentionPayable", {

		_data: {
			"date": new Date()
		},
		onInit: function () {

				this.oMdlAllProject = new JSONModel(); 
				this.oMdlAllProject.getData().allbp = [];

				//Getting Data From LoginView
				this.Database = jQuery.sap.storage.get("Database");
				this.UserNmae = jQuery.sap.storage.get("Usename");
	
				// Get DateToday
				var oDate = new JSONModel(this._data);
				this.getView().setModel(oDate);
	
				// Input Header
				this.InputHeader = new JSONModel("model/HDInput.json");
				this.getView().setModel(this.InputHeader, "InputHeader");
	
				//Details Retention
				this.DTRetention = new JSONModel("model/DTRetention.json");
				this.getView().setModel(this.DTRetention, "DTRetention");
	
				//Purchase Filter Type
				this.Purchase = new JSONModel("model/Retention_Process.json");
				this.getView().setModel(this.Purchase, "Purchase");
	
				// TransType
				this.TransTypes = new JSONModel("model/TransType.json");
				this.getView().setModel(this.TransTypes, "TransTypes");
	
				// TaxType
				this.TaxType = new JSONModel("model/TaxType.json");
				this.getView().setModel(this.TaxType, "TaxType");
	
				// ProgressBillingType
				this.PBType = new JSONModel("model/ProgressBillingType.json");
				this.getView().setModel(this.PBType, "PBType");
	
				// FilterGrid
				this.oFilter = new JSONModel("model/GridFilter.json");
				this.getView().setModel(this.oFilter, "oFilter");
	
				// Net Amount
				this.netAmount = new JSONModel("model/NetAmount.json");
				this.getView().setModel(this.netAmount, "netAmount");
	
				// //Table View of Purchase Order
				this.getView().byId("selectRecordGroup").setSelectedKey("0");
				this.fFilterPurchaseOrderTransaction("getAllUnprocessedPO");
	
				this.tableId = "tblRetention";
				this.oModelPurchase = new JSONModel();
				this.oModelUDT = new JSONModel();
				this.oModelUDF = new JSONModel();
				this.oModelPrograte = new JSONModel();
				this.oAPDocTotal = new JSONModel();
				this.oGetHEADER = new JSONModel();
				this.oGetRetentionTransaction = new JSONModel();
				
				this.oGetDETAILES = new JSONModel();
				// To Get All CWIP of Subsequent
				this.All_Subsequent_CWIP = "";
				// To Get First Billing CWIP
				this.FirstBilling_CWIP = "";
				// Tag to Check if PO Transaction has PO Draft
				this.Tag = "";
				// To Get PO status 
				this.STatus = "";
				// To Get DocEntry
				this.oSCode = "";
				// To Get the Column Type of PO if "R" - Retention or "C" CWIP
				this.ColType = "";
				// To Get the Detailes Count of PO 
				this.PoCount = "";
				// To Get Value of Final Progress Billing Rate
				this.FinalBillingRate = "";
				// To Get Value of Final CWIP
				this.FinCWIP = "";
				// To Get UDF Header Code
				this.HeaderCode = "";
				// To Get UDF Detailes Code
				this.DetailesCode = "";
				// To Get Purchase Order Selection
				this.POSelects = this.getView().byId("selectRecordGroup").getSelectedKey();
				// To Verify if Progressive / Not Progressive
				this.Progressive = "";
				// Get PO Line Total
				this.POLineTotal = "";
				//First Billing CWIP
				this.FirstBillCWIP = "";
				//Subsequent Billing CWIP
				this.SubsequentBillCWIP = "";
				//Final Billing Retention YES
				this.FinalBillingRetention = "";
				// To Get PO DocEntry
				this.DocEntry = "";
				// To Get AP DocEntry
				this.APDocEntry = "";
				// to Get G/L Account
				this.GLAccount = "";
				// to Get WItholding Tax Code
				this.WTCode = "";
				//Fragment Dialog
				this._ValueHelpDialogs = null;
				//Retention Yes CWIP
				this.RetentionYCWIP = "";
				//To Get The Purhcase Order DocEntry
				this.PO_DocEntry = "";
				//CPA
				this.currentFile = {}; //File Object
				//Get File / Attachment Key
				this.FileKey = null;

				this.getView().byId("BAmount").setVisible(false);
				this.getView().byId("Wtax").setVisible(false);
				this.getView().byId("TaxType").setVisible(false);

				//getButtons
				this.oMdlButtons = new JSONModel();
				this.oResults = AppUI5.fGetButtons(this.Database,this.UserNmae,"paymentprocess");
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
		// Icontab Sekector
		fIconTabSelect: function () {
			var Tab = this.getView().byId("idIconTabBarInlineMode").getSelectedKey();

			if (Tab === "tab1") {
				this.onRefresh();
				this.getView().byId("btnRetCancel").setVisible(false);
				this.getView().byId("btnRetUpdate").setVisible(false);
				this.fDeleteData();
				this.fDeleteDetailes();
			}
		},
		//Process Transaction 
		onProcess: function () {
		
			this.fDeleteData();
			this.fDeleteDetailes();

			var that = this;
			that.oTable = that.getView().byId(that.tableId);
			that.oTable.setModel(that.oMdlAllRecord);

			var iIndex = this.oTable.getSelectedIndex();
			var sCode = "";
			var Rent = "";
			var RentTotal = "";

			var oRowSelected = that.oTable.getBinding().getModel().getData().allbp[that.oTable.getBinding().aIndices[iIndex]];
			this.STatus = oRowSelected.DocStatus;
			this.oSCode = oRowSelected.DocEntry;
			this.POCount = oRowSelected.POCount; 
			this.Progressive = oRowSelected.Progressive;
			this.DocEntry = oRowSelected.DocEntry;
			this.PO_DocEntry = oRowSelected.DocEntry;
			// var POType = oRowSelected.POCount
			if (this.POCount === "2") {
				this.ColType = "R";
				Rent = 	oRowSelected.DocTotal * 0.1;
				RentTotal = Number([Rent]);
			} else {
				this.ColType = "C";
			}


			var oPoStatus = this.getView().byId("selectRecordGroup").getSelectedKey();

			// that.DocTotalProcess = oRowSelected.DocTotal;

			//  Get Data From UDT
			if (this.STatus === "Draft" || this.STatus === "Paid" || this.STatus === "Not yet Paid." || this.STatus === "Done") {

			//Progressive YES
			if (this.Progressive === "Yes"){

				if (oPoStatus === "7") {
					// Gettting PO Transaction
					this.fGetPOTransaction(this.oSCode, this.ColType);
				}else{
					// Gettting Data Information
					this.onGetRetentionProcess(this.oSCode, this.ColType);
					// Getting Transtion Number
					this.fGetRetentionProcess();
					// Gettting PO Transaction for Retention
					this.fGetPOTransaction(this.oSCode, this.ColType);
				}
			} else{
				// Gettting Data Information
				this.onGetRetentionProcess(this.oSCode, this.ColType);
				// Getting Transtion Number
				this.fGetRetentionProcess();
				// Gettting PO Transaction for Retention
				this.fGetPOTransaction(this.oSCode, this.ColType);
			}

					if (oPoStatus === "2" || oPoStatus === "1") {
						this.fDeleteData();
						this.oGetDatafromHeaderUDT("DP");
						this.fSetTransacationType("0");
						this.oFilter.getData().SaveDraft.oDraft = "Update";
						this.oFilter.refresh();
					} else if (oPoStatus === "0") {
						this.fDeleteData();
						this.oGetDatafromHeaderUDT("DP");
						this.fSetTransacationType("2");
						this.oFilter.getData().SaveDraft.oDraft = "Update";
						this.oFilter.refresh();
					} else if (oPoStatus === "3") {
						this.fDeleteData();
						this.oGetDatafromHeaderUDT("1stPB");
						this.fSetTransacationType("3");
						this.oFilter.getData().SaveDraft.oDraft = "Update";
						this.oFilter.refresh();
					} else if (oPoStatus === "4") {
						this.fDeleteData();
						this.oGetDatafromHeaderUDT("SubPB");
						this.fSetTransacationType("4");
						this.oFilter.getData().SaveDraft.oDraft = "Update";
						this.oFilter.refresh();
					} else if (oPoStatus === "5") {
						this.fGetRemainingPrograte(this.oSCode);
						this.fDeleteData();
						this.oGetDatafromHeaderUDT("FinPB");
						this.fSetTransacationType("5");
						this.oFilter.getData().SaveDraft.oDraft = "Update";
						this.oFilter.refresh();
					} else if (oPoStatus === "7") {

						//Progressive YES
						if (this.Progressive === "Yes"){


						//Progressive NO
						}else{					
							this.fDeleteData();
							this.oGetDatafromHeaderUDT("RentPB");
							this.fSetTransacationType("7");
							this.oFilter.getData().SaveDraft.oDraft = "Update";
						}
						this.oFilter.refresh();
						
					} else if (oPoStatus === "6") {
						this.fDeleteData();
						this.oGetDatafromHeaderUDT("FinPB");
						this.fSetTransacationType("6");
						this.oFilter.getData().SaveDraft.oDraft = "Update";
						this.oFilter.refresh()
					}


				var tab1 = this.getView().byId("idIconTabBarInlineMode");
				tab1.setSelectedKey("tab2");

			} else {

					//Progressive YES
					if (this.Progressive === "Yes"){

						if (oPoStatus === "7") {
							// Gettting PO Transaction
							this.fGetPOTransaction(this.oSCode, this.ColType);
						}else{
							// Gettting Data Information
							this.onGetRetentionProcess(this.oSCode, this.ColType);
							// Getting Transtion Number
							this.fGetRetentionProcess();
							// Gettting PO Transaction for Retention
							this.fGetPOTransaction(this.oSCode, this.ColType);
						}
					} else{
						// Gettting Data Information
						this.onGetRetentionProcess(this.oSCode, this.ColType);
						// Getting Transtion Number
						this.fGetRetentionProcess();
						// Gettting PO Transaction for Retention
						this.fGetPOTransaction(this.oSCode, this.ColType);
					}


					if (oPoStatus === "0") {
						this.fSetTransacationType("2");
						this.oFilter.getData().SaveDraft.oDraft = "Save As Draft";
						this.oFilter.refresh();
					} else if (oPoStatus === "3") {
						this.fSetTransacationType("3");
						this.oFilter.getData().SaveDraft.oDraft = "Save As Draft";
						this.oFilter.refresh();
					} else if (oPoStatus === "4") {
						this.fGetRemainingPrograte(this.oSCode);
						this.fSetTransacationType("4");
						this.oFilter.getData().SaveDraft.oDraft = "Save As Draft";
						this.oFilter.refresh();
					} else if (oPoStatus === "5") {
						this.fSetTransacationType("5");
						this.oFilter.getData().SaveDraft.oDraft = "Save As Draft";
						this.oFilter.refresh();
						this.getView().byId("TaxType").setSelectedKey("0");
						this.fGetRemainingPrograte(this.oSCode);
					} else if (oPoStatus === "7") {

						//Progressive YES
						if (this.Progressive === "Yes"){
							this.fSetTransacationType("7");
							this.InputHeader.getData().RetAmount.ENABLED = true;

						//Progressive No
						}else{

							this.fSetTransacationType("7");
							this.oFilter.getData().SaveDraft.oDraft = "Save As Draft";
							this.getView().byId("TaxType").setEnabled(false);
							this.onProgressBIll();
		
							this.DTRetention.getData().DetailesRetention[0].GrossAmount = RentTotal;
							this.DTRetention.getData().DetailesRetention[0].NetProgress = RentTotal;
							this.DTRetention.refresh();
							this.InputHeader.getData().RetAmount.ENABLED = false;

						}

						this.oFilter.refresh();
						this.InputHeader.refresh();
					}

				var otab1 = this.getView().byId("idIconTabBarInlineMode");
				otab1.setSelectedKey("tab2");
				this.bIsAdd = "E";

			}
		
		},
		// To set Transaction Type
		fSetTransacationType: function (TransCode) {

			if (TransCode === "0") {

				this.getView().byId("TransType").setSelectedKey("0");
				this.getView().byId("TransType").setEnabled(false);
				this.getView().byId("TaxType").setSelectedKey("1");
				this.getView().byId("ProgBill").setEnabled(false);
				this.getView().byId("PBType").setEnabled(false);
				this.getView().byId("DPayment").setEnabled(false);
				this.getView().byId("TaxType").setVisible(false);
			} else if (TransCode === "2") {

				this.getView().byId("TransType").setSelectedKey("0");
				this.getView().byId("TransType").setEnabled(false);
				this.getView().byId("TaxType").setSelectedKey("1");
				this.getView().byId("ProgBill").setEnabled(false);
				this.getView().byId("PBType").setEnabled(false);
				this.getView().byId("DPayment").setEnabled(true);
				this.getView().byId("TaxType").setVisible(false);
			} else if (TransCode === "3") {

				this.getView().byId("TransType").setSelectedKey("1");
				this.getView().byId("TransType").setEnabled(false);
				this.getView().byId("PBType").setSelectedKey("1");
				this.getView().byId("RentAmount").setEnabled(false);
				this.getView().byId("DPayment").setEnabled(false);
				this.getView().byId("Doctotal").setEnabled(false);
				this.getView().byId("TaxType").setVisible(true);

			} else if (TransCode === "4") {

				this.getView().byId("TransType").setSelectedKey("1");
				this.getView().byId("TransType").setEnabled(false);
				this.getView().byId("PBType").setSelectedKey("2");
				this.getView().byId("RentAmount").setEnabled(false);
				this.getView().byId("DPayment").setEnabled(false);
				this.getView().byId("Doctotal").setEnabled(false);
				this.getView().byId("TaxType").setVisible(true);

			} else if (TransCode === "5") {

				this.getView().byId("TransType").setSelectedKey("1");
				this.getView().byId("TransType").setEnabled(false);
				this.getView().byId("PBType").setSelectedKey("3");
				this.getView().byId("RentAmount").setEnabled(false);
				this.getView().byId("DPayment").setEnabled(false);
				this.getView().byId("Doctotal").setEnabled(false);
				this.getView().byId("ProgBill").setEnabled(false);
				this.getView().byId("TaxType").setVisible(true);

			} else if (TransCode === "6") {
				this.getView().byId("TransType").setSelectedKey("1");
				this.getView().byId("TransType").setEnabled(false);
				this.getView().byId("PBType").setSelectedKey("4");
				this.getView().byId("RentAmount").setEnabled(false);
				this.getView().byId("DPayment").setEnabled(false);
				this.getView().byId("Doctotal").setEnabled(false);
				this.getView().byId("ProgBill").setEnabled(false);
				this.getView().byId("TaxType").setVisible(true);
			} else if (TransCode === "7") {
				this.getView().byId("TransType").setSelectedKey("1");
				this.getView().byId("TransType").setEnabled(false);
				this.getView().byId("PBType").setSelectedKey("4");
				this.getView().byId("RentAmount").setEnabled(false);
				this.getView().byId("DPayment").setEnabled(false);
				this.getView().byId("Doctotal").setEnabled(false);
				this.getView().byId("ProgBill").setEnabled(false);
				this.getView().byId("TaxType").setEnabled(false);
				this.getView().byId("TaxType").setVisible(true);
				
			}
		},
		// To Get HEADER/DETAILEs Data from UDT
		oGetDatafromHeaderUDT: function (oDocStatus) {

			var that = this;
			that.oTable = that.getView().byId(that.tableId);
			that.oTable.setModel(that.oMdlAllRecord);

			var iIndex = this.oTable.getSelectedIndex();
			var sStatus = "";
			var sCode = "";
			var POCount = "";

			var oRowSelected = that.oTable.getBinding().getModel().getData().allbp[that.oTable.getBinding().aIndices[iIndex]];
			sStatus = oRowSelected.DocStatus;
			sCode = oRowSelected.DocEntry;


			var PoStatus = this.getView().byId("selectRecordGroup").getSelectedKey();
			that.DocTotalProcess = oRowSelected.DocTotal;

			this.oModelOpenPO = new JSONModel();
			// To get PO Transaction 
			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database +
					"&procName=spAppRetention&queryTag=getPOTransaction&value1=" +
					sCode + "&value2="+ this.ColType +"&value3=&value4=",
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
				if (results.length === 0) {
					this.fDeleteData();
				} else {
					this.oModelPurchase.setJSON("{\"POFields\" : " + JSON.stringify(results).replace("[", "").replace("]", "") + "}");
					this.getView().setModel(this.oModelPurchase, "oModelPurchase");
				}

			});

			// To Get Header Value in UDT and set on Fields
			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database + "&procName=spAppRetention&queryTag=getUDThdr&value1=" +
					sCode +
					"&value2=" + oDocStatus + "&value3=&value4=",
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
				if (results.length === 0) {
					MessageToast.show(error);
				} else {

					that.oModelUDT.setJSON("{\"UDTFields\" : " + JSON.stringify(results).replace("[", "").replace("]", "") + "}");
					that.getView().setModel(that.oModelUDT, "oModelUDT");

					var oCardCode = "";
					var oDocEntrys = "";
					var oCardName = "";
					var oDocNum = "";
					var oTransNum = "";
					var oDocDate = "";
					var oTransType = "";
					var oTaxType = "";
					var oRetention = "";
					var oDP = "";
					var oDocTotal = "";
					var oProgBill = "";
					var oProgType = "";
					var oRemarks = "";

					oDocEntrys = that.oModelUDT.getData().UDTFields.U_App_DocEntry;
					oCardCode = that.oModelUDT.getData().UDTFields.U_App_Vendor;
					oCardName = that.oModelUDT.getData().UDTFields.U_App_Name;
					oDocNum = that.oModelUDT.getData().UDTFields.U_App_DocNum;
					oTransNum = that.oModelUDT.getData().UDTFields.U_App_TransNum;
					oDocDate = that.oModelUDT.getData().UDTFields.U_App_PostDate;
					oTransType = that.oModelUDT.getData().UDTFields.U_App_TransType;
					oTaxType = that.oModelUDT.getData().UDTFields.U_App_TaxType;

					oRetention = that.oModelUDT.getData().UDTFields.U_App_RentAmnt;
					oDocTotal = that.oModelUDT.getData().UDTFields.U_App_ContractAmount;

					oDP = that.oModelUDT.getData().UDTFields.U_App_DwnPymnt;
					oProgBill = that.oModelUDT.getData().UDTFields.U_App_ProgBill;
					oProgType = that.oModelUDT.getData().UDTFields.U_App_ProgBill_Type;
					oRemarks = that.oModelUDT.getData().UDTFields.U_App_Remarks;

					this.oModelPurchase.getData().POFields.DocEntry = oDocEntrys;
					this.oModelPurchase.getData().POFields.CardCode = oCardCode;
					this.oModelPurchase.getData().POFields.CardName = oCardName;
					this.oModelPurchase.getData().POFields.DocNum = oDocNum;
					this.getView().byId("TransNo").setValue(oTransNum);
					this.oModelPurchase.getData().POFields.DocDate = oDocDate;

					if (oTaxType === "0") {
						this.getView().byId("TaxType").setSelectedKey("0");
					} else {
						this.getView().byId("TaxType").setSelectedKey("1");
					}
					this.byId("RentAmount").setValue(oRetention);
					this.byId("Doctotal").setValue(oDocTotal);
					this.getView().byId("DPayment").setValue(oDP);
					this.getView().byId("ProgBill").setValue(oProgBill);
					this.getView().byId("TextArea").setValue(oRemarks);
					this.getView().byId("fileUploader").setValue(results[0].File);
					this.FileKey = results[0].FileKey;

					this.oModelPurchase.getData().POFields.DocTotal = oDocTotal;
					this.oModelPurchase.getData().POFields.Price = oRetention;
					this.oModelPurchase.refresh();

					this.getView().byId("BAmount").setValue(that.oModelUDT.getData().UDTFields.U_App_BaseAmount);
					this.getView().byId("Wtax").setValue(that.oModelUDT.getData().UDTFields.U_App_WithTax);
					this.InputHeader.getData().InputHeader.BaseAmount = that.oModelUDT.getData().UDTFields.U_App_BaseAmount;
					this.InputHeader.getData().InputHeader.WTax = that.oModelUDT.getData().UDTFields.U_App_WithTax;
					this.InputHeader.refresh();

				}

			});
			//To get value in UDT and set on fields
			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database + "&procName=spAppRetention&queryTag=getUDTdtl&value1=" +
					sCode +
					"&value2=" + oDocStatus + "&value3=&value4=",
					type: "GET",
					beforeSend: function(xhr) {
						xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:P@ssw0rd805~"));
					},
					error: function(xhr, status, error) {
						MessageToast.show(error);
					},
					success: function(json) {},
					context: this
			}).done(function (oresults) {
				if (oresults.length === 0) {
					MessageToast.show(error);
				} else {
					that.oModelUDF.setJSON("{\"UDFFields\" : " + JSON.stringify(oresults).replace("[", "").replace("]", "") + "}");
					that.getView().setModel(that.oModelUDF, "oModelUDF");

					var oCWIP = "";
					var oGrossAmount = "";
					var oWtx = "";
					var oProratedDP = "";
					var oProratedRetention = "";
					var oNetProgBill = "";

					oCWIP = that.oModelUDF.getData().UDFFields.U_App_CWIP;
					oGrossAmount = that.oModelUDF.getData().UDFFields.U_App_GrossAmnt;
					oWtx = that.oModelUDF.getData().UDFFields.U_App_WTax;
					oProratedDP = that.oModelUDF.getData().UDFFields.U_App_ProDP;
					oProratedRetention = that.oModelUDF.getData().UDFFields.U_App_ProReten;
					oNetProgBill = that.oModelUDF.getData().UDFFields.U_App_NetProgBill;

					this.byId("CWIP").setValue(oCWIP);
					this.byId("GrossAmount").setValue(oGrossAmount);
					this.byId("WTX").setValue(oWtx);
					this.byId("ProratedDP").setValue(oProratedDP);
					this.byId("ProratedReten").setValue(oProratedRetention);
					this.byId("NetAmount").setValue(oNetProgBill);


					this.DTRetention.getData().DetailesRetention[0].CWIP = oCWIP;
					this.DTRetention.getData().DetailesRetention[0].GrossAmount = oGrossAmount;
					this.DTRetention.getData().DetailesRetention[0].WTX = oWtx;
					this.DTRetention.getData().DetailesRetention[0].ProratedDP = oProratedDP;
					this.DTRetention.getData().DetailesRetention[0].ProratedRetention = oProratedRetention;
					this.DTRetention.getData().DetailesRetention[0].NetProgress = oNetProgBill;

					this.DTRetention.refresh();

				}

			});

		},
		// To Refresh all Fields
		onRefresh: function () {
			var PoStatus = this.getView().byId("selectRecordGroup").getSelectedKey();

			if (PoStatus === "0") {
				this.fFilterPurchaseOrderTransaction("getAllUnprocessedPO");
			} else if (PoStatus === "1") {
				this.fFilterPurchaseOrderTransaction("getDPwthOP");
			} else if (PoStatus === "2") {
				this.fFilterPurchaseOrderTransaction("getPOwithAPDP");
			} else if (PoStatus === "3") {
				this.fFilterPurchaseOrderTransaction("getFirstBilling");
			} else if (PoStatus === "4") {
				this.fFilterPurchaseOrderTransaction("getSubsequentBilling");
			} else if (PoStatus === "5") {
				this.fFilterPurchaseOrderTransaction("getFinalBilling");
			} else if (PoStatus === "6") {
				this.fFilterPurchaseOrderTransaction("getCompleteTransaction");
			} else if (PoStatus === "7") {
				this.fFilterPurchaseOrderTransaction("getRetentionBilling");
			}
			this.fDeleteData();
			this.fDeleteDetailes();
		},
		// Combobox Purchase Order Transaction
		onSelectPurchaseTransaction: function () {

			var PoStatus = this.getView().byId("selectRecordGroup").getSelectedKey();
 
			if (PoStatus === "7") {
				this.InputHeader.getData().RetAmount.ENABLED = true;
			}else{
				this.InputHeader.getData().RetAmount.ENABLED = false;
			}
				this.InputHeader.refresh();

			if (PoStatus === "0") {
				this.fNableAllFields("1");
				this.fFilterPurchaseOrderTransaction("getAllUnprocessedPO");
				this.oFilter.getData().Process.ProcName = "Process";
				this.oFilter.getData().NetAmount.NAME = "Net Down Payment Amount";
				this.oFilter.refresh();
				this.getView().byId("btnRetCancel").setVisible(false);
				this.getView().byId("btnRetUpdate").setVisible(false);
				this.getView().byId("BAmount").setVisible(false);
				this.getView().byId("TaxType").setVisible(false);
			} else if (PoStatus === "1") {
				this.fNableAllFields("0");
				this.fFilterPurchaseOrderTransaction("getDPwthOP");
				this.oFilter.getData().Process.ProcName = "View";
				this.oFilter.getData().NetAmount.NAME = "Net Down Payment Amount";
				this.oFilter.refresh();
				this.getView().byId("btnRetCancel").setVisible(true);
				this.getView().byId("btnRetUpdate").setVisible(true);
				this.getView().byId("BAmount").setVisible(false);
				this.getView().byId("TaxType").setVisible(false);
			} else if (PoStatus === "2") {
				this.fNableAllFields("0");
				this.fFilterPurchaseOrderTransaction("getPOwithAPDP");
				this.oFilter.getData().Process.ProcName = "View";
				this.oFilter.getData().NetAmount.NAME = "Net Down Payment Amount";
				this.oFilter.refresh();
				this.getView().byId("btnRetCancel").setVisible(false);
				this.getView().byId("btnRetUpdate").setVisible(false);
				this.getView().byId("BAmount").setVisible(false);
				this.getView().byId("TaxType").setVisible(false);
			} else if (PoStatus === "3") {
				this.fNableAllFields("1");
				this.fFilterPurchaseOrderTransaction("getFirstBilling");
				this.oFilter.getData().Process.ProcName = "Process";
				this.oFilter.getData().NetAmount.NAME = "Net Progress Billing Amount";
				this.oFilter.refresh();
				this.getView().byId("btnRetCancel").setVisible(false);
				this.getView().byId("btnRetUpdate").setVisible(false);
				this.getView().byId("BAmount").setVisible(true);
				this.getView().byId("TaxType").setVisible(true);
			} else if (PoStatus === "4") {
				this.fNableAllFields("1");
				this.fFilterPurchaseOrderTransaction("getSubsequentBilling");
				this.oFilter.getData().Process.ProcName = "Process";
				this.oFilter.getData().NetAmount.NAME = "Net Progress Billing Amount";
				this.oFilter.refresh();
				this.getView().byId("btnRetCancel").setVisible(false);
				this.getView().byId("btnRetUpdate").setVisible(false);
				this.getView().byId("BAmount").setVisible(true);
				this.getView().byId("TaxType").setVisible(true);
			} else if (PoStatus === "5") {
				this.fNableAllFields("1");
				this.fFilterPurchaseOrderTransaction("getFinalBilling");
				// getFinalBilling
				this.oFilter.getData().Process.ProcName = "Process";
				this.oFilter.getData().NetAmount.NAME = "Net Progress Billing Amount";
				this.oFilter.refresh();
				this.getView().byId("btnRetCancel").setVisible(false);
				this.getView().byId("btnRetUpdate").setVisible(false);
				this.getView().byId("BAmount").setVisible(true);
				this.getView().byId("TaxType").setVisible(true);
			} else if (PoStatus === "6") {
				this.fNableAllFields("0");
				this.fFilterPurchaseOrderTransaction("getCompleteTransaction");
				this.oFilter.getData().Process.ProcName = "View";
				this.oFilter.getData().NetAmount.NAME = "Net Progress Billing Amount";
				this.oFilter.refresh();
				this.getView().byId("btnRetCancel").setVisible(false);
				this.getView().byId("btnRetUpdate").setVisible(false);
				this.getView().byId("BAmount").setVisible(false);
				this.getView().byId("TaxType").setVisible(false);
			} else if (PoStatus === "7") {
				this.fNableAllFields("1");
				this.fFilterPurchaseOrderTransaction("getRetentionBilling");
				this.oFilter.getData().Process.ProcName = "Process";
				this.oFilter.getData().NetAmount.NAME = "Net Progress Billing Amount";
				this.oFilter.refresh();
				this.getView().byId("btnRetCancel").setVisible(false);
				this.getView().byId("btnRetUpdate").setVisible(false);
				this.getView().byId("BAmount").setVisible(false);
				this.getView().byId("TaxType").setVisible(false);
			}

		},
		// To Get all Data of Purchase Order
		fFilterPurchaseOrderTransaction: function (queryTag) {

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
			}).done(function (results) {
				if (results) {
					this.oModelOpenPO.setJSON("{\"allbp\" : " + JSON.stringify(results) + "}");
					this.getView().setModel(this.oModelOpenPO, "oModelOpenPO");
				}
			});

		},
		// To Delete All Value in Fields
		fDeleteData: function (oEvent) {

			this.getView().byId("TransNo").setValue("");
			this.getView().byId("VenSupCode").setValue("");
			this.getView().byId("DocNum").setValue("");
			this.getView().byId("DateFrom").setValue("");
			this.getView().byId("Name").setValue("");
			this.getView().byId("TransType").setValue("");
			this.getView().byId("TaxType").setValue("");
			this.getView().byId("RentAmount").setValue("");
			this.getView().byId("DPayment").setValue("");
			this.getView().byId("ProgBill").setValue("");
			this.getView().byId("Doctotal").setValue("");
			this.getView().byId("PBType").setValue("");
			this.getView().byId("CWIP").setValue("");
			this.getView().byId("TextArea").setValue("");
			this.getView().byId("RetCode").setValue("");
			this.getView().byId("fileUploader").setValue("");
			this.FileKey = null;
			

			this.DTRetention.getData().DetailesRetention[0].CWIP = "";
			this.DTRetention.getData().DetailesRetention[0].WTX = "";
			this.DTRetention.getData().DetailesRetention[0].GrossAmount = "";
			this.DTRetention.getData().DetailesRetention[0].ProratedDP = "";
			this.DTRetention.getData().DetailesRetention[0].ProratedRetention = "";
			this.DTRetention.getData().DetailesRetention[0].NetProgress = "";
			this.DTRetention.refresh();
			this.InputHeader.getData().InputHeader.DP = "";
			this.InputHeader.getData().InputHeader.ProgressBilling = "";
			this.InputHeader.getData().InputHeader.BaseAmount = "";
			this.InputHeader.getData().InputHeader.WTax = "";
			this.InputHeader.refresh();
			

		},
		// To Delete All Detaile Value in Fields
		fDeleteDetailes: function (oEvent) {
			this.DTRetention.getData().DetailesRetention[0].CWIP = "";
			this.DTRetention.getData().DetailesRetention[0].WTX = "";
			this.DTRetention.getData().DetailesRetention[0].GrossAmount = "";
			this.DTRetention.getData().DetailesRetention[0].ProratedDP = "";
			this.DTRetention.getData().DetailesRetention[0].ProratedRetention = "";
			this.DTRetention.getData().DetailesRetention[0].NetProgress = "";

			this.DTRetention.refresh();
		},
		// For Enable Fields
		fNableAllFields: function (oCode) {

			if (oCode === "0") {

				this.getView().byId("TransNo").setEnabled(false);
				this.getView().byId("VenSupCode").setEnabled(false);
				this.getView().byId("DocNum").setEnabled(false);
				this.getView().byId("DateFrom").setEnabled(false);
				this.getView().byId("Name").setEnabled(false);
				this.getView().byId("TransType").setEnabled(false);
				this.getView().byId("TaxType").setEnabled(false);
				this.getView().byId("RentAmount").setEnabled(false);
				this.getView().byId("ProgBill").setEnabled(false);
				this.getView().byId("DPayment").setEnabled(false);
				this.getView().byId("ProgBill").setEnabled(false);
				this.getView().byId("Doctotal").setEnabled(false);
				this.getView().byId("PBType").setEnabled(false);
				this.getView().byId("CWIP").setEnabled(false);
				this.getView().byId("fileUploader").setEnabled(false);
				this.getView().byId("TextArea").setEnabled(false);
				this.getView().byId("btnRetSave").setEnabled(false);
				this.getView().byId("btnRetAdd").setEnabled(false);

			} else {

				this.getView().byId("TransNo").setEnabled(true);
				this.getView().byId("VenSupCode").setEnabled(true);
				this.getView().byId("DocNum").setEnabled(true);
				this.getView().byId("DateFrom").setEnabled(true);
				this.getView().byId("Name").setEnabled(true);
				this.getView().byId("TransType").setEnabled(true);
				this.getView().byId("TaxType").setEnabled(true);
				this.getView().byId("RentAmount").setEnabled(true);
				this.getView().byId("ProgBill").setEnabled(true);
				this.getView().byId("DPayment").setEnabled(true);
				this.getView().byId("ProgBill").setEnabled(true);
				this.getView().byId("Doctotal").setEnabled(true);
				this.getView().byId("PBType").setEnabled(false);
				this.getView().byId("CWIP").setEnabled(true);
				this.getView().byId("fileUploader").setEnabled(true);
				this.getView().byId("TextArea").setEnabled(true);
				this.getView().byId("btnRetSave").setEnabled(true);
				this.getView().byId("btnRetAdd").setEnabled(true);

			}
		},
		//Formula of Base Amount
		fBaseAmount: function() {

			this.InputHeader.getData().InputHeader.BaseAmount = this.getView().byId("BAmount").getValue();
			this.InputHeader.refresh();

			var oBaseAmount = this.InputHeader.getData().InputHeader.BaseAmount;

			var oBaseAmount = this.InputHeader.getData().InputHeader.BaseAmount;
			var oWTX1 = oBaseAmount / 1.12;
			var sWTHTaxRate = this.oModelPurchase.getData().POFields.Rate;
			var sWTHTaxRate1 = sWTHTaxRate / 100;
			var oTotalWTX = oWTX1 * sWTHTaxRate1;
			var oTotal = Number([oTotalWTX]);
			var FTotalFWTX = oTotal.toFixed(2);

			this.getView().byId("Wtax").setValue(FTotalFWTX);
			this.InputHeader.getData().InputHeader.WTax = FTotalFWTX;
			this.InputHeader.refresh();

			//Formula for Retention Detailes
			var Transaction_Type = this.getView().byId("TransType").getSelectedKey();

			if (Transaction_Type === "0"){

				if (oBaseAmount !== ""){

					
					var Gross_Amount = this.DTRetention.getData().DetailesRetention[0].GrossAmount;
					var oWTX1 = Gross_Amount / 1.12;
					var sWTHTaxRate = this.oModelPurchase.getData().POFields.Rate;
					var sWTHTaxRate1 = sWTHTaxRate / 100;
					var oTotalWTX = oWTX1 * sWTHTaxRate1;
					var oTotal = Number([oTotalWTX]);
					var odtlWTX = oTotal.toFixed(2);

					var oodtlWTX = Number([odtlWTX]);
					var oFTotalFWTX = Number([FTotalFWTX]);
					var osdtlWTX = oodtlWTX + oFTotalFWTX;
					var FdtlFWTX = osdtlWTX.toFixed(2);

					this.DTRetention.getData().DetailesRetention[0].WTX = FdtlFWTX;
					this.DTRetention.refresh();

					var GrossAmount = this.DTRetention.getData().DetailesRetention[0].GrossAmount;
					var oGrossAmount = Number([GrossAmount]);

					var NetDPAmount = oGrossAmount - FdtlFWTX;
					var oNetDPAmount = Number([NetDPAmount]);
					var FNetDPAmount = oNetDPAmount.toFixed(2);

					this.DTRetention.getData().DetailesRetention[0].NetProgress = FNetDPAmount;
					this.DTRetention.refresh();

				}else{
					this.onRetentionAmount();
				}

			}else {

				var ProgresBil_Type = this.getView().byId("PBType").getSelectedKey();

				if (ProgresBil_Type !== "4"){

					if (oBaseAmount !== ""){

						
						var GrossAmount = this.DTRetention.getData().DetailesRetention[0].GrossAmount;
						var oGrossAmout = Number([GrossAmount]);
						var ProratedDP = this.DTRetention.getData().DetailesRetention[0].ProratedDP;
						var oProratedDP = Number([ProratedDP]);
						var ProratedRetention = this.DTRetention.getData().DetailesRetention[0].ProratedRetention;
						var oProratedRetention = Number([ProratedRetention]);
						var fWTHTaxRate = this.oModelPurchase.getData().POFields.Rate;
						var ofWTHTaxRate = Number([fWTHTaxRate]);
						var DetailesWTX = this.DTRetention.getData().DetailesRetention[0].WTX;
						var oDetailesWTX = Number([DetailesWTX]);
						var HeaderWTX = this.InputHeader.getData().InputHeader.WTax;
						var oHeaderWTX = Number([HeaderWTX]);

						// var fGrossCount = ofWTHTaxRate / 100;
						// var Wtx1 = oGrossAmout - oProratedDP;
						// var Wtx2 = Wtx1 - oProratedRetention;
						// var Wtx3 = Wtx2 / 1.12;
						// var Wtx4 = Wtx3 * fGrossCount;
						// var oDTWtx = Wtx4.toFixed(2);

						// var oodtlWTX = Number([oDTWtx]);
						// var oFTotalFWTX = Number([FTotalFWTX]);
						// var osdtlWTX = oodtlWTX + oFTotalFWTX;
						// var FdtlFWTX = osdtlWTX.toFixed(2);

						var FdtlFWTX = oDetailesWTX + oHeaderWTX ;
						var oFdtlFWTX = FdtlFWTX.toFixed(2);

						this.DTRetention.getData().DetailesRetention[0].WTX = oFdtlFWTX;
						this.DTRetention.refresh();

						var oNetProgBill = GrossAmount - oFdtlFWTX;
						var ooNetProgBill = Number([oNetProgBill]);
						var soNetProgBill = ooNetProgBill - oProratedDP;
						var osoNetProgBill = Number([soNetProgBill]);
						var sosoNetProgBill = osoNetProgBill - oProratedRetention;
						var oNetDPAmount = Number([sosoNetProgBill]);
						var FNetDPAmount = oNetDPAmount.toFixed(2);

						this.DTRetention.getData().DetailesRetention[0].NetProgress = FNetDPAmount;
						this.DTRetention.refresh();

					}else{
						this.DTRetention.getData().DetailesRetention[0].WTX = 0;
						this.DTRetention.refresh();
						this.onProgressBIll();
					}

				} else {

				}

			}

		},
		//To Get PO Data from GRID
		onGetRetentionProcess: function (sCode, ColType) {
			this.oModelOpenPO = new JSONModel();

			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database +
					"&procName=spAppRetention&queryTag=getPOTransaction&value1=" +
					sCode + "&value2=" + ColType + "&value3=&value4=",
					type: "GET",
					async:false,
					beforeSend: function(xhr) {
						xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:P@ssw0rd805~"));
					},
					error: function(xhr, status, error) {
						MessageToast.show(error);
					},
					success: function(json) {},
					context: this
			}).done(function (results) {
				if (results.length === 0) {
					MessageToast.show("No Retention Row to process");
					//resetting of POFields.json models
					this.fDeleteData();
				} else {
					this.oModelPurchase.setJSON("{\"POFields\" : " + JSON.stringify(results).replace("[", "").replace("]", "") + "}");
					this.getView().setModel(this.oModelPurchase, "oModelPurchase");

					var oRetention = ""; 
					var oDocTotal = ""; 	
					oRetention = this.oModelPurchase.getData().POFields.Price;
					oDocTotal = this.oModelPurchase.getData().POFields.DocTotal;
					this.byId("RentAmount").setValue(oRetention);
					this.byId("Doctotal").setValue(oDocTotal);
				}
			});
		},
		// To Get the Count of Transaction Number
		fGetRetentionProcess: function () {

			var oDatabase = this.Database;

			// Viewing Transaction Number
			this.oTransIDs = new JSONModel();
			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + oDatabase +
					"&procName=spAppRetention&queryTag=getTransCount&value1=&value2=&value3=&value4=",
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
					this.getView().byId("TransNo").setValue(results[0].DocNum);
				}
			});

		},
		// Formula for Retention Amount
		onRetentionAmount: function (oEvent) {

			this.InputHeader.getData().InputHeader.DP = this.getView().byId("DPayment").getValue();
			this.InputHeader.refresh();
			var DPValue = this.InputHeader.getData().InputHeader.DP;

			if (DPValue < 0 || DPValue > 100){
				this.InputHeader.getData().InputHeader.DP = "";
				this.InputHeader.refresh();
				this.getView().byId("DPayment").getValue("");
				this.fDeleteDetailes();
				
			} else {

				if (DPValue === "" || DPValue === "0") {

					this.fDeleteDetailes();
	
				} else {
	
					// // COMPUTATION FOR GROSS AMOUNT
					var PoDocTotal = this.oModelPurchase.getData().POFields.DocTotal;
					var Down_Payment = DPValue;
					var oDowPayment = Down_Payment / 100;
					var oDowPayment1 = Number([oDowPayment]);
					var oDownPayment = oDowPayment1.toFixed(2);
	
					var oToTal = PoDocTotal * oDownPayment;
					var oTotal5 = Number([oToTal]);
					var oTotal4 = oTotal5.toFixed(2);
	
	
					this.DTRetention.getData().DetailesRetention[0].GrossAmount = oTotal4;
					this.DTRetention.refresh();
	
					// //Computation for WTX
	
					var Gross_Amount = this.DTRetention.getData().DetailesRetention[0].GrossAmount;
					var oWTX1 = Gross_Amount / 1.12;
					var sWTHTaxRate = this.oModelPurchase.getData().POFields.Rate;
					var sWTHTaxRate1 = sWTHTaxRate / 100;
					var oTotalWTX = oWTX1 * sWTHTaxRate1;
					var oTotal = Number([oTotalWTX]);
					var FTotalFWTX = oTotal.toFixed(2);
	
					this.DTRetention.getData().DetailesRetention[0].WTX = FTotalFWTX;
					this.DTRetention.refresh();
	
					// //Computation for Net DownPayment Amount
	
					var Total1 = oTotal4;
					var Total2 = FTotalFWTX;
	
					var oNetDP = Total1 - Total2;
	
					this.DTRetention.getData().DetailesRetention[0].NetProgress = oNetDP;
					this.DTRetention.refresh();
				}

			}

		},
		//Formula for Witholding Tax
		onSelectionWTX: function () {

			var TaxType = this.getView().byId("TaxType").getSelectedKey();
			var Transaction_Type = this.getView().byId("TransType").getSelectedKey();
			var oProgType = this.getView().byId("PBType").getSelectedKey();

			if (Transaction_Type === "0") {
				//-----Downpayment WTX------//
			} else if (Transaction_Type === "1") {

				if (oProgType === "1") {

					if (TaxType === "0") {

						var GrossAmount = this.DTRetention.getData().DetailesRetention[0].GrossAmount;
						var oGrossAmout = Number([GrossAmount]);
						var ProratedDP = this.DTRetention.getData().DetailesRetention[0].ProratedDP;
						var oProratedDP = Number([ProratedDP]);
						var ProratedRetention = this.DTRetention.getData().DetailesRetention[0].ProratedRetention;
						var oProratedRetention = Number([ProratedRetention]);
						var fWTHTaxRate = this.oModelPurchase.getData().POFields.Rate;
						var ofWTHTaxRate = Number([fWTHTaxRate]);

						var fGrossCount = ofWTHTaxRate / 100;
						var Wtx1 = oGrossAmout - oProratedDP;
						var Wtx2 = Wtx1 - oProratedRetention;
						var Wtx3 = Wtx2 / 1.12;
						var Wtx4 = Wtx3 * fGrossCount;
						var fooTotal4 = Wtx4.toFixed(2);

						this.DTRetention.getData().DetailesRetention[0].WTX = fooTotal4;
						this.DTRetention.refresh();

						this.onProgressBIll();
					} else {
						this.DTRetention.getData().DetailesRetention[0].WTX = "0";
						this.DTRetention.refresh();

						this.onProgressBIll();
					}

				} else if (oProgType === "2") {

					if (TaxType === "0") {
										// WTAX Formula
						var GrossAmount = this.DTRetention.getData().DetailesRetention[0].GrossAmount;
						var oGrossAmout = Number([GrossAmount]);
						var ProratedDP = this.DTRetention.getData().DetailesRetention[0].ProratedDP;
						var oProratedDP = Number([ProratedDP]);
						var ProratedRetention = this.DTRetention.getData().DetailesRetention[0].ProratedRetention;
						var oProratedRetention = Number([ProratedRetention]);
						var fWTHTaxRate = this.oModelPurchase.getData().POFields.Rate;
						var ofWTHTaxRate = Number([fWTHTaxRate]);

						var fGrossCount = ofWTHTaxRate / 100;
						var Wtx1 = oGrossAmout - oProratedDP;
						var Wtx2 = Wtx1 - oProratedRetention;
						var Wtx3 = Wtx2 / 1.12;
						var Wtx4 = Wtx3 * fGrossCount;
						var fooTotal4 = Wtx4.toFixed(2);

						this.DTRetention.getData().DetailesRetention[0].WTX = fooTotal4;
						this.DTRetention.refresh();

						this.onProgressBIll();

					} else {
						this.DTRetention.getData().DetailesRetention[0].WTX = "0";
						this.DTRetention.refresh();

						this.onProgressBIll();
					}

				} else if (oProgType === "3") {

					if (TaxType === "0") {

						var oFirstBilling_CWIP = this.FirstBilling_CWIP;
						var AllSub_CWIP = this.All_Subsequent_CWIP;
						var PoDocTotal = this.oModelPurchase.getData().POFields.DocTotal;

						var PO_DocTotal = PoDocTotal;
						var ALL_CWIP = oFirstBilling_CWIP + AllSub_CWIP;
						var FsWTHTaxRate = this.oModelPurchase.getData().POFields.Rate;
						var FsGrossCount = FsWTHTaxRate / 100;

						var FWTX1 = PO_DocTotal - ALL_CWIP;
						var FWTX2 = FWTX1 / 1.12;
						var FWTX3 = FWTX2 * FsGrossCount;

						var FTotalFWTX = FWTX3.toFixed(2);

						this.DTRetention.getData().DetailesRetention[0].WTX = FTotalFWTX;
						this.DTRetention.refresh();
						this.onProgressBIll();

						// this.ProgressBillingType();

					} else {
						this.DTRetention.getData().DetailesRetention[0].NetProgress = "0";
						this.DTRetention.getData().DetailesRetention[0].WTX = "0";
						this.DTRetention.refresh();

						this.onProgressBIll();
					}

				}

			} else {
				this.DTRetention.getData().DetailesRetention[0].WTX = "0";
				this.DTRetention.refresh();

				this.onProgressBIll();
			}

		},
		//Get PO Transaction 
		fGetPOTransaction: function (sCode, ColType) {
			this.oModelOpenPO = new JSONModel();

			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database +
					"&procName=spAppRetention&queryTag=getPOTransaction&value1=" +
					sCode + "&value2=" + ColType + "&value3=&value4=",
					type: "GET",
					async:false,
					beforeSend: function(xhr) {
						xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:P@ssw0rd805~"));
					},
					error: function(xhr, status, error) {
						MessageToast.show(error);
					},
					success: function(json) {},
					context: this
			}).done(function (results) {
				this.GLAccount = results[0].AcctCode;
				this.WTCode = results[0].WTCode;
			});
		},
		//Progress Biling Rate Formula
		onProgressBIll: function () {

			this.InputHeader.getData().InputHeader.ProgressBilling = this.getView().byId("ProgBill").getValue();
			this.InputHeader.refresh();
			var PoStatus = this.getView().byId("selectRecordGroup").getSelectedKey();
			var oValue = this.InputHeader.getData().InputHeader.ProgressBilling;

			if (oValue === "") {
				this.fDeleteDetailes();
			} else {

				var Database = this.Database;

				var oProgTypes = this.getView().byId("PBType").getSelectedKey();

				if (oProgTypes === "2") {

					// COMPUTATION FOR GROSS AMOUNT
					var ProgressBill = this.oModelPurchase.getData().POFields.DocTotal;
					var oRate = this.oModelPrograte.getData().Rate.ProgRate;
					var oRate1 = this.InputHeader.getData().InputHeader.ProgressBilling - oRate;
					var oCount = oRate1 / 100;
					var oToTal = ProgressBill * oCount;
					var oTotal4 = oToTal.toFixed(2);
					this.DTRetention.getData().DetailesRetention[0].GrossAmount = oTotal4;
					this.DTRetention.refresh();

				} else {

					// COMPUTATION FOR GROSS AMOUNT
					var ProgressBill = this.oModelPurchase.getData().POFields.DocTotal;
					if (PoStatus === "5") {
						var oProgresBill = this.FinalBillingRate;
					}else{
						var oProgresBill = this.InputHeader.getData().InputHeader.ProgressBilling;
					}
					var oCount = oProgresBill / 100;
					var oToTal = ProgressBill * oCount;
					var oTotal4 = oToTal.toFixed(2);
					this.FinCWIP = oTotal4;
					this.DTRetention.getData().DetailesRetention[0].GrossAmount = oTotal4;
					this.DTRetention.refresh();

				}

				// COMPUTATION FOR PRORATED DOWN PAYMENT
				var oDocEntry = "";
				oDocEntry = this.oModelPurchase.getData().POFields.DocEntry;
				if (oDocEntry === "") {
					oDocEntry = this.oModelUDT.getData().UDTFields.U_App_DocEntry;
				}

				// To get Data in UDT Details
				$.ajax({
					url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database +
						"&procName=spAppRetention&queryTag=getUDTdtls&value1=" +
						oDocEntry +
						"&value2=&value3=&value4=",
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
						this.oAPDocTotal.setJSON("{\"doctotal\" : " + JSON.stringify(results) + "}");
						this.getView().setModel(this.oAPDocTotal, "oAPDocTotal");

						// FRO CWIP COMPUTATOIN
						var ProgType = this.getView().byId("selectRecordGroup").getSelectedKey();

						// First Progress Billing Computation
						if (ProgType !== "5") {

							var oProgTypess = this.getView().byId("PBType").getSelectedKey();

							// if oProgTypess = 'PO with Retention' else 'PO Without Retention' 							
							if (oProgTypess === "2") {

								var RetentionAmount = this.oModelPurchase.getData().POFields.Price;
								var oRates = this.oModelPrograte.getData().Rate.ProgRate;

								var ooDocTotal = this.oAPDocTotal.getData().doctotal[0].U_App_GrossAmnt;
								var oRate1s = this.InputHeader.getData().InputHeader.ProgressBilling - oRates;
								var ooPercent = oRate1s / 100;
								var ooProratedDP = ooDocTotal * ooPercent;
								var oTotals = ooProratedDP.toFixed(2);

							} else {

								var oDocTotal = this.oAPDocTotal.getData().doctotal[0].U_App_GrossAmnt;
								var ProgresBill = this.InputHeader.getData().InputHeader.ProgressBilling;
								var oPercent = ProgresBill / 100;
								var oProratedDP = oDocTotal * oPercent;
								var oTotals = oProratedDP.toFixed(2);

							}

							// if(this.POCount !== "1"){
								this.DTRetention.getData().DetailesRetention[0].ProratedDP = oTotals;
								this.DTRetention.refresh();
							// }

							// if oProgTypess = 'PO with Retention' else 'PO Without Retention' 
							if (oProgTypess === "2") {
								// PRORATED RETENTION COMPUTATION
								var RetentionAmount = this.oModelPurchase.getData().POFields.Price;
								var oRates = this.oModelPrograte.getData().Rate.ProgRate;
								var oRate1s = this.InputHeader.getData().InputHeader.ProgressBilling - oRates;
								var ProgPercent = oRate1s / 100;
								var ProTotal = RetentionAmount * ProgPercent;
								var oProrated = ProTotal.toFixed(2);

							} else {

								// PRORATED RETENTION COMPUTATION
								var RetentionAmount = this.oModelPurchase.getData().POFields.Price;
								var PoProgresBill = this.InputHeader.getData().InputHeader.ProgressBilling;
								var ProgPercent = PoProgresBill / 100;
								var ProTotal = RetentionAmount * ProgPercent;
								var oProrated = ProTotal.toFixed(2);

							}

							if (this.POCount !== "1"){
								this.DTRetention.getData().DetailesRetention[0].ProratedRetention = oProrated;
								this.DTRetention.refresh();
							}


						}

						var oProgType = this.getView().byId("PBType").getSelectedKey();

						// First billing
						if (oProgType === "1") {
							this.onProgressBillingType();
							// Subsequent Billing
						} else if (oProgType === "2") {
							this.fGetRemainingPrograte(oDocEntry);
							this.onProgressBillingType();
							// Final Billing
						} else if (oProgType === "3") {
							// this.fGetRemainingPrograte(oDocEntry);
							this.onProgressBillingType();
						} else {
							//-----Retention-----//
						}

					}
				});
			}

		},
		
		// Formula for Each Progress Billing Type
		onProgressBillingType: function () {

			var Progressive = this.Progressive;

			var ProgType = this.getView().byId("PBType").getSelectedKey();

			// First Progress Billing Computation
			if (ProgType === "1") {

				var TaxType = this.getView().byId("TaxType").getSelectedKey();

				if (TaxType === "0"){
					
				// WTAX Formula
				var GrossAmount = this.DTRetention.getData().DetailesRetention[0].GrossAmount;
				var oGrossAmout = Number([GrossAmount]);
				var ProratedDP = this.DTRetention.getData().DetailesRetention[0].ProratedDP;
				var oProratedDP = Number([ProratedDP]);
				var ProratedRetention = this.DTRetention.getData().DetailesRetention[0].ProratedRetention;
				var oProratedRetention = Number([ProratedRetention]);
				var fWTHTaxRate = this.oModelPurchase.getData().POFields.Rate;
				var ofWTHTaxRate = Number([fWTHTaxRate]);

				var fGrossCount = ofWTHTaxRate / 100;
				var Wtx1 = oGrossAmout - oProratedDP;
				var Wtx2 = Wtx1 - oProratedRetention;
				var Wtx3 = Wtx2 / 1.12;
				var Wtx4 = Wtx3 * fGrossCount;
				var fooTotal4 = Wtx4.toFixed(2);

				this.DTRetention.getData().DetailesRetention[0].WTX = fooTotal4;
				this.DTRetention.refresh();

				}

				// COMPUTATION FOR CWIP
				var PODocTotal = this.oModelPurchase.getData().POFields.DocTotal;
				var ProgresBill = this.InputHeader.getData().InputHeader.ProgressBilling;
				var ProDP = this.DTRetention.getData().DetailesRetention[0].ProratedDP;
				var oProdDP = Number([ProDP]);
				var ProReten = this.DTRetention.getData().DetailesRetention[0].ProratedRetention;
				var oProReten = Number([ProReten]);
				var Grossmount = this.DTRetention.getData().DetailesRetention[0].GrossAmount;
				var oGrossamount = Number([Grossmount]);
				var APDocTotal = this.oAPDocTotal.getData().doctotal[0].U_App_GrossAmnt;

				//Progressive Yes
				if (Progressive === "Yes" ){				

				var oProgbillRate = ProgresBill / 100;
				var CWIP1 = PODocTotal * oProgbillRate;
				var oCWIP1 = Number([CWIP1]);
				var CWIP2 = oCWIP1 - oProdDP;
				var CWIP3 = CWIP2 - oProReten;
				var CWIP4 = CWIP3 + APDocTotal;	
				var CWIP5 = CWIP4 + oProReten;
				this.FirstBillCWIP = Number([CWIP4]);
				var TotalCWIP = CWIP5.toFixed(2);
				this.RetentionYCWIP = TotalCWIP;


				//Progressive No
				}else{

				var oProgbillRate = ProgresBill / 100;
				var CWIP1 = PODocTotal * oProgbillRate;
				var oCWIP1 = Number([CWIP1]);
				var CWIP2 = oCWIP1 - oProdDP;
				var CWIP3 = CWIP2 - oProReten;
				var CWIP4 = CWIP3 + APDocTotal;
				var TotalCWIP = CWIP4.toFixed(2);

				}

				this.DTRetention.getData().DetailesRetention[0].CWIP = TotalCWIP;
				this.DTRetention.refresh();

				// COMPUTATIO FOR NET PROGRESS BILLING AMOUNT

				var GrossAmount = this.DTRetention.getData().DetailesRetention[0].GrossAmount;
				var oGrossAmount = Number([GrossAmount]);
				var WTX = this.DTRetention.getData().DetailesRetention[0].WTX;
				var oWTX = Number([WTX]);
				var ProratedRetetion = this.DTRetention.getData().DetailesRetention[0].ProratedDP;
				var oProratedRetetion = Number([ProratedRetetion]);
				var ProratedDownpayment = this.DTRetention.getData().DetailesRetention[0].ProratedRetention;
				var oProratedDownpayment = Number([ProratedDownpayment]);

				var NetProgress1 = oGrossAmount - oProratedDownpayment;
				var oNerProgress1 = Number([NetProgress1]);
				var NetProgress2 = oNerProgress1 - oProratedRetetion;
				var oNetProgress2 = Number([NetProgress2]);
				var NetProgress3 = oNetProgress2 - oWTX;

				var PBAmtn3 = NetProgress3.toFixed(2);

				this.DTRetention.getData().DetailesRetention[0].NetProgress = PBAmtn3;
				this.DTRetention.refresh();

		//Computation for Subequent Billing
			} else if (ProgType === "2") {

				var TaxType = this.getView().byId("TaxType").getSelectedKey();

				if (TaxType === "0"){
					
				// WTAX Formula
				var GrossAmount = this.DTRetention.getData().DetailesRetention[0].GrossAmount;
				var oGrossAmout = Number([GrossAmount]);
				var ProratedDP = this.DTRetention.getData().DetailesRetention[0].ProratedDP;
				var oProratedDP = Number([ProratedDP]);
				var ProratedRetention = this.DTRetention.getData().DetailesRetention[0].ProratedRetention;
				var oProratedRetention = Number([ProratedRetention]);
				var fWTHTaxRate = this.oModelPurchase.getData().POFields.Rate;
				var ofWTHTaxRate = Number([fWTHTaxRate]);

				var fGrossCount = ofWTHTaxRate / 100;
				var Wtx1 = oGrossAmout - oProratedDP;
				var Wtx2 = Wtx1 - oProratedRetention;
				var Wtx3 = Wtx2 / 1.12;
				var Wtx4 = Wtx3 * fGrossCount;
				var fooTotal4 = Wtx4.toFixed(2);

				this.DTRetention.getData().DetailesRetention[0].WTX = fooTotal4;
				this.DTRetention.refresh();

				}

				// Computation for CWIP

				var oRate = this.oModelPrograte.getData().Rate.ProgRate;
				var oRate1 = this.InputHeader.getData().InputHeader.ProgressBilling - oRate;
				var oProgresBill = oRate1 / 100;

				var PODocTotal = this.oModelPurchase.getData().POFields.DocTotal;
				var ProDP = this.DTRetention.getData().DetailesRetention[0].ProratedDP;
				var oProdDP = Number([ProDP]);
				var ProReten = this.DTRetention.getData().DetailesRetention[0].ProratedRetention;
				var oProReten = Number([ProReten]);
				var Grossmount = this.DTRetention.getData().DetailesRetention[0].GrossAmount;
				var oGrossamount = Number([Grossmount]);
				var APDocTotal = this.oAPDocTotal.getData().doctotal[0].U_App_GrossAmnt;

				//Progressive Yes
				if (Progressive === "Yes" ){

					var CWIP1 = PODocTotal * oProgresBill;
					var oCWIP1 = Number([CWIP1]);
					var CWIP2 = oCWIP1 - oProdDP;
					var CWIP3 = CWIP2 - oProReten;
					var CWIP4 = CWIP3 + oProReten;
					this.SubsequentBillCWIP = Number([CWIP3]);
					var TotalCWIP = CWIP4.toFixed(2);
					this.RetentionYCWIP = TotalCWIP

				//Progressive No
				}else{

					var CWIP1 = PODocTotal * oProgresBill;
					var oCWIP1 = Number([CWIP1]);
					var CWIP2 = oCWIP1 - oProdDP;
					var CWIP3 = CWIP2 - oProReten;
					var TotalCWIP = CWIP3.toFixed(2);

				}

				this.DTRetention.getData().DetailesRetention[0].CWIP = TotalCWIP;
				this.DTRetention.refresh();

				// Computation for Net Progress Billing Amount

				var GrossAmount = this.DTRetention.getData().DetailesRetention[0].GrossAmount;
				var oGrossAmount = Number([GrossAmount]);
				var WTX = this.DTRetention.getData().DetailesRetention[0].WTX;
				var oWTX = Number([WTX]);
				var ProratedRetetion = this.DTRetention.getData().DetailesRetention[0].ProratedDP;
				var oProratedRetetion = Number([ProratedRetetion]);
				var ProratedDownpayment = this.DTRetention.getData().DetailesRetention[0].ProratedRetention;
				var oProratedDownpayment = Number([ProratedDownpayment]);

				var NetProgress1 = oGrossAmount - oProratedDownpayment;
				var oNerProgress1 = Number([NetProgress1]);
				var NetProgress2 = oNerProgress1 - oProratedRetetion;
				var oNetProgress2 = Number([NetProgress2]);
				var NetProgress3 = oNetProgress2 - oWTX;
				var PBAmtn3 = NetProgress3.toFixed(2);

				this.DTRetention.getData().DetailesRetention[0].NetProgress = PBAmtn3;
				this.DTRetention.refresh();

			//Final Billing Computatation
			} else if (ProgType === "3") {

				//PO for DocEntry
				var fDocEntry = this.oModelPurchase.getData().POFields.DocEntry;

				//Get PO Line Total
				this.fgetPOLineTotal(fDocEntry,"C");
				//Get PO Downpayment DocTotal
				var PODownpayment = this.fgetPODownPayment(fDocEntry);
				var oPODownpayment = Number([PODownpayment]);

				//Get First Billing CWIP Not Progressive
				var FirstBillingCWIPNO = this.fgetFirstBillCWIP("getFbCWIP",fDocEntry);
				var oFirstBilling_CWIPNO = Number([FirstBillingCWIPNO]);

				//Get First Billing CWIP Yes Progressive
				var FirstBillingCWIPYES = this.fgetFirstBillCWIP("getFbCWIPYes",fDocEntry);
				var oFirstBilling_CWIPYES = Number([FirstBillingCWIPYES]);

				//Get All Subsequent CWIP Not Progressive
				var AllSubCWIPNO = this.fgetALLSubCWIP("getAllSbCWIP",fDocEntry);
				var oAllSubCWIPNO = Number([AllSubCWIPNO]);

				//Get All Subsequent CWIP Progressive
				var AllSubCWIPYES = this.fgetALLSubCWIP("getAllSbCWIPYes",fDocEntry);
				var oAllSubCWIPYES = Number([AllSubCWIPYES]);

				//Get PO Retention Amount
				var PORetention = this.fgetPORetention(fDocEntry);
				var oPORetention = Number([PORetention]);


				//Computation for CWIP

				//Progressive Yes
				if (Progressive === "Yes" ){

					var oDowPaymentTotal = Number([PODownpayment]);
					var oFirstBilling_CWIP = Number([FirstBillingCWIPNO]);
					var AllSub_CWIP = Number([AllSubCWIPNO]);
					var PoDocTotal = this.oModelPurchase.getData().POFields.DocTotal;
					var Retention_Amount = this.oModelPurchase.getData().POFields.Price;

					// if POCount = "1" Without Retention Amount
					if(this.POCount === "1"){
						var oTotalCWIP = this.FinCWIP;
					}else{
						var fCWIP1 = PoDocTotal - oFirstBilling_CWIP;
						var oTotalCWIP = fCWIP1 - AllSub_CWIP;
					}
				
				}else{

					var oDowPaymentTotal = Number([PODownpayment]);
					var oFirstBilling_CWIP = Number([FirstBillingCWIPNO]);
					var AllSub_CWIP = Number([AllSubCWIPNO]);
					var PoDocTotal = this.oModelPurchase.getData().POFields.DocTotal;
					var Retention_Amount = this.oModelPurchase.getData().POFields.Price;

					// if POCount = "1" Without Retention Amount
					if(this.POCount === "1"){
						var oTotalCWIP = this.FinCWIP;
					}else{
						var fCWIP1 = PoDocTotal - oFirstBilling_CWIP;
						var oTotalCWIP = fCWIP1 - AllSub_CWIP;
					}

				}

				this.DTRetention.getData().DetailesRetention[0].CWIP = oTotalCWIP;
				this.DTRetention.refresh();

				var TaxType = this.getView().byId("TaxType").getSelectedKey();
				

				// if TaxType = 0 No WTX
				if (TaxType === "0") {

					//Progressive Yes
					if (Progressive === "Yes" ){

						// if POCoung = "1" Without Retention Amount
						if(this.POCount === "1"){

							var GrossAmount = this.FinCWIP;
							var sWTHTaxRate = this.oModelPurchase.getData().POFields.Rate;
							var sGrossCount = sWTHTaxRate / 100;

							var FWTX2 = GrossAmount / 1.12;
							var FWTX3 = FWTX2 * sGrossCount;

							var FTotalFWTX = FWTX3.toFixed(2);

						}else {

							var PO_DocTotal = PoDocTotal;
							var ALL_CWIP = oFirstBilling_CWIPYES + oAllSubCWIPYES;
							var sWTHTaxRate = this.oModelPurchase.getData().POFields.Rate;
							var sGrossCount = sWTHTaxRate / 100;

							var FWTX1 = PO_DocTotal - ALL_CWIP;
							var FWTX2 = FWTX1 / 1.12;
							var FWTX3 = FWTX2 * sGrossCount;

							var FTotalFWTX = FWTX3.toFixed(2);

						}



					//Progressive No
					} else {

						// if POCoung = "1" Without Retention Amount
						if(this.POCount === "1"){

							var GrossAmount = this.FinCWIP;
							var sWTHTaxRate = this.oModelPurchase.getData().POFields.Rate;
							var sGrossCount = sWTHTaxRate / 100;

							var FWTX2 = GrossAmount / 1.12;
							var FWTX3 = FWTX2 * sGrossCount;

							var FTotalFWTX = FWTX3.toFixed(2);

						}else {

							var PO_DocTotal = PoDocTotal;
							var ALL_CWIP = oFirstBilling_CWIPNO + oAllSubCWIPNO;
							var sWTHTaxRate = this.oModelPurchase.getData().POFields.Rate;
							var sGrossCount = sWTHTaxRate / 100;

							var FWTX1 = PO_DocTotal - ALL_CWIP;
							var FWTX2 = FWTX1 / 1.12;
							var FWTX3 = FWTX2 * sGrossCount;

							var FTotalFWTX = FWTX3.toFixed(2);

						}

					}

					this.DTRetention.getData().DetailesRetention[0].WTX = FTotalFWTX;
					this.DTRetention.refresh();

				} else {
					this.DTRetention.getData().DetailesRetention[0].NetProgress = "0";
					this.DTRetention.getData().DetailesRetention[0].WTX = "0";
					this.DTRetention.refresh();
				}



				// Computation for Net Progress Billing

				//Progressive Yes
				if (Progressive === "Yes" ){
						
					// var POLineTotal = Number([this.POLineTotal]);
					var FinProgBillingRate = Number([this.FinalBillingRate]);
					var oFinProgBillingRate = FinProgBillingRate / 100;
					var ooFinProgBillingRate = Number([oFinProgBillingRate]);
					var NetProgress = oPORetention * ooFinProgBillingRate;
					var oNetProgress = Number ([NetProgress]);
					this.FinalBillingRetention = oNetProgress;
					// var oGrossAmount = Number([GrossAmount]);

					var CWIP = this.DTRetention.getData().DetailesRetention[0].CWIP;
					var oCWIP = Number([CWIP]);
					var PO_PBWTX = this.DTRetention.getData().DetailesRetention[0].WTX;
					var oPO_PBWTX = Number([PO_PBWTX]);
					var oFInalPB = oCWIP - oNetProgress;
					var ooFInalPB = Number([oFInalPB]);
					var oooFInalPB = Number([ooFInalPB]);
					var ooooFInalPB = oooFInalPB - oPO_PBWTX;
					var oooooFInalPB = Number([ooooFInalPB]);
					var oFinalPOF1 = oooooFInalPB.toFixed(2);
				
				//Progressive No
				}else {
					var PO_ALL_CWIP = this.DTRetention.getData().DetailesRetention[0].CWIP;
					var PO_PBWTX = this.DTRetention.getData().DetailesRetention[0].WTX;
					var oPor = this.oModelPurchase.getData().POFields.Price;
					var oFInalPB = PO_ALL_CWIP - PO_PBWTX;
					var oFinalPOF = oFInalPB - oPor;
					var oFinalPOF1 = oFinalPOF.toFixed(2);
				}

				this.DTRetention.getData().DetailesRetention[0].NetProgress = oFinalPOF1;
				this.DTRetention.refresh();
				this.getView().byId("selectRecordGroup").setValue("");

			}

		},
		//Saving and Getting Data  on Draft
		onSave: function () {
			this.fShowBusyIndicator(4000, 0);
			var TransCode = this.getView().byId("TransNo").getValue();

			//if PO has Draft..Get Data in UDT
			if (this.STatus === "Draft" || this.STatus === "Paid" || this.STatus === "Not yet Paid." || this.STatus === "Done") {
				var oCode = this.oSCode;
				var Status = "";
				var oPoStatus = this.getView().byId("selectRecordGroup").getSelectedKey();

				if (oPoStatus === "0") {
					Status = "DP";
				} else if (oPoStatus === "3") {
					Status = "1stPB";
				} else if (oPoStatus === "4") {
					Status = "SubPB";
				} else if (oPoStatus === "5") {
					Status = "FinPB";
				} else if (oPoStatus === "7") {
					Status = "RentPB";
				}

				this.onGetHeaderUDT(oCode, Status);
				this.onGetDetailsUDT(oCode, Status);

			} else {
			// Proceed Transaction in Draft

				var SupplierCode = this.getView().byId("VenSupCode").getValue();

				if (SupplierCode !== "") {

					var oPoStatus = this.getView().byId("selectRecordGroup").getSelectedKey();
					var CodeH = this.fGenerateUDTCode("GetCode");
					var oPurchase_Order = {};
					var oPurchase_Details = {};

					oPurchase_Order.Code = CodeH;
					oPurchase_Order.Name = CodeH;
					oPurchase_Order.U_App_Vendor = this.oModelPurchase.getData().POFields.CardCode;
					oPurchase_Order.U_App_Name = this.oModelPurchase.getData().POFields.CardName;

					oPurchase_Order.U_App_DocEntry = this.oModelPurchase.getData().POFields.DocEntry;
					oPurchase_Order.U_App_PostDate = this.oModelPurchase.getData().POFields.DocDate;
					oPurchase_Order.U_App_DocNum = this.oModelPurchase.getData().POFields.DocNum;
					oPurchase_Order.U_App_TransNum = this.getView().byId("TransNo").getValue();
					oPurchase_Order.U_App_ContractAmount = this.oModelPurchase.getData().POFields.DocTotal;
					oPurchase_Order.U_App_TransDate = this.fGetTodaysDate();
					oPurchase_Order.U_App_ProgBill = this.InputHeader.getData().InputHeader.ProgressBilling;
					oPurchase_Order.U_App_TransType = this.getView().byId("TransType").getSelectedKey();
					oPurchase_Order.U_App_ProgBill_Type = this.getView().byId("PBType").getSelectedKey();
					oPurchase_Order.U_App_TaxType = this.getView().byId("TaxType").getSelectedKey();
					oPurchase_Order.U_App_Remarks = this.getView().byId("TextArea")._lastValue;
					oPurchase_Order.U_App_RentAmnt = this.oModelPurchase.getData().POFields.Price;
					oPurchase_Order.U_App_BaseAmount = this.InputHeader.getData().InputHeader.BaseAmount;
					oPurchase_Order.U_App_WithTax = this.InputHeader.getData().InputHeader.WTax;
					oPurchase_Order.U_App_File = this.getView().byId("fileUploader").getValue();
					oPurchase_Order.U_App_FileKey = this.FileKey;

					if (oPoStatus === "0") {
						oPurchase_Order.U_App_DocStatus = "DP";
						// oPurchase_Order.U_App_DocStatus = "DP";
					} else if (oPoStatus === "3") {
						oPurchase_Order.U_App_DocStatus = "1stPB";
						//oPurchase_Order.U_App_DocStatus = "1stPB";
					} else if (oPoStatus === "4") {
						oPurchase_Order.U_App_DocStatus = "SubPB";
						//oPurchase_Order.U_App_DocStatus = "SubPB";
					} else if (oPoStatus === "5") {
						oPurchase_Order.U_App_DocStatus = "FinPB";
						//oPurchase_Order.U_App_DocStatus = "FinPB";	
					} else {
						oPurchase_Order.U_App_DocStatus = "RentPB";
						//oPurchase_Order.U_App_DocStatus = "RentPB";
					}

					var DP = this.InputHeader.getData().InputHeader.DP;

					if (DP === "") {
						oPurchase_Order.U_App_DwnPymnt = 0.0;
					} else {
						oPurchase_Order.U_App_DwnPymnt = this.InputHeader.getData().InputHeader.DP;
					}

					oPurchase_Order.U_App_CreatedDate = this.fGetTodaysDate();
					oPurchase_Order.U_App_CreatedBy = this.UserNmae;

					var batchArray = [
						//directly insert data if data is single row per table 
						{
							"tableName": "U_APP_ORPT",
							"data": oPurchase_Order
						}
					];

					var d, i;
					var row;
					var code = "";

					for (d = 0; d < this.DTRetention.getData().DetailesRetention.length; d++) {

						var iLineNumDP = d + 1;

						code = this.fGenerateUDTCode("GetCode");
						oPurchase_Details.Code = code;
						oPurchase_Details.Name = code;
						// oPurchase_Details.U_App_DocNum = "1";//this.oMdlEditRecord.getData().allopenAP[d].DocumentNo;
						oPurchase_Details.U_App_CWIP = this.DTRetention.getData().DetailesRetention[0].CWIP;
						oPurchase_Details.U_App_GrossAmnt = this.DTRetention.getData().DetailesRetention[0].GrossAmount;
						oPurchase_Details.U_App_ProReten = this.DTRetention.getData().DetailesRetention[0].ProratedRetention;
						oPurchase_Details.U_App_TransNum = this.getView().byId("TransNo").getValue();
						oPurchase_Details.U_App_NetProgBill = this.DTRetention.getData().DetailesRetention[0].NetProgress;
						oPurchase_Details.U_App_WTax = this.DTRetention.getData().DetailesRetention[0].WTX;
						oPurchase_Details.U_App_ProDP = this.DTRetention.getData().DetailesRetention[0].ProratedDP;
						oPurchase_Details.U_App_DocEntry = this.oModelPurchase.getData().POFields.DocEntry;
						oPurchase_Details.U_App_LineNum = iLineNumDP;

						if (oPoStatus === "0") {
							oPurchase_Details.U_App_DocStatus = "DP";
							//oPurchase_Details.U_App_DocStatus = "DP";
						} else if (oPoStatus === "3") {
							oPurchase_Details.U_App_DocStatus = "1stPB";
							//oPurchase_Details.U_App_DocStatus = "1stPB";
						} else if (oPoStatus === "4") {
							oPurchase_Details.U_App_DocStatus = "SubPB";
							//oPurchase_Details.U_App_DocStatus = "SubPB";
						} else if (oPoStatus === "5") {
							oPurchase_Details.U_App_DocStatus = "FinPB";
							//oPurchase_Details.U_App_DocStatus = "FinPB";
						} else {
							oPurchase_Details.U_App_DocStatus = "RentPB";
							//oPurchase_Details.U_App_DocStatus = "RentPB";
						}

						batchArray.push(JSON.parse(JSON.stringify(({
							"tableName": "U_APP_RPT1",
							"data": oPurchase_Details //this.fGenerateUDTCode();
						}))));

					}

					var sBodyRequest = this.fPrepareBatchRequestBody(batchArray);
					// Post Draft Using Batch
					$.ajax({
						url: "https://18.136.35.41:50000/b1s/v1/$batch",
						type: "POST",
						contentType: "multipart/mixed;boundary=a",
						data: sBodyRequest,
						xhrFields: {
							withCredentials: true
						},
						error: function (xhr, status, error) {
							//this.oPage.setBusy(false);
							sap.m.MessageToast.show(xhr.responseText);
						},
						success: function (json) {
							//this.oPage.setBusy(false);
						},
						context: this

					}).done(function (results) {
						if(JSON.stringify(results).search("400 Bad") !== -1) {
							var oStartIndex = results.search("value") + 10;
							var oEndIndex = results.indexOf("}") - 8;
							var oMessage = results.substring(oStartIndex,oEndIndex);
							AppUI5.fErrorLogs("U_APP_ORPT","Add Draft",TransCode,"null",oMessage,"Retention Add Draft",this.UserNmae,"null",this.Database,sBodyRequest);
							console.log(oMessage);
							sap.m.MessageToast.show(oMessage);
							this.fHideBusyIndicator();
						}else{
							if (results) {
								var oTag = this.Tag;
								if (oTag !== "0") {
									sap.m.MessageToast.show("Save as Draft!");
									this.fHideBusyIndicator();
									this.Tag = "";
								}
								this.Tag = "";
								this.fHideBusyIndicator();
								this.fDeleteData();
							}
						}
					});

				} else {
					sap.m.MessageToast.show("No Data to Post in SAP");
					this.fHideBusyIndicator();
				}
			}

		},
		//Prepare Value fot UDF Code
		fGenerateUDTCode: function (docType) {

			var generatedCode = "";

			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database + "&procName=SPAPP_GENERATENUMBER&DocType=" + docType,
				type: "GET",
				async: false,
				beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:P@ssw0rd805~"));
			  	},

				error: function (xhr, status, error) {
					jQuery.sap.log.error("This should never have happened!");
				},
				success: function (json) {
					generatedCode = json[0][""];

				},
				context: this
			}).done(function (results) {
				if (results) {
					generatedCode = results[0][""];
				}
			});
			return generatedCode;
		},
		//Date Value
		fGetTodaysDate: function () {
			var today = new Date();
			var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
			return date;
		},
		//Batch Request for Saving Draft
		fPrepareBatchRequestBody: function (oRequest) {

			var batchRequest = "";

			var beginBatch = "--a\nContent-Type: multipart/mixed;boundary=b\n\n";
			var endBatch = "--b--\n--a--";

			batchRequest = batchRequest + beginBatch;

			var objectUDT = "";
			for (var i = 0; i < oRequest.length; i++) {

				objectUDT = oRequest[i];
				batchRequest = batchRequest + "--b\nContent-Type:application/http\nContent-Transfer-Encoding:binary\n\n";
				batchRequest = batchRequest + "POST /b1s/v1/" + objectUDT.tableName;
				batchRequest = batchRequest + "\nContent-Type: application/json\n\n";
				batchRequest = batchRequest + JSON.stringify(objectUDT.data) + "\n\n";
			}

			batchRequest = batchRequest + endBatch;

			return batchRequest;

		},
		//Update Data on Draft
		onUpdate: function (oHeaderCode, oDetaileCode) {

			//-------Update Header
			var oHeader = {};

			var Transcode = this.getView().byId("TransNo").getValue();

			oHeader.U_App_PostDate = this.oModelPurchase.getData().POFields.DocDate;
			var DP = this.InputHeader.getData().InputHeader.DP;

			if (DP === "") {
				oHeader.U_App_DwnPymnt = 0;
			} else {
				oHeader.U_App_DwnPymnt = this.InputHeader.getData().InputHeader.DP;
			}
			oHeader.U_App_TaxType = this.getView().byId("TaxType").getSelectedKey();
			oHeader.U_App_ProgBill = this.InputHeader.getData().InputHeader.ProgressBilling;
			oHeader.U_App_Remarks = this.getView().byId("TextArea")._lastValue;
			oHeader.U_App_UpdatedBy = this.UserNmae;
			oHeader.U_App_UpdatedDate = this.fGetTodaysDate();
			oHeader.U_App_BaseAmount = this.InputHeader.getData().InputHeader.BaseAmount;
			oHeader.U_App_WithTax = this.InputHeader.getData().InputHeader.WTax;
			oHeader.U_App_File = this.getView().byId("fileUploader").getValue();
			oHeader.U_App_FileKey = this.FileKey;



			$.ajax({

				url: "https://18.136.35.41:50000/b1s/v1/U_APP_ORPT('" + oHeaderCode + "')",
				data: JSON.stringify(oHeader),
				type: "PATCH",
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					var ErrorMassage = xhr.responseJSON["error"].message.value;
					sap.m.MessageToast.show(ErrorMassage);
					console.error(ErrorMassage);
					AppUI5.fErrorLogs("U_APP_ORPT","Add GRPO",Transcode,"null",ErrorMassage,"Retention Adding GRPO",this.UserNmae,"null",this.Database,JSON.stringify(oHeader));
					this.fHideBusyIndicator();
				},
				context: this,
				success: function (json) {}
			}).done(function (results) {

				//-------Update DeTailes
				var Detailes = {};

				var CWIP = this.DTRetention.getData().DetailesRetention[0].CWIP;
				var GrossAmount = this.DTRetention.getData().DetailesRetention[0].GrossAmount;
				var WTX = this.DTRetention.getData().DetailesRetention[0].WTX;
				var ProDP = this.DTRetention.getData().DetailesRetention[0].ProratedDP;
				var ProReten = this.DTRetention.getData().DetailesRetention[0].ProratedRetention;
				var NetBill = this.DTRetention.getData().DetailesRetention[0].NetProgress;

				if (CWIP === "") {
					Detailes.U_App_CWIP = 0;
				} else {
					Detailes.U_App_CWIP = this.DTRetention.getData().DetailesRetention[0].CWIP;
				}

				if (GrossAmount === "") {
					Detailes.U_App_GrossAmnt = 0;
				} else {
					Detailes.U_App_GrossAmnt = this.DTRetention.getData().DetailesRetention[0].GrossAmount;
				}

				if (WTX === "") {
					Detailes.U_App_WTax = 0;
				} else {
					Detailes.U_App_WTax = this.DTRetention.getData().DetailesRetention[0].WTX;
				}

				if (ProDP === "") {
					Detailes.U_App_ProDP = 0;
				} else {
					Detailes.U_App_ProDP = this.DTRetention.getData().DetailesRetention[0].ProratedDP;
				}

				if (ProReten === "") {
					Detailes.U_App_ProReten = 0;
				} else {
					Detailes.U_App_ProReten = this.DTRetention.getData().DetailesRetention[0].ProratedRetention;
				}

				if (NetBill === "") {
					Detailes.U_App_NetProgBill = 0;
				} else {
					Detailes.U_App_NetProgBill = this.DTRetention.getData().DetailesRetention[0].NetProgress;
				}

				$.ajax({

					url: "https://18.136.35.41:50000/b1s/v1/U_APP_RPT1('" + oDetaileCode + "')",
					data: JSON.stringify(Detailes),
					type: "PATCH",
					xhrFields: {
						withCredentials: true
					},
					error: function (xhr, status, error) {
						var ErrorMassage = xhr.responseJSON["error"].message.value;
						sap.m.MessageToast.show(ErrorMassage);
						console.error(ErrorMassage);
						AppUI5.fErrorLogs("U_APP_RPT1","Add GRPO",Transcode,"null",ErrorMassage,"Retention Adding GRPO",this.UserNmae,"null",this.	Database,JSON.stringify(Detailes));
						this.fHideBusyIndicator();
					},
					context: this,
					success: function (json) {
						sap.m.MessageToast.show("Updated Successfully");
						this.fHideBusyIndicator();
					}
				}).done(function (results1) {
					if (results1) {
						sap.m.MessageToast.show("Updated Successfully");
						this.fHideBusyIndicator();
					}
				});
				// 	this.fDeleteData();
			});

		},
		// To Get Data From Header UDT
		onGetHeaderUDT: function (sCode, oDocStatus) {
			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database + "&procName=spAppRetention&queryTag=getUDThdr&value1=" +
					sCode +
					"&value2=" + oDocStatus + "&value3=&value4=",
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
				this.HeaderCode = results[0].Code;
			});
		},
		// To Get Data from Detailes UDT
		onGetDetailsUDT: function (sCode, oDocStatus) {
			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database + "&procName=spAppRetention&queryTag=getUDTdtl&value1=" +
					sCode +
					"&value2=" + oDocStatus + "&value3=&value4=",
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
				this.DetailesCode = results[0].Code;
				this.onUpdate(this.HeaderCode, this.DetailesCode);
			});
		},
		//Saving Process in SAP
		onAddingSAP: function () {

			this.fShowBusyIndicator(4000, 0);

			var SupplierCode = this.getView().byId("VenSupCode").getValue();

			if (SupplierCode !== "") {

				var PoStatus = this.getView().byId("selectRecordGroup").getSelectedKey();

				if (PoStatus === "0") {
					this.onSavingDownPayment();
					this.Tag = "0";

					if (this.STatus !== "Draft") {
						this.onSave();
					}
					this.fDeleteData();
					this.fDeleteDetailes();

				} else {

					var ProgType = this.getView().byId("PBType").getSelectedKey();

					if (ProgType === "0") {

					} else if (ProgType === "1") {
						this.onSavingFirstProgressBilling();
					} else if (ProgType === "2") {
						this.onSavingSubsequentBilling();
					} else if (ProgType === "3") {
						this.onSavingFinalBilling();
						if (this.POCount === "1"){
							this.onSave();
						}
						this.fDeleteData();
						
					// else if (ProgType === "4")
					//Retention Posting
					} else {
						this.onSavingRetention();
						this.Tag = "0";
						if (this.STatus !== "Draft") {
							this.onSave();
						}
						this.fDeleteData();
					}
					
				}

			} else {
				sap.m.MessageToast.show("No Data to Post in SAP");
				this.fDeleteData();
			}

		},
		//Saving DownPayment in SAP
		onSavingDownPayment: function () {
			this.fShowBusyIndicator(4000, 0);
			var Transcode = this.getView().byId("TransNo").getValue();

			var SupplierCode = this.getView().byId("VenSupCode").getValue();

			if (SupplierCode === "") {
				sap.m.MessageToast.show("No Data to Post in SAP");
				this.fHideBusyIndicator();
			} else {

				var oAPDown = {};
				var oAPLines = {};
				var oAPINVWTlines = {};
				var oAPDPlines = {};

				var CardCode = this.oModelPurchase.getData().POFields.CardCode;

				oAPDown.CardCode = CardCode;
				oAPDown.DocDate = this.oModelPurchase.getData().POFields.DocDate;
				oAPDown.DocType = "S";
				oAPDown.Comments = this.getView().byId("TextArea").getValue();
				oAPDown.U_APP_RETTranstype = 1;
				oAPDown.DownPaymentType = "dptInvoice";
				oAPDown.U_APP_IsForRetention = "Y";
				oAPDown.U_APP_GrossAmount = this.DTRetention.getData().DetailesRetention[0].GrossAmount;
				oAPDown.U_APP_WTX = this.DTRetention.getData().DetailesRetention[0].WTX;
				oAPDown.U_APP_DPAmount = this.DTRetention.getData().DetailesRetention[0].NetProgress;
				oAPDown.AttachmentEntry = this.FileKey;
				oAPDown.U_APP_DPNature = "DP001";
				oAPDown.U_APP_PODocEntry = this.PO_DocEntry;

				oAPDown.DocumentLines = [];

				oAPLines.BaseLine = 0;
				oAPLines.BaseEntry = this.oModelPurchase.getData().POFields.DocEntry;
				oAPLines.BaseType = 22;
				oAPLines.WTLiable = "tNO";
				oAPLines.VatGroup = "IVAT-EXC";
				oAPLines.UnitPrice = this.oModelPurchase.getData().POFields.DocTotal;
				oAPLines.U_APP_RtnRowType = "C";
				oAPDown.DownPaymentPercentage = this.InputHeader.getData().InputHeader.DP;
				oAPDown.U_APP_ProgBillRate = this.InputHeader.getData().InputHeader.DP;

				oAPDown.DocumentLines.push(oAPLines);

				var APWTCode = this.oModelPurchase.getData().POFields.WTCode;
				var APWTX = this.DTRetention.getData().DetailesRetention[0].WTX;

				oAPDown.WithholdingTaxDataCollection = [];
				oAPINVWTlines.WTCode = APWTCode;
				oAPINVWTlines.WTAmount = APWTX;

				oAPDown.WithholdingTaxDataCollection.push(oAPINVWTlines);

				// POsting DownPayment in SAP
				$.ajax({
					url: "https://18.136.35.41:50000/b1s/v1/PurchaseDownPayments",
					data: JSON.stringify(oAPDown),
					type: "POST",
					xhrFields: {
						withCredentials: true
					},
					error: function (xhr, status, error) {
						var ErrorMassage = xhr.responseJSON["error"].message.value;
						sap.m.MessageToast.show(ErrorMassage);
						this.fHideBusyIndicator();
						console.error(ErrorMassage);
						AppUI5.fErrorLogs("ODPO & DPO1","Add DownPayment","null","null",ErrorMassage,"Retention Adding DownPayment",this.UserNmae,"null",this.Database,JSON.stringify(oAPDown));
					},
					context: this,
					success: function (json) {}
				}).done(function (results) {
					if (results) {
						sap.m.MessageToast.show("DocNum #" + results.DocNum + " Added Successfully");
						this.fHideBusyIndicator();
					}
				});
			}
		},
		//Saving First Progress Billing in SAP
		onSavingFirstProgressBilling: function () {
			this.fShowBusyIndicator(4000, 0);
			var oDatabase = this.Database;
			var Transcode = this.getView().byId("TransNo").getValue();

			var SupplierCode = this.getView().byId("VenSupCode").getValue();

			if (SupplierCode === "") {
				sap.m.MessageToast.show("No Data to Post in SAP");
				this.fHideBusyIndicator();
			} else {

				// ADDING GRPO
				var oFGRPO = {};
				var oFGRPOLines = {};

				var oGlAccount = this.oModelPurchase.getData().POFields.AcctCode;
				var GRPOCardCode = this.oModelPurchase.getData().POFields.CardCode;

				oFGRPO.CardCode = GRPOCardCode;
				oFGRPO.DocType = "dDocument_Service";
				oFGRPO.Comments = this.getView().byId("TextArea").getValue();
				oFGRPO.U_APP_RETTranstype = 2;
				oFGRPO.U_APP_IsForRetention = "Y";
				oFGRPO.U_APP_ProgBillRate = this.InputHeader.getData().InputHeader.ProgressBilling;
				oFGRPO.U_APP_PODocEntry = this.PO_DocEntry;

				oFGRPO.DocumentLines = [];

				oFGRPOLines.BaseLine = 0;
				oFGRPOLines.BaseEntry = this.oModelPurchase.getData().POFields.DocEntry;
				oFGRPOLines.BaseType = 22;

				var GrossAmount = this.DTRetention.getData().DetailesRetention[0].GrossAmount;
				var oGrossAmount = Number([GrossAmount]);
				var ProratedDP = this.DTRetention.getData().DetailesRetention[0].ProratedRetention;
				var oProratedDP = Number([ProratedDP]);
				var UnitPrice = oGrossAmount - oProratedDP;
				var oUnitPrice = Number([UnitPrice]);
				var TotalPrice = oUnitPrice.toFixed(2);

				oFGRPOLines.UnitPrice = TotalPrice;
				oFGRPOLines.VatGroup = "IVAT-EXC";
				oFGRPOLines.U_APP_RtnRowType = "C";
				oFGRPOLines.WTLiable = "tNO";

				oFGRPO.DocumentLines.push(oFGRPOLines);

				this.oModelGRPO = new JSONModel();

				var PoDocEntry = this.oModelPurchase.getData().POFields.DocEntry;
				var INVGRPOCardCode = this.oModelPurchase.getData().POFields.CardCode;
				var APWTCode = this.oModelPurchase.getData().POFields.WTCode;
				var APRemarks = this.getView().byId("TextArea").getValue();
				var APUnitPrice = this.DTRetention.getData().DetailesRetention[0].CWIP;
				var APWTX = this.DTRetention.getData().DetailesRetention[0].WTX;

				var oCWIP = this.DTRetention.getData().DetailesRetention[0].CWIP;
				var nCWIP = Number([oCWIP]);
				var oGrossAmount = this.DTRetention.getData().DetailesRetention[0].GrossAmount;
				var nGrossAmount = Number([oGrossAmount]);
				var oWTX = this.DTRetention.getData().DetailesRetention[0].WTX;
				var nWTX = Number([oWTX]);
				var oProratedDP = this.DTRetention.getData().DetailesRetention[0].ProratedDP;
				var nProratedDP = Number([oProratedDP]);
				var oProRetention = this.DTRetention.getData().DetailesRetention[0].ProratedRetention;
				var nProRetention = Number([oProRetention]);
				var oProgBill = this.DTRetention.getData().DetailesRetention[0].NetProgress;
				var nProgBill = Number([oProgBill]);

				//Posting GRPO in SAP
				$.ajax({
					url: "https://18.136.35.41:50000/b1s/v1/PurchaseDeliveryNotes",
					data: JSON.stringify(oFGRPO),
					type: "POST",
					async:false,
					xhrFields: {
						withCredentials: true
					},
					error: function (xhr, status, error) {
						var ErrorMassage = xhr.responseJSON["error"].message.value;
						sap.m.MessageToast.show(ErrorMassage);
						this.fHideBusyIndicator();
						console.error(ErrorMassage);
						AppUI5.fErrorLogs("OPDN & PDN1","Add GRPO","null","null",ErrorMassage,"Retention Adding GRPO",this.UserNmae,"null",this.Database,JSON.stringify(oFGRPO));
					},
					context: this,
					success: function (json) {}
				}).done(function (results) {
					if (results) {

						// A/P Invoice Posting

						var GRPODocEntry = results.DocEntry;

						this.oModelAPINV = new JSONModel();
						$.ajax({
							url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + oDatabase + "&procName=spAppRetention&	queryTag=getAPINVDoc&value1=" + PoDocEntry + "&value2=&value3=&value4=",
							type: "GET",
							async:false,
							beforeSend: function (xhr) {
								xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:P@ssw0rd805~"));
							  },
							error: function (xhr, status, error) {
								MessageToast.show(error);
								this.fHideBusyIndicator();
							},
							success: function (json) {},
							context: this
						}).done(function (FirstProgress) {
							if (FirstProgress) {

								var DpDocEntry = FirstProgress[0].DocEntry;
								var DpDocNum = 	 FirstProgress[0].DocNum;
								var DPDocTotal = FirstProgress[0].DocTotal;

								var oAPINV = {};
								var oAPINVlines1 = {};
								var oAPINVlines2 = {};
								var oAPDPlines = {};
								var oAPINVWTlines = {};

								oAPINV.CardCode = INVGRPOCardCode;
								oAPINV.DocType = "dDocument_Service";
								oAPINV.Comments = APRemarks;
								oAPINV.U_APP_RETTranstype = 2;

								if (this.Progressive === "Yes" ){
									oAPINV.U_APP_YCWIP = this.RetentionYCWIP;
								}

								oAPINV.U_APP_CWIP = this.FirstBillCWIP;
								oAPINV.U_APP_GrossAmount = nGrossAmount;
								oAPINV.U_APP_WTX = nWTX;
								oAPINV.U_APP_IsForRetention = "Y";
								oAPINV.U_APP_ProratedDP = nProratedDP;
								oAPINV.U_APP_ProRetention = nProRetention;
								oAPINV.U_APP_ProgBillAmount = nProgBill;
								oAPINV.U_APP_DocEntry = this.DocEntry;
								oAPINV.AttachmentEntry = this.FileKey;
								oAPINV.U_APP_PODocEntry = this.PO_DocEntry;

								// Progressive YES
								if (this.Progressive === "Yes"){

									oAPINV.DocumentLines = [];

									oAPINVlines1.BaseType = 20;
									oAPINVlines1.BaseEntry = GRPODocEntry;
									oAPINVlines1.BaseLine = 0;
									oAPINVlines1.Price = 0;
									oAPINVlines1.PriceAfterVAT = 0;
									oAPINVlines1.UnitPrice = APUnitPrice;
									oAPINVlines1.U_APP_RtnRowType = "C";
									oAPINV.DocumentLines.push(oAPINVlines1);

									oAPINVlines2.BaseType = "";
									oAPINVlines2.BaseEntry = "";
									oAPINVlines2.BaseLine = "";
									oAPINVlines2.AccountCode = oGlAccount;
									oAPINVlines2.Price = 0;
									oAPINVlines2.PriceAfterVAT = 0;

									var UnitPrice = -1 * nProRetention;
									var oUnitPrice = Number([UnitPrice]);
									oAPINVlines2.UnitPrice = oUnitPrice;
									oAPINVlines2.VatGroup = "IVAT-EXC";
									oAPINVlines2.U_APP_RtnRowType = "R";
									oAPINV.DocumentLines.push(oAPINVlines2);


								// Progressive NO
								}else{

									oAPINV.DocumentLines = [];

									oAPINVlines1.BaseType = 20;
									oAPINVlines1.BaseEntry = GRPODocEntry;
									oAPINVlines1.BaseLine = 0;
									oAPINVlines1.Price = 0;
									oAPINVlines1.PriceAfterVAT = 0;
									oAPINVlines1.UnitPrice = APUnitPrice;
									oAPINVlines1.U_APP_RtnRowType = "C";
								
									oAPINV.DocumentLines.push(oAPINVlines1);

								}

								oAPINV.DownPaymentsToDraw = [];

								oAPDPlines.DocEntry = DpDocEntry;
								oAPDPlines.DocNumber = DpDocNum;
								oAPDPlines.AmountToDraw = this.oAPDocTotal.getData().doctotal[0].U_App_GrossAmnt;
								oAPDPlines.DownPaymentType = "dptInvoice";

								oAPINV.DownPaymentsToDraw.push(oAPDPlines);

								oAPINV.WithholdingTaxDataCollection = [];
								oAPINVWTlines.WTCode = APWTCode;
								oAPINVWTlines.WTAmount = APWTX;

								oAPINV.WithholdingTaxDataCollection.push(oAPINVWTlines);

								//Posting A/P Invoice in SAP
								$.ajax({
									url: "https://18.136.35.41:50000/b1s/v1/PurchaseInvoices",
									data: JSON.stringify(oAPINV),
									type: "POST",
									async:false,
									xhrFields: {
										withCredentials: true
									},
									error: function (xhr, status, error) {
										var ErrorMassage = xhr.responseJSON["error"].message.value;
										sap.m.MessageToast.show(ErrorMassage);
										this.fHideBusyIndicator();
										console.error(ErrorMassage);
										AppUI5.fErrorLogs("OPCH & PCH1","Add A/P Invoice","null","null",ErrorMassage,"Retention Adding A/P Invoice",this.UserNmae,"null",this.Database,JSON.stringify(oAPINV));
									},
									context: this,
									success: function (json) {}
								}).done(function (results) {
									if (results) {
										sap.m.MessageToast.show("DocNum# " + results.DocNum + " Added Successfully");
										this.fHideBusyIndicator();
										this.Progressive = "";
									}
								
								}); 

							}

						});

					}
				});
			}
			this.fDeleteData();
		},
		//Saving Subsequent Billing in SAP
		onSavingSubsequentBilling: function () {
			this.fShowBusyIndicator(4000, 0);
			var oDatabase = this.Database;
			var SupplierCode = this.getView().byId("VenSupCode").getValue();
			var Transcode = this.getView().byId("TransNo").getValue();

			if (SupplierCode === "") {
				sap.m.MessageToast.show("No Data to Post in SAP");
				this.fHideBusyIndicator();
			} else {

				var oFGRPO = {};
				var oFGRPOLines = {};

				var oGlAccount = this.oModelPurchase.getData().POFields.AcctCode;
				var GRPOCardCode = this.oModelPurchase.getData().POFields.CardCode;

				oFGRPO.CardCode = GRPOCardCode;
				oFGRPO.DocType = "dDocument_Service";
				oFGRPO.Comments = this.getView().byId("TextArea").getValue();
				oFGRPO.U_APP_IsForRetention = "Y";
				oFGRPO.U_APP_RETTranstype = 3;
				var oRate = this.oModelPrograte.getData().Rate.ProgRate;
				var oRate1 = this.InputHeader.getData().InputHeader.ProgressBilling - oRate;
				oFGRPO.U_APP_ProgBillRate = oRate1;
				oFGRPO.DocumentLines = [];

				oFGRPOLines.BaseLine = 0;
				oFGRPOLines.BaseEntry = this.oModelPurchase.getData().POFields.DocEntry;
				oFGRPOLines.BaseType = 22;

				var GrossAmount = this.DTRetention.getData().DetailesRetention[0].GrossAmount;
				var oGrossAmount = Number([GrossAmount]);
				var ProratedDP = this.DTRetention.getData().DetailesRetention[0].ProratedRetention;
				var oProratedDP = Number([ProratedDP]);
				var UnitPrice = oGrossAmount - oProratedDP;
				var oUnitPrice = Number([UnitPrice]);
				var TotalPrice = oUnitPrice.toFixed(2);

				oFGRPOLines.UnitPrice = TotalPrice;
				oFGRPOLines.VatGroup = "IVAT-EXC";
				oFGRPOLines.U_APP_RtnRowType = "C";
				oFGRPOLines.WTLiable = "tNO";

				oFGRPO.DocumentLines.push(oFGRPOLines);

				var PoDocEntry = this.oModelPurchase.getData().POFields.DocEntry;
				var INVGRPOCardCode = this.oModelPurchase.getData().POFields.CardCode;
				var APWTCode = this.oModelPurchase.getData().POFields.WTCode;
				var APRemarks = this.getView().byId("TextArea").getValue();
				var APUnitPrice = this.DTRetention.getData().DetailesRetention[0].CWIP;
				var APWTX = this.DTRetention.getData().DetailesRetention[0].WTX;

				var oCWIP = this.DTRetention.getData().DetailesRetention[0].CWIP;
				var nCWIP = Number([oCWIP]);
				var oGrossAmount = this.DTRetention.getData().DetailesRetention[0].GrossAmount;
				var nGrossAmount = Number([oGrossAmount]);
				var oWTX = this.DTRetention.getData().DetailesRetention[0].WTX;
				var nWTX = Number([oWTX]);
				var oProratedDP = this.DTRetention.getData().DetailesRetention[0].ProratedDP;
				var nProratedDP = Number([oProratedDP]);
				var oProRetention = this.DTRetention.getData().DetailesRetention[0].ProratedRetention;
				var nProRetention = Number([oProRetention]);
				var oProgBill = this.DTRetention.getData().DetailesRetention[0].NetProgress;
				var nProgBill = Number([oProgBill]);

				//Posting GRPO in SAP
				$.ajax({
					url: "https://18.136.35.41:50000/b1s/v1/PurchaseDeliveryNotes",
					data: JSON.stringify(oFGRPO),
					type: "POST",
					async:false,
					xhrFields: {
						withCredentials: true
					},
					error: function (xhr, status, error) {
						var ErrorMassage = xhr.responseJSON["error"].message.value;
						sap.m.MessageToast.show(ErrorMassage);
						this.fHideBusyIndicator();
						console.error(ErrorMassage);
						AppUI5.fErrorLogs("OPDN & PDN1","Add GRPO","null","null",ErrorMassage,"Retention Adding GRPO",this.UserNmae,"null",this.Database,JSON,stringify(oFGRPO));
					},
					context: this,
					success: function (json) {}
				}).done(function (results) {
					if (results) {

						// ADDING A/P INVOICE
						var GRPODocEntry = results.DocEntry;

								var DpDocEntry = results.DocEntry;
								var DpDocNum = 	 results.DocNum;
								var DPDocTotal = results.DocTotal;

								var oAPINV = {};
								var oAPINVlines1 = {};
								var oAPINVlines2 = {};
								var oAPINVWTlines = {};

								oAPINV.CardCode = INVGRPOCardCode;
								oAPINV.DocType = "dDocument_Service";
								oAPINV.Comments = APRemarks;
								oAPINV.U_APP_IsForRetention = "Y";
								oAPINV.U_APP_RETTranstype = 3;

								if (this.Progressive === "Yes" ){
									oAPINV.U_APP_YCWIP = this.RetentionYCWIP;
								}

								oAPINV.U_APP_CWIP = this.SubsequentBillCWIP;
								oAPINV.U_APP_GrossAmount = nGrossAmount;
								oAPINV.U_APP_WTX = nWTX;
								oAPINV.U_APP_ProratedDP = nProratedDP;
								oAPINV.U_APP_ProRetention = nProRetention;
								oAPINV.U_APP_ProgBillAmount = nProgBill;
								oAPINV.U_APP_DocEntry = this.DocEntry;
								oAPINV.AttachmentEntry = this.FileKey;
								oAPINV.U_APP_PODocEntry = this.PO_DocEntry;

								// Progressive YES
								if (this.Progressive === "Yes"){

									oAPINV.DocumentLines = [];

									oAPINVlines1.BaseType = 20;
									oAPINVlines1.BaseEntry = GRPODocEntry;
									oAPINVlines1.BaseLine = 0;
									oAPINVlines1.Price = 0;
									oAPINVlines1.PriceAfterVAT = 0;
									oAPINVlines1.UnitPrice = APUnitPrice;
									oAPINVlines1.U_APP_RtnRowType = "C";
									oAPINV.DocumentLines.push(oAPINVlines1);

									oAPINVlines2.BaseType = "";
									oAPINVlines2.BaseEntry = "";
									oAPINVlines2.BaseLine = "";
									oAPINVlines2.AccountCode = oGlAccount;
									oAPINVlines2.Price = 0;
									oAPINVlines2.PriceAfterVAT = 0;

									var UnitPrice = -1 * nProRetention;
									var oUnitPrice = Number([UnitPrice]);
									oAPINVlines2.UnitPrice = oUnitPrice;
									oAPINVlines2.VatGroup = "IVAT-EXC";
									oAPINVlines2.U_APP_RtnRowType = "R";
									oAPINV.DocumentLines.push(oAPINVlines2);


								// Progressive NO
								}else{

									oAPINV.DocumentLines = [];
									oAPINVlines1.BaseType = 20;
									oAPINVlines1.BaseEntry = GRPODocEntry;
									oAPINVlines1.BaseLine = 0;
									oAPINVlines1.Price = 0;
									oAPINVlines1.PriceAfterVAT = 0;
									oAPINVlines1.UnitPrice = APUnitPrice;
									oAPINVlines1.U_APP_RtnRowType = "C";
									oAPINV.DocumentLines.push(oAPINVlines1);

								}

								oAPINV.WithholdingTaxDataCollection = [];
								oAPINVWTlines.WTCode = APWTCode;
								oAPINVWTlines.WTAmount = APWTX;

								oAPINV.WithholdingTaxDataCollection.push(oAPINVWTlines);

								//Posting A/P Invoice in SAP
								$.ajax({
									url: "https://18.136.35.41:50000/b1s/v1/PurchaseInvoices",
									data: JSON.stringify(oAPINV),
									type: "POST",
									async:false,
									xhrFields: {
										withCredentials: true
									},
									error: function (xhr, status, error) {
										var ErrorMassage = xhr.responseJSON["error"].message.value;
										sap.m.MessageToast.show(ErrorMassage);
										this.fHideBusyIndicator();
										AppUI5.fErrorLogs("OPCH & PCH1","Add A/P Invoice","null","null",ErrorMassage,"Retention Adding A/PInvoice",this.UserNmae,"null",this.Database,JSON.stringify(oAPINV));
									},
									context: this,
									success: function (json) {}
								}).done(function (results) {
									if (results) {

										sap.m.MessageToast.show("DocNum #" + results.DocNum + "Added Successfully");
										this.fHideBusyIndicator();	

								// For Closing A/P Invoice	
										this.oTransID = new JSONModel();
										$.ajax({
											url: "https://18.136.35.41:50000/b1s/v1/PurchaseDeliveryNotes(" + GRPODocEntry + ")/Close",
											type: "POST",
											async:false,
											xhrFields: {
												withCredentials: true
											},
											error: function (xhr, status, error) {
												var ErrorMassage = xhr.responseJSON["error"].message.value;
												sap.m.MessageToast.show(ErrorMassage);
												this.fHideBusyIndicator();
												console.error(ErrorMassage);
												AppUI5.fErrorLogs("OPCH & PCH1","Add A/P Invoice",DpDocEntry,"null",ErrorMassage,"Retention Adding A/P Invoice",this.UserNmae,"null",this.Database,"-");
											},
											success: function (json) {},
											context: this
										}).done(function (oresults) {
											if (oresults) {
												this.oTransID.setJSON("{\"count\" : " + JSON.stringify(results).replace("[", "").replace("]						", "") + "}");
												this.getView().setModel(this.oTransID, "oTransID");
												this.fHideBusyIndicator();
											}
										});

									}

						});

					}
				});
			}	
			this.fDeleteData();
		},
		//Saving Final Billing in SAP
		onSavingFinalBilling: function () {
			this.fShowBusyIndicator(4000, 0);
			var oDatabase = this.Database;
			var Transcode = this.getView().byId("TransNo").getValue();

			var SupplierCode = this.getView().byId("VenSupCode").getValue();

			if (SupplierCode === "") {
				sap.m.MessageToast.show("No Data to Post in SAP");
				this.fHideBusyIndicator();
			} else {

				var oFGRPO = {};
				var oFGRPOLines = {};

				var GRPOCardCode = this.oModelPurchase.getData().POFields.CardCode;
				var oPrice = this.oModelPurchase.getData().POFields.Price;
				var oGlAccount = this.oModelPurchase.getData().POFields.AcctCode;

				oFGRPO.CardCode = GRPOCardCode;
				oFGRPO.DocType = "dDocument_Service";
				// oFGRPO.DocTotal = this.DTRetention.getData().DetailesRetention[0].GrossAmount;
				oFGRPO.Comments = this.getView().byId("TextArea").getValue();
				oFGRPO.U_APP_RETTranstype = 4;
				oFGRPO.U_APP_IsForRetention = "Y";
				oFGRPO.U_APP_ProgBillRate = this.InputHeader.getData().InputHeader.ProgressBilling;
				oFGRPO.DocumentLines = [];

				oFGRPOLines.BaseLine = 0;
				oFGRPOLines.BaseEntry = this.oModelPurchase.getData().POFields.DocEntry;
				oFGRPOLines.BaseType = 22;

				if (this.POCount === "1"){

					var TotalPrice = this.DTRetention.getData().DetailesRetention[0].GrossAmount;

				} else {

					var POLineTotal = this.POLineTotal;
					var oPOLineTotal = Number([POLineTotal]);
					var ProgBill = this.oModelPrograte.getData().Rate.ProgRate;
					var oProgBill = Number([ProgBill]);
					var ooProgBill = 100 - oProgBill;
					var oooProgBill = Number([ooProgBill]);
					var ooooProgBill = oooProgBill / 100;
					var oooooProgBill = Number([ooooProgBill]);
					var UnitPrice = POLineTotal * oooooProgBill;
					var oUnitPrice = Number([UnitPrice]);
					var TotalPrice = oUnitPrice.toFixed(2);

				}

					oFGRPOLines.UnitPrice = TotalPrice;
					oFGRPOLines.VatGroup = "IVAT-EXC";
					oFGRPOLines.U_APP_RtnRowType = "C";
					oFGRPOLines.WTLiable = "tNO";

				// }

				oFGRPO.DocumentLines.push(oFGRPOLines);

				var PoDocEntry = this.oModelPurchase.getData().POFields.DocEntry;
				var INVGRPOCardCode = this.oModelPurchase.getData().POFields.CardCode;
				var APWTCode = this.oModelPurchase.getData().POFields.WTCode;
				var APRemarks = this.getView().byId("TextArea").getValue();
				var APUnitPrice = this.DTRetention.getData().DetailesRetention[0].CWIP;
				var APWTX = this.DTRetention.getData().DetailesRetention[0].WTX;

				var oCWIP = this.DTRetention.getData().DetailesRetention[0].CWIP;
				var nCWIP = Number([oCWIP]);
				var oGrossAmount = this.DTRetention.getData().DetailesRetention[0].GrossAmount;
				var nGrossAmount = Number([oGrossAmount]);
				var oWTX = this.DTRetention.getData().DetailesRetention[0].WTX;
				var nWTX = Number([oWTX]);
				var oProratedDP = this.DTRetention.getData().DetailesRetention[0].ProratedDP;
				var nProratedDP = Number([oProratedDP]);
				var oProRetention = this.DTRetention.getData().DetailesRetention[0].ProratedRetention;
				var nProRetention = Number([oProRetention]);
				var oProgBill = this.DTRetention.getData().DetailesRetention[0].NetProgress;
				var nProgBill = Number([oProgBill]);

				$.ajax({

					// Posting GRPO in SAP
					url: "https://18.136.35.41:50000/b1s/v1/PurchaseDeliveryNotes",
					data: JSON.stringify(oFGRPO),
					async:false,
					type: "POST",
						xhrFields: {
							withCredentials: true
						},
						error: function (xhr, status, error) {
							var ErrorMassage = xhr.responseJSON["error"].message.value;
							sap.m.MessageToast.show(ErrorMassage);
							this.fHideBusyIndicator();
							console.error(ErrorMassage);
							AppUI5.fErrorLogs("OPDN & PDN1","Add GRPO","null","null",ErrorMassage,"Retention Adding GRPO",this.UserNmae,"null",this.Database,JSON.stringify(oFGRPO));
						},
						context: this,
						success: function (json) {}
				}).done(function (results) {
					if (results) {

						var GRPODocEntry = results.DocEntry;


								var DpDocEntry = results.DocEntry;
								var DpDocNum = 	 results.DocNum;
								var DPDocTotal = results.DocTotal;

								var oAPINV = {};
								var oAPINVlines1 = {};
								var oAPINVlines2 = {};
								var oAPINVWTlines = {};

									oAPINV.CardCode = INVGRPOCardCode;
									oAPINV.DocType = "dDocument_Service";
									oAPINV.Comments = APRemarks;
									oAPINV.U_APP_IsForRetention = "Y";
									oAPINV.U_APP_RETTranstype = 4;

									if (this.Progressive === "Yes" ){
										oAPINV.U_APP_YCWIP = this.RetentionYCWIP;
									}

									oAPINV.U_APP_CWIP = nCWIP;
									oAPINV.U_APP_GrossAmount = nGrossAmount;
									oAPINV.U_APP_WTX = nWTX;
									oAPINV.U_APP_ProratedDP = nProratedDP;
									oAPINV.U_APP_ProRetention = nProRetention;
									oAPINV.U_APP_ProgBillAmount = nProgBill;
									oAPINV.U_APP_DocEntry = this.DocEntry;
									oAPINV.AttachmentEntry = this.FileKey;
									oAPINV.U_APP_PODocEntry = this.PO_DocEntry;

									oAPINV.DocumentLines = [];

								// Progressive YES
								if (this.Progressive === "Yes"){

									//NO RETENTION
									if (this.POCount === "1"){

										oAPINVlines1.BaseType = 20;
										oAPINVlines1.BaseEntry = GRPODocEntry;
										oAPINVlines1.BaseLine = 0;
										oAPINVlines1.Price = 0;
										oAPINVlines1.PriceAfterVAT = 0;
										oAPINVlines1.UnitPrice = nGrossAmount;
										oAPINVlines1.U_APP_RtnRowType = "C";
									
										oAPINV.DocumentLines.push(oAPINVlines1);

									// WITH RETENTION
									}else{

									oAPINV.DocumentLines = [];
									
									oAPINVlines1.BaseType = 20;
									oAPINVlines1.BaseEntry = GRPODocEntry;
									oAPINVlines1.BaseLine = 0;
									oAPINVlines1.Price = 0;
									oAPINVlines1.PriceAfterVAT = 0;
									oAPINVlines1.UnitPrice = APUnitPrice;
									oAPINVlines1.U_APP_RtnRowType = "C";
									oAPINV.DocumentLines.push(oAPINVlines1);
									
									oAPINVlines2.BaseType = "";
									oAPINVlines2.BaseEntry = "";
									oAPINVlines2.BaseLine = "";
									oAPINVlines2.AccountCode = oGlAccount;
									oAPINVlines2.Price = 0;
									oAPINVlines2.PriceAfterVAT = 0;
									
									var UnitPrice = -1 * this.FinalBillingRetention;
									var oUnitPrice = Number([UnitPrice]);
									oAPINVlines2.UnitPrice = oUnitPrice;
									oAPINVlines2.VatGroup = "IVAT-EXC";
									oAPINVlines2.U_APP_RtnRowType = "R";
									oAPINV.DocumentLines.push(oAPINVlines2);

									}

								// Progressive NO
								}else{

									//NO RETENTION
									if (this.POCount === "1"){ 

										oAPINVlines1.BaseType = 20;
										oAPINVlines1.BaseEntry = GRPODocEntry;
										oAPINVlines1.BaseLine = 0;
										oAPINVlines1.Price = 0;
										oAPINVlines1.PriceAfterVAT = 0;
										oAPINVlines1.UnitPrice = nGrossAmount;
										oAPINVlines1.U_APP_RtnRowType = "C";
									
										oAPINV.DocumentLines.push(oAPINVlines1);
									
									//WITH RETENTION
									}else{
									
										oAPINVlines1.BaseType = 20;
										oAPINVlines1.BaseEntry = GRPODocEntry;
										oAPINVlines1.BaseLine = 0;
										oAPINVlines1.Price = 0;
										oAPINVlines1.PriceAfterVAT = 0;
										oAPINVlines1.UnitPrice = APUnitPrice;
										oAPINVlines1.U_APP_RtnRowType = "C";
									
										oAPINV.DocumentLines.push(oAPINVlines1);
									
										oAPINVlines2.BaseType = "";
										oAPINVlines2.BaseEntry = "";
										oAPINVlines2.BaseLine = "";
										oAPINVlines2.AccountCode = oGlAccount;
										oAPINVlines2.Price = 0;
										oAPINVlines2.PriceAfterVAT = 0;
										var UnitPrice = -1 * oPrice;
										oAPINVlines2.UnitPrice = UnitPrice;
										oAPINVlines2.VatGroup = "IVAT-EXC";
										oAPINVlines2.U_APP_RtnRowType = "R";
									
										oAPINV.DocumentLines.push(oAPINVlines2);
									
									}

								}

								oAPINV.WithholdingTaxDataCollection = [];
								oAPINVWTlines.WTCode = APWTCode;
								oAPINVWTlines.WTAmount = APWTX;

								oAPINV.WithholdingTaxDataCollection.push(oAPINVWTlines);

								//Posting AP Invoice in SAP
								$.ajax({
									url: "https://18.136.35.41:50000/b1s/v1/PurchaseInvoices",
									data: JSON.stringify(oAPINV),
									type: "POST",
									async:false,
									xhrFields: {
										withCredentials: true
									},
									error: function (xhr, status, error) {
										var ErrorMassage = xhr.responseJSON["error"].message.value;
										sap.m.MessageToast.show(ErrorMassage);
										this.fHideBusyIndicator();
										AppUI5.fErrorLogs("OPCH & PCH1","Add A/P Invoice","null","null",ErrorMassage,"Retention Adding A/PInvoice",this.UserNmae,"null",this.Database,JSON.stringify(oAPINV));
									},
									context: this,
									success: function (json) {
										// sap.m.MessageToast.show("Added Successfully");
									}
								}).done(function (results) {
									if (results) {
										sap.m.MessageToast.show("DocNum# " + results.DocNum + " Added Successfully");
										this.fHideBusyIndicator();

										// For Forced Close GRPO
										this.oTransID = new JSONModel();
										$.ajax({
											url: "https://18.136.35.41:50000/b1s/v1/PurchaseDeliveryNotes(" + GRPODocEntry + ")/Close",
											type: "POST",
											async:false,
											xhrFields: {
												withCredentials: true
											},
											error: function (xhr, status, error) {
												var ErrorMassage = xhr.responseJSON["error"].message.value;
												sap.m.MessageToast.show(ErrorMassage);
												this.fHideBusyIndicator();
												console.error(ErrorMassage);
												AppUI5.fErrorLogs("OPCH & PCH1","Add A/P Invoice",DpDocEntry,"null",ErrorMassage,"Retention Adding A/P Invoice",this.UserNmae,"null",this.Database,"-");
											},
											success: function (json) {
												this.fHideBusyIndicator();
											},
											context: this
										}).done(function (oresults) {
											if (oresults) {
												this.oTransID.setJSON("{\"count\" : " + JSON.stringify(results).replace("[", "").replace("]						", "") + "}");
												this.getView().setModel(this.oTransID, "oTransID");
											}
										});

									}

						});

					}
				});
			}
		},
		//Saving Retention in SAP
		onSavingRetention: function () {
			this.fShowBusyIndicator(4000, 0);
			var oDatabase = this.Database;
			var Transcode = this.getView().byId("TransNo").getValue();

			var oFGRPO = {};
			var oFGRPOLines = {};

			var GRPOCardCode = this.getView().byId("VenSupCode").getValue();
			var oPrice = this.getView().byId("RentAmount").getValue();
			var oGlAccount = this.GLAccount;			
			var APWTCode = this.WTCode;
			var APRemarks = this.getView().byId("TextArea").getValue();

			if (GRPOCardCode === ""){
				sap.m.MessageToast.show("No Data to Post in SAP");
				this.fHideBusyIndicator();
			} else{

			oFGRPO.CardCode = GRPOCardCode;
			oFGRPO.DocType = "dDocument_Service";
			oFGRPO.DocTotal = this.DTRetention.getData().DetailesRetention[0].GrossAmount;
			oFGRPO.Comments = this.getView().byId("TextArea").getValue();
			oFGRPO.U_APP_RETTranstype = 5;
			oFGRPO.U_APP_IsForRetention = "Y";

			oFGRPO.DocumentLines = [];

			oFGRPOLines.BaseLine = 1;
			oFGRPOLines.BaseEntry = this.DocEntry;
			oFGRPOLines.BaseType = 22;
			oFGRPOLines.UnitPrice = this.DTRetention.getData().DetailesRetention[0].GrossAmount;
			oFGRPOLines.VatGroup = "IVAT-EXC";
			oFGRPOLines.U_APP_RtnRowType = "R";
			oFGRPOLines.WTLiable = "tNO";

			oFGRPO.DocumentLines.push(oFGRPOLines);

			//Posting GRPO in
			$.ajax({
				url: "https://18.136.35.41:50000/b1s/v1/PurchaseDeliveryNotes",
				data: JSON.stringify(oFGRPO),
				type: "POST",
				async:false,
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					var ErrorMassage = xhr.responseJSON["error"].message.value;
					sap.m.MessageToast.show(ErrorMassage);
					this.fHideBusyIndicator();
					console.error(ErrorMassage);
					AppUI5.fErrorLogs("OPDN & PDN1","Add GRPO","null","null",ErrorMassage,"Retention Adding GRPO",this.UserNmae,"null",this.Database,JSON.stringify(oFGRPO));
				},
				context: this,
				success: function (json) {}
			}).done(function (results) {
				if (results) {


					var GRPODocEntry = results.DocEntry;

							var DpDocEntry = results.DocEntry;
							var DpDocNum =   results.DocNum;
							var DPDocTotal = results.DocTotal;

							var oAPINV = {};
							var oAPINVlines1 = {};
							var oAPINVlines2 = {};
							var oAPINVWTlines = {};

							oAPINV.CardCode = GRPOCardCode;
							oAPINV.DocType = "dDocument_Service";
							oAPINV.Comments = APRemarks;
							oAPINV.U_APP_RETTranstype = 5;
							oAPINV.U_APP_IsForRetention = "Y";
							oAPINV.AttachmentEntry = this.FileKey;
							oAPINV.U_APP_PODocEntry = this.PO_DocEntry;

							oAPINV.DocumentLines = [];

							oAPINVlines1.BaseType = 20;
							oAPINVlines1.BaseEntry = GRPODocEntry;
							oAPINVlines1.BaseLine = 0;
							oAPINVlines1.U_APP_RtnRowType = "R";

							oAPINV.DocumentLines.push(oAPINVlines1);

							oAPINV.WithholdingTaxDataCollection = [];
							oAPINVWTlines.WTCode = APWTCode;
							oAPINVWTlines.WTAmount = 0;

							oAPINV.WithholdingTaxDataCollection.push(oAPINVWTlines);

							//Posting AP Invoice in SAP
							$.ajax({
								url: "https://18.136.35.41:50000/b1s/v1/PurchaseInvoices",
								data: JSON.stringify(oAPINV),
								type: "POST",
								async:false,
								xhrFields: {
									withCredentials: true
								},
								error: function (xhr, status, error) {
									var ErrorMassage = xhr.responseJSON["error"].message.value;
									sap.m.MessageToast.show(ErrorMassage);
									this.fHideBusyIndicator();
									console.error(ErrorMassage);
									AppUI5.fErrorLogs("OPCH & PCH1","Add A/P Invoice","null","null",ErrorMassage,"Retention Adding A/P Invoice",this.UserNmae,"null",this.Database,JSON.stringify(oAPINV));
								},
								context: this,
								success: function (json) {}
							}).done(function (results) {
								if (results) {
									// /Progressive YES
									if (this.Progressive === "Yes"){
										var DocNum = results.DocNum;
										this.fUpdateAPInvoice(this.APDocEntry,DocNum);
									} else{
										this.fHideBusyIndicator();
										sap.m.MessageToast.show("DocNum# " + results.DocNum + "  Added Successfully");
									}
									
								}

					});

				}
			});

			}
		},
		// To get the Remainin Progress Billing Rate
		fGetRemainingPrograte: function (oDocEntry) {
			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database +
					"&procName=spAppRetention&queryTag=getProgRate&value1=" +
					oDocEntry + "&value2=&value3=&value4=",
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
				if (results.length !== 0) {
					this.oModelPrograte.setJSON("{\"Rate\" : " + JSON.stringify(results).replace("[", "").replace("]", "") + "}");
					this.getView().setModel(this.oModelPrograte, "oModelPrograte");

					var PoStatus = this.getView().byId("selectRecordGroup").getSelectedKey();
					// 
					if (PoStatus === "4") {
						// var oProg_Rate = this.oModelPrograte.getData().Rate.ProgRate;
						// var oAvailable_Rate = 100 - oProg_Rate;
						var progRate = this.InputHeader.getData().InputHeader.ProgressBilling;
						var ProgressRate = Number([progRate]);

						var soProg_Rate = ProgressRate - this.oModelPrograte.getData().Rate.ProgRate;
						var soProg_Rate1 = this.oModelPrograte.getData().Rate.ProgRate + soProg_Rate;

						if (progRate !== "" ){

							if (soProg_Rate1 > 100) {
								MessageToast.show("Cannot Process Subsequent Progress Billing, rate already  equals/exceeds 100%");
								this.getView().byId("ProgBill").setValue("");
								this.fDeleteDetailes();
							} else if (soProg_Rate === 100) {
								MessageToast.show("Cannot Process Subsequent Progress Billing, rate already  equals/exceeds 100%");
								this.getView().byId("ProgBill").setValue("");
								this.fDeleteDetailes();
							} else if ( this.oModelPrograte.getData().Rate.ProgRate === soProg_Rate1 ){
								MessageToast.show("Cannot Process Subsequent Progress Billing, rate already  equals/exceeds 100%");
								this.getView().byId("ProgBill").setValue("");
								this.fDeleteDetailes();
							} else if ( soProg_Rate1 < this.oModelPrograte.getData().Rate.ProgRate ){
								MessageToast.show("Cannot Process Subsequent Progress Billing, rate already  equals/exceeds 100%");
								this.getView().byId("ProgBill").setValue("");
								this.fDeleteDetailes();
							}

						}

					} else {
						var Prog_Rate = this.oModelPrograte.getData().Rate.ProgRate;
						var Available_Rate = 100 - Prog_Rate;
						this.getView().byId("ProgBill").setValue("100");
						this.FinalBillingRate = Available_Rate;
						this.onProgressBIll();
					}

				}
			});
			return false;
		},
		// For Filtering Grid Table
		onFilterValue: function (oEvent) {

			var value = oEvent.mParameters.column.sId;
			var oVAlue1 = oEvent.mParameters.value;
			var PoStatus = this.getView().byId("selectRecordGroup").getSelectedKey();

			if (oVAlue1 !== "") {
				// Filter of Contractor Name
				if (value === "__xmlview3--colVendor" || value === "__xmlview2--colVendor" || value === "__xmlview1--colVendor") {
					if (PoStatus === "0") {
						this.fNableAllFields("1");
						this.fGetFilterValues("oDownPaymentFilterCardName", oVAlue1);
					} else if (PoStatus === "1") {
						this.fNableAllFields("1");
						this.fGetFilterValues("oDownPaymentNPdFilterCardName", oVAlue1);
					} else if (PoStatus === "2") {
						this.fNableAllFields("0");
						this.fGetFilterValues("getFilterPOwithAPDPCardName", oVAlue1);
					} else if (PoStatus === "3") {
						this.fNableAllFields("0");
						this.fGetFilterValues("getFilterFirstBillingCardName", oVAlue1);
					} else if (PoStatus === "4") {
						this.fGetFilterValues("getFilterSubsequentBillingCardName", oVAlue1);
					} else if (PoStatus === "5") {
						this.fGetFilterValues("getFilterFinalBillingCardName", oVAlue1);
					} else if (PoStatus === "6") {
						this.fGetFilterValues("getFilterCompleteTransactionCardName", oVAlue1);
					} else if (PoStatus === "7") {
						this.fGetFilterValues("getFilterRetentionBillingCardName", oVAlue1);
					}		
				// Filter od Document Number	
				} else if (value === "__xmlview3--colDoc" || value === "__xmlview2--colDoc" || value === "__xmlview1--colDoc") {
					if (PoStatus === "0") {
						this.fNableAllFields("1");
						this.fGetFilterValues("oDownPaymentFilterDocNum", oVAlue1);
					} else if (PoStatus === "1") {
						this.fNableAllFields("1");
						this.fGetFilterValues("oDownPaymentNPdFilterDocNum", oVAlue1);
					} else if (PoStatus === "2") {
						this.fNableAllFields("0");
						this.fGetFilterValues("getFilterPOwithAPDPDocNum", oVAlue1);
					} else if (PoStatus === "3") {
						this.fGetFilterValues("getFilterFirstBillingDocNum", oVAlue1);
					} else if (PoStatus === "4") {
						this.fGetFilterValues("getFilterSubsequentBillingDocNum", oVAlue1);
					} else if (PoStatus === "5") {
						this.fGetFilterValues("getFilterFinalBillingDocNum", oVAlue1);
					} else if (PoStatus === "6") {
						this.fGetFilterValues("getFilterCompleteTransactionDocNum", oVAlue1);
					} else if (PoStatus === "7") {
						this.fGetFilterValues("getFilterRetentionBillingDocNum", oVAlue1);
					}	
				// Filter for Date
				} else if (value === "__column0")	{
					if (PoStatus === "0") {
						this.fNableAllFields("1");
						this.fGetFilterValues("oDownPaymentFilterDate", oVAlue1);
					} else if (PoStatus === "1") {
						this.fNableAllFields("1");
						this.fGetFilterValues("oDownPaymentNPdFilterDate", oVAlue1);
					} else if (PoStatus === "2") {
						this.fNableAllFields("0");
						this.fGetFilterValues("getFilterPOwithAPDPDate", oVAlue1);
					} else if (PoStatus === "3") {
						this.fGetFilterValues("getFilterFirstBillingDate", oVAlue1);
					} else if (PoStatus === "4") {
						this.fGetFilterValues("getFilterSubsequentBillingDate", oVAlue1);
					} else if (PoStatus === "5") {
						this.fGetFilterValues("getFilterFinalBillingDate", oVAlue1);
					} else if (PoStatus === "6") {
						this.fGetFilterValues("getFilterCompleteTransactionDate", oVAlue1);
					} else if (PoStatus === "7") {
						this.fGetFilterValues("getFilterRetentionBillingDocDate", oVAlue1);
					}	
				// Filter for Project Codes
				} else if (value === "__xmlview1--colProjCode"){
					if (PoStatus === "0") {
						this.fNableAllFields("1");
						this.fGetFilterValues("oDownPaymentFilterProjCode", oVAlue1);
					} else if (PoStatus === "1") {
						this.fNableAllFields("1");
						this.fGetFilterValues("oDownPaymentNPdFilterProjCode", oVAlue1);
					} else if (PoStatus === "2") {
						this.fNableAllFields("0");
						this.fGetFilterValues("getFilterPOwithAPDPProjCode", oVAlue1);
					} else if (PoStatus === "3") {
						this.fGetFilterValues("getFilterFirstBillingProjCode", oVAlue1);
					} else if (PoStatus === "4") {
						this.fGetFilterValues("getFilterSubsequentBillingProjCode", oVAlue1);
					} else if (PoStatus === "5") {
						this.fGetFilterValues("getFilterFinalBillingProjCode", oVAlue1);
					} else if (PoStatus === "6") {
						this.fGetFilterValues("getFilterCompleteTransactionProjCode", oVAlue1);
					} else if (PoStatus === "7") {
						this.fGetFilterValues("getFilterRetentionBillingProjCode", oVAlue1);
					}
				}  else {
					this.onRefresh();
				}
			} else {
				this.onRefresh();
			}

		},
		fGetFilterValues: function (queryTag, oValue) {

			this.oModelOpenPO = new JSONModel();
			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database + "&procName=spAppRetention&queryTag=" + queryTag +
					"&value1=" + oValue + "&value2=&value3=&value4=",
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
					this.oModelOpenPO.setJSON("{\"allbp\" : " + JSON.stringify(results) + "}");
					this.getView().setModel(this.oModelOpenPO, "oModelOpenPO");
				}
			});

		},
		//For Refresh
		onRefresh: function () {
			var PoStatus = this.getView().byId("selectRecordGroup").getSelectedKey();

			if (PoStatus === "0") {
				this.fFilterPurchaseOrderTransaction("getAllUnprocessedPO");
			} else if (PoStatus === "1") {
				this.fFilterPurchaseOrderTransaction("getDPwthOP");
			} else if (PoStatus === "2") {
				this.fFilterPurchaseOrderTransaction("getPOwithAPDP");
			} else if (PoStatus === "3") {
				this.fFilterPurchaseOrderTransaction("getFirstBilling");
			} else if (PoStatus === "4") {
				this.fFilterPurchaseOrderTransaction("getSubsequentBilling");
			} else if (PoStatus === "5") {
				this.fFilterPurchaseOrderTransaction("getFinalBilling");
			} else if (PoStatus === "6") {
				this.fFilterPurchaseOrderTransaction("getCompleteTransaction");
			} else if (PoStatus === "7") {
				this.fFilterPurchaseOrderTransaction("getRetentionBilling");
			}
			this.fDeleteData();
			this.fDeleteDetailes();
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
		//Get PO Line Total
		fgetPOLineTotal: function (DocNum,Row){

			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database + "&procName=spAppRetention&queryTag=getPOLineTotal&value1=" + DocNum + "&value2=" + Row + "&value3=&value4=",
					type: "GET",
					async: false,
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
					this.POLineTotal= results[0].LineTotal;
				}
			});
		},
		//Get PO DownPayment
		fgetPODownPayment: function (DocEntry){

			var value = "";

			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database +
				"&procName=spAppRetention&queryTag=getDocTotalAPDP&value1=" + DocEntry + "&value2=&value3=&value4=",
					type: "GET",
					async: false,
				  beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:P@ssw0rd805~"));
			  	},
				error: function (xhr, status, error) {
					// var Message = xhr.responseJSON["error"].message.value;
					sap.m.MessageToast.show(error);
				},
				success: function (json) {
					value = json[0].DocTotal;
				},
				context: this
			}).done(function (results) {
				value = results[0].DocTotal;
				
			});
			return value;
			return false;
		},
		//Get First Billing CWIP
		fgetFirstBillCWIP: function (QueryTag,DocEntry){

			var value = "";
			
			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database + "&procName=spAppRetention&queryTag="+ QueryTag +"&value1=" + DocEntry +"&value2=&value3=&value4=",
					type: "GET",
					async: false,
				  beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:P@ssw0rd805~"));
			  	},
					error: function (xhr, status, error) {
						// var Message = xhr.responseJSON["error"].message.value;
						sap.m.MessageToast.show(error);
					},
					success: function (json) {
						value = json[0].Price;
					},
					context: this
			}).done(function (results) {
				if (results) {
					value = results[0].Price;
				}
			});
			return value;
			return false;
		},
		//Get ALL Subsequent CWIP
		fgetALLSubCWIP: function (QueryTag,DocEntry){

			var value = "";

			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database + "&procName=spAppRetention&queryTag=" + QueryTag + "&value1=" + DocEntry + "&value2=&value3=&value4=",
					type: "GET",
					async: false,
				  beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:P@ssw0rd805~"));
				  },
					error: function (xhr, status, error) {
						// var Message = xhr.responseJSON["error"].message.value;
						sap.m.MessageToast.show(error);
					},
					success: function (json) {
						value = json[0].Price;
					},
					context: this
			}).done(function (results) {
				if (results) {
					value = results[0].Price;
				}
			});
			return value;
			return false;
		},
		//Get PO RETENTION AMOUNT
		fgetPORetention: function (DocEntry){

			var value = "";

			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database +"&procName=spAppRetention&queryTag=getPORentAmount&value1=" + DocEntry + "&value2=&value3=&value4=",
					type: "GET",
					async: false,
				  beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:P@ssw0rd805~"));
				  },
					error: function (xhr, status, error) {
						// var Message = xhr.responseJSON["error"].message.value;
						sap.m.MessageToast.show(error);
					},
					success: function (json) {
						value = json[0].Price;
					},
					context: this
			}).done(function (results) {
				if (results) {
					value = results[0].Price;
				}
			});
			return value;
		},
		//SELECT Retention Transaction
		fRetTransaction: function (DocEntry,Row){

			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database +"&procName=spAppRetention&queryTag=getRetentionTransaction&value1=" + DocEntry + "&value2="+ Row +"&value3=&value4=",
					type: "GET",
					async: false,
				  beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:P@ssw0rd805~"));
				  },
					error: function (xhr, status, error) {
						// var Message = xhr.responseJSON["error"].message.value;
						sap.m.MessageToast.show(error);
					},
					success: function (json) {
						
					},
					context: this
			}).done(function (results) {
				if (results) {
					this.oGetRetentionTransaction.setJSON("{\"allReten\" : " + JSON.stringify(results) + "}");
					this.getView().setModel(this.oGetRetentionTransaction, "oGetRetentionTransaction");

					this.getView().byId("TransNo").setValue("");

				}
			});
		},
		
		//------------------- Retention Transaction Fragment ---------------------//
		onHandleSearchRetention: function (oEvent) {
		var sValue = oEvent.getParameter("value");
		var oFilter = new Filter("DocNum", FilterOperator.Contains, sValue);
		var oBinding = oEvent.getSource().getBinding("items");
		oBinding.filter([oFilter]);
		},
		onHandleValueProjCode: function (){

			Fragment.load({
				name: "com.apptech.app-retention.view.fragments.RetentionFragment",
				controller: this
			}).then(function (ValueHelpDialogs) {
				this.fConfigValueHelpProjDialogs(this.DocEntry,"R");
				this._ValueHelpDialogs = ValueHelpDialogs;
				this.getView().addDependent(this._ValueHelpDialogs);				
				this._ValueHelpDialogs.open();
			}.bind(this));

		},
		fConfigValueHelpProjDialogs: function (DocEntry,Row) {
		var DocEntry = this.DocEntry;
		var Row = "R";

		var sInputValue = this.byId("RetCode").getValue();

			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database +"&procName=spAppRetention&queryTag=getRetentionTransaction&value1=" + DocEntry + "&value2="+ Row +"&value3=&value4=",
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
						oRecord.selected = (oRecord.DocNum === sInputValue);
					});
				}
			});

		},
		onHandleValueHelpRetentionCloseBatch: function (oEvent) {
		var aContexts = oEvent.getParameter("selectedContexts");
		var CardDetails = {};
		if (aContexts && aContexts.length) {

			CardDetails = aContexts.map(function (oContext) {
				var oCard = {};
				oCard.DocEntry = oContext.getObject().DocEntry;
				oCard.DocNum = oContext.getObject().DocNum;
				oCard.CardCode = oContext.getObject().CardCode;
				oCard.CardName = oContext.getObject().CardName;
				oCard.LineTotal = oContext.getObject().LineTotal;
				oCard.DocTotal = oContext.getObject().DocTotal;
				oCard.TransType = oContext.getObject().TransType;
				return oCard;

			});
		}

		var LineTotal = new Intl.NumberFormat('de-DE').format(CardDetails[0].LineTotal);
		var DocTotal = new Intl.NumberFormat('de-DE').format(CardDetails[0].DocTotal);
		this.APDocEntry = CardDetails[0].DocEntry;

		oEvent.getSource().getBinding("items").filter([]);
		this.getView().byId("VenSupCode").setValue(CardDetails[0].CardCode);
		this.getView().byId("TransNo").setValue(CardDetails[0].DocEntry);
		this.getView().byId("Name").setValue(CardDetails[0].CardName);
		this.getView().byId("DocNum").setValue(CardDetails[0].DocNum);
		this.getView().byId("RentAmount").setValue(LineTotal);
		this.getView().byId("Doctotal").setValue(DocTotal);
		this.getView().byId("RetCode").setValue(CardDetails[0].TransType);

		this.DTRetention.getData().DetailesRetention[0].GrossAmount = CardDetails[0].LineTotal;
		this.DTRetention.getData().DetailesRetention[0].NetProgress = CardDetails[0].LineTotal;

		this.DTRetention.refresh();

		this.fConfigValueHelpProjDialogs(this.DocEntry,"R");
		
		},
		//------------------- Retention Transaction End -----------------//
		
		//Update / Untag the AP Invoice in Retention Transaction Fragment
		fUpdateAPInvoice: function (DocEntry,DocNum){

			var oPo = {};

			oPo.U_APP_Processed = "-";

			$.ajax({
				url: "https://18.136.35.41:50000/b1s/v1/PurchaseInvoices(" + DocEntry + ")",
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
				},
				context: this,
				success: function (json) {
					sap.m.MessageToast.show("DocNum# " + DocNum + "  Added Successfully");
					this.fHideBusyIndicator();
				}
			}).done(function (results) {
				if (results) {
					sap.m.MessageToast.show("DocNum# " + DocNum + "  Added Successfully");
					this.fHideBusyIndicator();
				}
			});
			this.fDeleteData();
		},
		//Attachment Function
		handleValueChange: function (oEvt){
		var aFiles = oEvt.getParameters().files;
		this.currentFile = aFiles[0];
		var FileName = this.getView().byId("fileUploader").getValue();

		var form = new FormData();
		form.append("",this.currentFile,FileName);

		//Postinf Attachment in SAP
		$.ajax({
			url: "https://18.136.35.41:50000/b1s/v1/Attachments2",
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
		//Get AbsEntry or Key of File Attachment
		// fgetFileAbsEntry: function (){

		// $.ajax({
		// 	url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database +
		// 		"&procName=spAppRetention&queryTag=getFileAbsEntry&value1=&value2=&value3=&value4=",
		// 	type: "GET",
		// 	dataType: "json",
		// 	async:false,
		// 	beforeSend: function (xhr) {
		// 		xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:P@ssw0rd805~"));
		// 	},
		// 		error: function (xhr, status, error) {
		// 			sap.m.MessageToast.show(error);
		// 	},
		// 	success: function (json) {},
		// 	context: this
		// }).done(function (results) {
		// 	if (results) {
		// 		this.FileKey = results[0].AbsEntry;			
		// 	}
		// });

		// }

  });
});
