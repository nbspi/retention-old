sap.ui.define([
	'sap/m/MessageBox',
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/BusyIndicator"
], function (MessageBox, Controller, JSONModel, Fragment, MessageToast, Filter, FilterOperator,BusyIndicator) {
	"use strict";

  return Controller.extend("com.apptech.app-retention.controller.PurchaseOrder", {

	_data : {
		"number" : ""
	},
	// Contract Amount Value
	fContractAmount: function (){

		var oContractValue = this.byId("CntAmount").getValue();
		this.POData.getData().POCreation.ContractAmount = oContractValue;
		this.POData.refresh();
		
	},
    onInit: function () {

			var oModel = new JSONModel(this._data);
			this.getView().setModel(oModel);

			//Getting Data From LoginView
			this.Database = jQuery.sap.storage.get("Database");
			this.UserNmae = jQuery.sap.storage.get("Usename");

			//BLANK JSONMODEL FOR ALL BP FOR TEMPLATE
			this.oMdlAllBP = new JSONModel(); //
			this.oMdlAllBP.getData().allbp = [];

			// Retention
			this.Retention = new JSONModel("model/TaxType.json");
			this.getView().setModel(this.Retention, "Retention");

			//INPUT PO CREATION DATA
			this.POData = new JSONModel("model/POCreation.json");
			this.getView().setModel(this.POData, "POData");

			// FilterGrid
			this.Button = new JSONModel("model/GridFilter.json");
			this.getView().setModel(this.Button, "Button");
			
			//Declarations
			this.DraftNumber = "";
			this.PurchaseAdd = "";
			this.CardName = "";
			this.CardCode = "";
			this.fGetTransactionNumber();
			// new File();
			//CPA
			this.currentFile = {} //File Object	
			//kpag lumipat ako ng ibang line number sa editor hindi mo ko nakikta


	},
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
			this.getView().byId("BPCode").setValue(CardDetails[0].CardName);
			this.CardName = CardDetails[0].CardName;
			this.CardCode = CardDetails[0].CardCode;
			this.fGetTransactionNumber();
	},
	///BP LIST FROM FRAGMENT
	onHandleValueBPMaster: function () {
			if (!this._oValueHelpDialogs) {
				Fragment.load({
					name: "com.apptech.app-retention.view.fragments.BPMasterFragment",
					controller: this
				}).then(function (oValueHelpDialogs) {
					this._oValueHelpDialogs = oValueHelpDialogs;
					this.getView().addDependent(this._oValueHelpDialogs);
					this.fConfigValueHelpDialogs();
					this._oValueHelpDialogs.open();
				}.bind(this));
			} else {
				this.fConfigValueHelpDialogs();
				this._oValueHelpDialogs.open();
			}
	},
	//BP Fragment Dialog Configuration
	fConfigValueHelpDialogs: function () {
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
	//Posting Purchase Order in SAP
	onSave: function () {

			this.fShowBusyIndicator(4000, 0);
			var oDatabase = this.Database;
			this.PurchaseAdd = "1";

			var Vendor = this.CardCode;
			var ContractAmount = this.getView().byId("CntAmount").getValue();
			var Retention = this.POData.getData().POCreation.Retention;
			var PostingDate = this.getView().byId("DateFrom").getValue();
			var Remarks = this.getView().byId("TextArea").getValue();
			var ContranctAmount = this.POData.getData().POCreation.ContractAmount;
			var ProjectCode = this.getView().byId("ProjCode").getValue();

			if (Vendor === "" ) {
				sap.m.MessageToast.show("Input Data First");
				this.fHideBusyIndicator();
				// this.fDeleteData();
			} else if (ContractAmount === "0" || ContractAmount === "" ){
				sap.m.MessageToast.show("Input Contract Amount");
				this.fHideBusyIndicator();
				// this.fDeleteData();
			} else if (ProjectCode === ""){
				sap.m.MessageToast.show("Input Project Code");
				this.fHideBusyIndicator();
				// this.fDeleteData();
			}else {

				var oPO = {};
				var oPOLines1 = {};
				var oPOLines2 = {};

				if (Retention === "0") { // YES
					var oContract = Number([ContranctAmount.replace(",","")]);
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
					oPO.U_APP_ProjCode = this.POData.getData().POCreation.ProjectCode;
					oPO.U_APP_Progressive = this.POData.getData().POCreation.Progressive;
					
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
					
					//Posting of PO in SAP
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
							this.fHideBusyIndicator();
						},
						context: this,
						success: function (json) {}
					}).done(function (results) {
						if (results) {
							sap.m.MessageToast.show("Added Successfully");
							this.fDraft();
							this.fDeleteData();
						}

					}); 

				} else { //NO
				
					var oContract = Number([ContranctAmount.replace(",",".")]);

					oPO.CardCode = Vendor;
					oPO.DocDate = PostingDate;
					oPO.U_APP_IsForRetention = "Y";
					oPO.DocType = "dDocument_Service";
					oPO.U_APP_Retention = "N";
					oPO.U_APP_ProjCode = this.POData.getData().POCreation.ProjectCode;
					oPO.U_APP_Progressive = this.POData.getData().POCreation.Progressive;
					oPO.DocumentLines = [];

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
							this.fHideBusyIndicator();
						},
						context: this,
						success: function (json) {}
					}).done(function (results) {
						if (results) {
							sap.m.MessageToast.show("Added Successfully");
							this.fDraft();
						}

					}); 

				}


			}

					// var oFileUploader = this.byId("fileUploader");
		// oFileUploader.upload();

		// var form = new FormData();
		// form.append("",this.currentFile, "");

		// var settings = {
		//   "url": "https://18.136.35.41:50000/b1s/v1/Attachments2",
		//   "data": form,
		//   "method": "POST",
		//   "processData": false,
		//   "mimeType": "multipart/form-data",
		//   "contentType": false,
		//   "xhrFields":{
		// 	  "withCredentials": true
		//   }
		// };
		
		// $.ajax(settings).done(function (response) {
		//   console.log(response);
		// });

	},
	// Posting Draft
	fDraft: function () {
			this.fShowBusyIndicator(4000, 0);
			var oDraft = {};
			var Vendor = this.getView().byId("BPCode").getValue();
			var ContractAmount = this.getView().byId("CntAmount").getValue();
			var ProjectCode = this.getView().byId("ProjCode").getValue();
			var Code = this.fGenerateUDTCode("GetCode");

			if (Vendor === ""){
				sap.m.MessageToast.show("Input Data First");
				// this.fDeleteData();
				this.fHideBusyIndicator();
			}else if (ContractAmount === "0" || ContractAmount === "") {
				sap.m.MessageToast.show("Input Contract Amount");
				// this.fDeleteData();
				this.fHideBusyIndicator();
			}else if ( ProjectCode === ""){
				sap.m.MessageToast.show("Input Project Code");
				// this.fDeleteData();
				this.fHideBusyIndicator();
			}else {

				oDraft.Code = Code;
				oDraft.Name = Code;
				oDraft.U_App_Vendor = this.CardCode;
				oDraft.U_App_VendorName = this.oMdlAllBP.getData().allbp.Vendor;
				oDraft.U_App_TranNum = this.byId("Docnum").getValue();
				oDraft.U_App_Retention = this.POData.getData().POCreation.Retention;
				oDraft.U_App_PostDate = this.POData.getData().POCreation.PostingDate;
				oDraft.U_App_ConAmount = this.POData.getData().POCreation.ContractAmount;
				oDraft.U_App_VendorName = this.CardName;
				oDraft.U_App_File = "";
				oDraft.U_App_Remarks = this.getView().byId("TextArea").getValue();
				oDraft.U_App_CreatedDate = this.fGetTodaysDate();
				oDraft.U_App_CreatedBy = this.UserNmae;
				oDraft.U_App_Progressive = this.POData.getData().POCreation.Progressive;
				oDraft.U_App_ProjectCode = this.POData.getData().POCreation.ProjectCode;
	
				
				if (this.PurchaseAdd === "1"){
					oDraft.U_App_Status = "Y";
				}
				
				//Postinf Draft in SAP
				$.ajax({
					url: "https://18.136.35.41:50000/b1s/v1/U_APP_CPOR",
					data: JSON.stringify(oDraft),
					type: "POST",
					xhrFields: {
						withCredentials: true
					},
					error: function (xhr, status, error) {
						var Message = xhr.responseJSON["error"].message.value;
						sap.m.MessageToast.show(Message);
						this.fHideBusyIndicator();
					},
					context: this,
					success: function (json) {}
				}).done(function (results) {
						if (results) {
						if (this.PurchaseAdd !== "1"){
							sap.m.MessageToast.show("Draft Added Successfully");
							this.fHideBusyIndicator();
						}
						this.fGetTransactionNumber();
						this.fHideBusyIndicator();
						this.PurchaseAdd = "";
						this.CardName = "";
						this.fDeleteData();
					}	
	
				}); 

			}
	},
	//Delete Data
	fDeleteData: function () {
			this.byId("BPCode").setValue("");
			this.POData.getData().POCreation.Retention = "";
			this.POData.getData().POCreation.Progressive = "";
			this.POData.getData().POCreation.ProjectCode = "";
			this.POData.getData().POCreation.PostingDate = "";
			this.POData.getData().POCreation.Attachment = "";
			this.POData.getData().POCreation.ContractAmount = 0;
			this.byId("fileUploader").setValue("");
			this.byId("CntAmount").setValue("");
			this.getView().byId("TextArea").setValue("");
			this.POData.refresh();
	},
	//To get UDT Code
	fGenerateUDTCode: function (docType) {

			var generatedCode = "";

			//To Get Code for UDT
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
	//To get Transaction Number	
	fGetTransactionNumber: function () {

			var oDatabase = this.Database;

			// Viewing Transaction Number
			this.oTransIDs = new JSONModel();
			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + oDatabase +
					"&procName=spAppRetention&queryTag=getPODraftCount&value1=&value2=&value3=&value4=",
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
					this.POData.getData().POCreation.DocumentNum = results[0].DocNum;
					this.POData.refresh();
				}
			});
	},
	//To get Date Today
	fGetTodaysDate: function () {
			var today = new Date();
			var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
			return date;
	},
	//Hide Busy Incator
	fHideBusyIndicator : function() {
		BusyIndicator.hide();
	},
	//Indicator Function
	fShowBusyIndicator : function (iDuration, iDelay) {
		BusyIndicator.show(iDelay);

		if (iDuration && iDuration > 0) {
			if (this._sTimeoutId) {
				clearTimeout(this._sTimeoutId);
				this._sTimeoutId = null;
			}
		}
	},

	//-- For File Uploading--

	// onHandleUploadComplete: function (oEvent){



			
	// },
	// handleValueChange: function (oEvt){
	// 	var aFiles=oEvt.getParameters().files;
	// 	this.currentFile = aFiles[0];

	// 	// var form = new FormData();
	// 	// form.append("",this.currentFile, "");

	// 	// var settings = {
	// 	//   "url": "https://18.136.35.41:50000/b1s/v1/Attachments2",
	// 	//   "data": form,
	// 	//   "method": "POST",
	// 	//   "processData": false,
	// 	//   "mimeType": "multipart/form-data",
	// 	//   "contentType": false
	// 	// };
		
	// 	// $.ajax(settings).done(function (response) {
	// 	//   console.log(response);
	// 	// });
	// 	//ayaw ng PurchaseOrder?
	// 	// posted po sir all transaction excep dito nalang po sir problen ko po 
		
	// 	//pero kapag yung ajax request na Purchase Order is nasa loob ng handleValueChange?
	// 	// hindi po nag po post sir try ko po kaya sy ailabas baka sakaling gumana??





	// },


  });
});
