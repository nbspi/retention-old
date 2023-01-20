sap.ui.define([
	"jquery.sap.global",
	"sap/ui/Device",
	"sap/ui/core/Fragment",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/Popover",
	"sap/m/Button",

	"sap/m/library",
	"sap/m/MessageToast",
	"sap/ui/core/BusyIndicator",
	"com/apptech/app-retention/controller/AppUI5",
], function (jQuery, Device, Fragment, Controller, JSONModel, Popover, Button, mobileLibrary, MessageToast,BusyIndicator,AppUI5) {
	"use strict";

  return Controller.extend("com.apptech.app-retention.controller.CreateUdtUdf", {

    onInit: function () {

		//Getting Data From LoginView
		this.Database = jQuery.sap.storage.get("Database");
		this.UserName = jQuery.sap.storage.get("Usename");

		//getButtons
		this.oMdlButtons = new JSONModel();
		this.oResults = AppUI5.fGetButtons(this.Database,this.UserName,"configuration");
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
    onCreateUDT: function(oEvent){
		this.fShowBusyIndicator(4000, 0);
    	// Retention Payable Header
    	this.createTable("APP_ORPT", "H_Retention Payable", "bott_NoObject");
    	// Retention Payable Detailes
		this.createTable("APP_RPT1", "D_Retention Payable", "bott_NoObject");
		// for Purchase Order 
		this.createTable("APP_CPOR", "Retention PO", "bott_NoObject");
		this.fHideBusyIndicator();
    },
    onCreateUDF: function (oEvent){
		this.fShowBusyIndicator(4000, 0);
      // --SAP Marketing Documents--

      // fieldName = "APP_RETTranstype" Description = "Retention Transaction Type"
      // values
	  // 1 - DownPayment
	  
      // 2 - First Progess Billing
      // 3 - Subsequent Progress Billing
      // 4 - Final Progress Billing
      // 5 - Retention Payments
	  this.createField("APP_IsForRetention", "For Retention Process", "OPOR", "db_Alpha", "", 1);
	  this.createField("APP_ProgBillRate", "Progress Billing Rate", "OPOR", "db_Numeric", "st_Sum", 30)	  
	  this.createField("APP_CWIP", "Retention N CWIP", "OPOR", "db_Float", "st_Sum", 30);
	  this.createField("APP_YCWIP", "Retention Y CWIP", "OPOR", "db_Float", "st_Sum", 30);
	  this.createField("APP_PODocEntry", "PO DocEntry", "OPCH", "db_Alpha", "", 20);
	  this.createField("APP_DPNature", "DP Nature", "OPOR", "db_Alpha", "", 20);
	  
      this.createField("APP_GrossAmount", "Gross Amount", "OPOR", "db_Float", "st_Sum", 30);
      this.createField("APP_WTX", "WTX", "OPOR", "db_Float", "st_Sum", 30);
      this.createField("APP_ProratedDP", "Prorated DP", "OPOR", "db_Float", "st_Sum", 30);
      this.createField("APP_ProRetention", "Prorated Retention", "OPOR", "db_Float", "st_Sum", 30);
      this.createField("APP_ProgBillAmount", "Progress Billing Amount", "OPOR", "db_Float", "st_Sum", 30);
      this.createField("APP_DPAmount", "Down Payment Amount", "OPOR", "db_Float", "st_Sum", 30);
	  this.createField("APP_Retention", "With Retention", "OPOR", "db_Alpha", "", 250);	  
	  this.createField("APP_ProjCode", "Project Code", "OPOR", "db_Alpha", "",30);
	  this.createField("APP_Progressive", "Progressive", "OPOR", "db_Alpha", "",5);
	  this.createField("APP_DocEntry", "DocEntry", "OPCH", "db_Alpha", "", 20);
	  this.createField("APP_Processed", "Processed", "OPCH", "db_Alpha", "", 20);

	  this.createField("APP_ProjectManager", "Project Manager", "OPRJ", "db_Alpha", "", 20);

      // -- Retention Payable Header --

      this.createField("App_Vendor", "Vendor", "@APP_ORPT", "db_Alpha", "", 30);
      this.createField("App_Name", "Name", "@APP_ORPT", "db_Alpha", "", 250);
      this.createField("App_DocNum", "Document Number", "@APP_ORPT", "db_Alpha", "", 30);
      this.createField("App_TransDate", "Transaction Date", "@APP_ORPT", "db_Date", "", "");
      this.createField("App_TransType", "Transaction Type", "@APP_ORPT", "db_Alpha", "", 30);
      this.createField("App_TaxType", "Tax Type", "@APP_ORPT", "db_Alpha", "", 30);
      this.createField("App_Remarks", "Remarks", "@APP_ORPT", "db_Alpha", "", 250);
      this.createField("App_RentAmnt", "Retention Amount", "@APP_ORPT", "db_Float", "st_Sum", 30);
      this.createField("App_DwnPymnt", "Down Payment", "@APP_ORPT", "db_Float", "st_Sum", 30);
      this.createField("App_ProgBill", "Progress Billing", "@APP_ORPT", "db_Float", "st_Sum", 30);
      this.createField("App_ContractAmount", "Contract Amount", "@APP_ORPT", "db_Float", "st_Sum", 30);
      this.createField("App_ProgBill_Type", "Progress Billing Type", "@APP_ORPT", "db_Alpha", "", 30);
      this.createField("App_DraftNum", "Draft Number", "@APP_ORPT", "db_Alpha", "", 30);
      this.createField("App_TransNum", "Transaction Number", "@APP_ORPT", "db_Alpha", "", 30);
      this.createField("App_DocEntry", "DocEntry", "@APP_ORPT", "db_Alpha", "", 30);
      this.createField("App_PostDate", "Posting Date", "@APP_ORPT", "db_Alpha", "", 30);
	  this.createField("App_DocStatus", "Tax Type", "@APP_ORPT", "db_Alpha", "", 30);
	  this.createField("App_LineNum", "Line Number", "@APP_ORPT", "db_Alpha", "", 30);
	  this.createField("App_BaseAmount", "Base Amount", "@APP_ORPT", "db_Float", "st_Sum", 30);
	  this.createField("App_WithTax", "Witholding Tax", "@APP_ORPT", "db_Float", "st_Sum", 30);
	  this.createField("App_File", "Attachment", "@APP_ORPT", "db_Alpha", "", 250);
	  this.createField("App_FileKey", "File Key", "@APP_ORPT", "db_Alpha", "", 250);
      this.createMandatoryFields("@APP_ORPT");

      // -- Retention Payable Detailes --
      this.createField("App_GrossAmnt", "Gross Amount", "@APP_RPT1", "db_Float", "st_Sum", 30);
      this.createField("App_ProReten", "Prorated Retention", "@APP_RPT1", "db_Float", "st_Sum", 30);
      this.createField("App_NetProgBill", "Net Progress Billing", "@APP_RPT1", "db_Float", "st_Sum", 30);
      this.createField("App_WTax", "Withlding Tax", "@APP_RPT1", "db_Float", "st_Sum", 30);
      this.createField("App_ProDP", "Prorated DownPayment", "@APP_RPT1", "db_Float", "st_Sum", 30);
      this.createField("App_LineNum", "Line Number", "@APP_ORPT", "db_Alpha", "", 30);
      this.createField("App_DocNum", "DocNum", "@APP_RPT1", "db_Numeric", "st_Sum", 30);
      this.createField("App_DocEntry", "DocEntry", "@APP_RPT1", "db_Alpha", "", 30);
      this.createField("App_TransNum", "Transaction Number", "@APP_RPT1", "db_Alpha", "", 30);
      this.createField("App_DocStatus", "Document Status", "@APP_RPT1", "db_Alpha", "", 30);
      this.createField("App_CWIP", "CWIP", "@APP_RPT1", "db_Numeric", "st_Sum", 30);

    // -- Purchase Order Transaction --
	  this.createField("App_Vendor", "Vendor", "@APP_CPOR", "db_Alpha", "", 30);
	  this.createField("App_TranNum", "Transaction Number", "@APP_CPOR", "db_Alpha", "", 30);
	  this.createField("App_Retention", "Retention", "@APP_CPOR", "db_Alpha", "", 30);
	  this.createField("App_PostDate", "Posting Date", "@APP_CPOR", "db_Date", "", "");
	  this.createField("App_File", "Attachment", "@APP_CPOR", "db_Alpha", "", 250);
	  this.createField("App_Remarks", "Remarkss", "@APP_CPOR", "db_Alpha", "", 250);
      this.createField("App_Status", "PO Status", "@APP_CPOR", "db_Alpha", "", 250);
	  this.createField("App_ConAmount", "Contract Amount", "@APP_CPOR", "db_Alpha", "", 30);
	  this.createField("App_VendorName", "Vendor Name", "@APP_CPOR", "db_Alpha", "", 250);
	  this.createField("App_Progressive", "Progressive", "@APP_CPOR", "db_Alpha", "", 5);
	  this.createField("App_ProjectCode", "Project Code", "@APP_CPOR", "db_Alpha", "", 20);
	  this.createField("App_FileKey", "File Key", "@APP_CPOR", "db_Alpha", "", 250);
	  this.createMandatoryFields("@APP_CPOR");


	  this.fHideBusyIndicator();
    },
    // Creation of Table
    createTable: function (sTableName, sDescription, sTableType) {
			var tableInfo = {};
			tableInfo.TableName = sTableName;
			tableInfo.TableDescription = sDescription;
			tableInfo.TableType = sTableType;

			var stringTableInfo = JSON.stringify(tableInfo);
			$.ajax({
				url: "https://test-saphanav10.biotechfarms.net/xsjs/app_xsjs/b1s/v1/UserTablesMD",
				data: stringTableInfo,
				type: "POST",
				async: false,
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					return error;
				},
				success: function (json) {
					sap.m.MessageToast.show("Success Creating UDT");
					return 0;
				},
				context: this
			});

    },
    // Creation of Fields
    createField: function (sFieldName, sDescription, sTableName, sType, sSubType, iSize) {
			var oFieldInfo = {};
			if (sFieldName === undefined || sDescription === undefined || sTableName === undefined) {
				return -1;
			}

			oFieldInfo.Description = sDescription;
			oFieldInfo.Name = sFieldName;
			oFieldInfo.TableName = sTableName;
			oFieldInfo.Type = sType;

			if (iSize === undefined || sType === "db_Numeric") {
				iSize = 11;
			}

			oFieldInfo.EditSize = iSize;
			oFieldInfo.Size = iSize;

			if (sType === "db_Float" || (!sSubType === undefined)) {
				oFieldInfo.SubType = sSubType;
			}

			var dataString = JSON.stringify(oFieldInfo);

			$.ajax({
				url: "https://test-saphanav10.biotechfarms.net/xsjs/app_xsjs/b1s/v1/UserFieldsMD",
				data: dataString,
				type: "POST",
				async: false,
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					return error;
				},
				success: function (json) {

					return 0;
				},
				context: this
			});

			return -1;

    },
    // Creation of Mandatory Fields
    createMandatoryFields: function (sTableName) {
			// createField()
			this.createField("App_CreatedDate", "Created Date", sTableName, "db_Date", undefined, undefined);
			this.createField("App_CreatedBy", "Created By", sTableName, "db_Alpha", undefined, undefined);
			this.createField("App_UpdatedDate", "Updated Date", sTableName, "db_Date", undefined, undefined);
			this.createField("App_UpdatedBy", "Created By", sTableName, "db_Alpha", undefined, undefined);
			/*
			U_App_CreatedDate
			U_App_CreatedBy
			U_App_UpdatedDate
			U_App_UpdatedBy
			*/
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
	}
  });
});
