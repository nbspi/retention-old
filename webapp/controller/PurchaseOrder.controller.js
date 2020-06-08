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
			//BLANK JSONMODEL FOR ALL PROJECT CODE FOR TEMPLATE
			this.oMdlAllProject = new JSONModel(); 
			this.oMdlAllProject.getData().allbp = [];

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

			//CPA
			this.currentFile = {}; //File Object	
			//For Attachment File Key
			this.FileKey = null;
			
			//Transaction Code
			var TransCode = this.byId("Docnum").getValue();

			//getButtons
			this.oMdlButtons = new JSONModel();
			this.oResults = AppUI5.fGetButtons(this.Database,this.UserNmae,"purchaseorder");
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
			this.CardName = CardDetails[0].CardName;
			this.CardCode = CardDetails[0].CardCode;
			this.fGetTransactionNumber();
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
		this.fGetTransactionNumber();
		this.fConfigValueHelpProjDialogs();
		this.getView().byId("ProjCode").setValue(CardDetails[0].ProjectCode);
	},
	//------------------- Project Code End -----------------//

	//Posting Purchase Order in SAP
	onSave: function () {	

			this.fShowBusyIndicator(4000, 0);
			var oDatabase = this.Database;
			this.PurchaseAdd = "1";

			var Vendor = this.CardCode;
			var ContractAmount = this.getView().byId("CntAmount").getValue();
			var ProjectCode = this.getView().byId("ProjCode").getValue();
			var Retention = this.POData.getData().POCreation.Retention;
			var PostingDate = this.getView().byId("DateFrom").getValue();
			var Remarks = this.getView().byId("TextArea").getValue();
			var ContranctAmount = this.byId("CntAmount").getValue();

			if (Vendor === "" ) {
				sap.m.MessageToast.show("Input Data First");
				this.fHideBusyIndicator();
				// this.fDeleteData();
			} else if (ContractAmount === 0 || ContractAmount === "" ){
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
					var poContract = ContranctAmount.replace(/,/g, '',/./g,'');
					var oContract = Number([poContract]);
					var oContract2 = oContract * 0.1;
					var Retention = Number([oContract2]); //For Retention

					var oContract3 = oContract - Retention;
					var oCWIP = Number([oContract3]); //For CWIP

					oPO.CardCode = Vendor;
					oPO.DocDate = PostingDate;
					oPO.DocumentLines = [];
					oPO.DocType = "dDocument_Service";
					oPO.AttachmentEntry = this.FileKey;
					oPO.U_APP_IsForRetention = "Y";
					oPO.U_APP_Retention = "Y";
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
					oPOLines2.UnitPrice = Retention;
					oPOLines2.VatGroup = "IVAT-EXC";
					oPOLines2.U_APP_RtnRowType = "R";
					oPOLines2.ProjectCode = this.POData.getData().POCreation.ProjectCode;
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
							var ErrorMassage = xhr.responseJSON["error"].message.value;
							sap.m.MessageToast.show(ErrorMassage);
							this.fHideBusyIndicator();
							console.error(ErrorMassage);
							AppUI5.fErrorLogs("OPOR & POR1","Add PO","null","null",ErrorMassage,"PurchaseOrder Save",this.UserNmae,"null",this.Database,JSON.stringify(oPO));
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
				
					var poContract = ContranctAmount.replace(/,/g, '',/./g,'');
					var oContract = Number([poContract]);

					oPO.CardCode = Vendor;
					oPO.DocDate = PostingDate;
					oPO.U_APP_IsForRetention = "Y";
					oPO.DocType = "dDocument_Service";
					oPO.U_APP_Retention = "N";
					oPO.AttachmentEntry = this.FileKey;
					oPO.U_APP_ProjCode = this.POData.getData().POCreation.ProjectCode;
					
					if (this.POData.getData().POCreation.Progressive === "0" ){
						oPO.U_APP_Progressive = "Yes";
					}else{
						oPO.U_APP_Progressive = "No" ;
					}

					oPO.DocumentLines = [];

					oPOLines1.LineNum = 0;
					oPOLines1.AccountCode = this.fGetGLAccount("getCWIPGLAccountOnly",1); //CWIP
					oPOLines1.UnitPrice = oContract;
					oPOLines1.VatGroup = "IVAT-EXC";
					oPOLines1.U_APP_RtnRowType = "C";
					oPOLines1.ProjectCode = this.POData.getData().POCreation.ProjectCode;
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
							console.error(ErrorMassage);
							AppUI5.fErrorLogs("OPOR & POR1","Add PO","null","null",ErrorMassage,"PurchaseOrder Save",this.UserNmae,"null",this.Database,JSON.stringify(oPO));
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

	},
	// Posting Draft
	fDraft: function () {

			var oDatabase = this.Database;

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
				oDraft.U_App_Remarks = this.getView().byId("TextArea").getValue();
				oDraft.U_App_CreatedDate = this.fGetTodaysDate();
				oDraft.U_App_CreatedBy = this.UserNmae;
				oDraft.U_App_Progressive = this.POData.getData().POCreation.Progressive;
				oDraft.U_App_ProjectCode = this.POData.getData().POCreation.ProjectCode;
				oDraft.U_App_File = this.getView().byId("fileUploader").getValue();
				oDraft.U_App_FileKey = this.FileKey;

	
				
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
						var ErrorMassage = xhr.responseJSON["error"].message.value;
						sap.m.MessageToast.show(ErrorMassage);
						this.fHideBusyIndicator();
						console.error(ErrorMassage);
						AppUI5.fErrorLogs("U_APP_CPOR","Add Draft",TransCode,"null",ErrorMassage,"PurchaseOrder Add Draft",this.UserNmae,"null",oDatabase,JSON.stringify(oDraft));
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
			this.FileKey = null;
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
	//To get UDT Code
	fGetGLAccount: function (QueryTag,Active) {

		var oGLAccount = "";

		//To Get Code for UDT
		$.ajax({
			url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database +
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
