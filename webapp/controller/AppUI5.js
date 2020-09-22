sap.ui.define([
	"sap/m/MessageBox"
], function (MessageBox) {
	"use strict";
	return ("com.apptech.app-retention.controller.AppUI5", {
		

		/*
		Guide on improving Apptech JS library:
		1. Make sure that all functions are independent to the your app. Always use method parameters to get necessary data.
		2. Always return a value; and don't interact with the calling js.
		*/
		/*
		Generic function helper to create table.
		@@ params : Table Name
					Table Description
					Table Type  - ("bott_Document","bott_DocumentLines",
									"bott_MasterData","bott_MasterDataLines",
									"bott_NoObject","bott_NoObjectAutoIncrement")
		*/
		generateUDTCode: function (Database,docType) {

			var generatedCode = "";

			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName="+ Database +"&procName=SPAPP_GENERATENUMBER&DocType="+ docType,
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
		getTodaysDate: function () {
			var today = new Date();
			var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
			return date ;
		},
		fErrorLogs: function (sTableAffected,sOperation,sKey1,sKey2,sErrorDesc,sProcess,sProcessBy,sKey3,Database,BatchLogs) {
			//var returnValue = 0;
			var oDate = this.getTodaysDate();
			var sCode = this.generateUDTCode(Database,"GetCode");
			var sBodyRequest = {};
			sBodyRequest.Code = sCode,
			sBodyRequest.Name = sCode,
			sBodyRequest.U_TableAffected = sTableAffected,
			sBodyRequest.U_Operation = sOperation,
			sBodyRequest.U_Key1 = sKey1,
			sBodyRequest.U_Key2 = sKey2,
			sBodyRequest.U_ErrorDesc = sErrorDesc,
			sBodyRequest.U_Process = sProcess,
			sBodyRequest.U_ProcessBy = sProcessBy,
			sBodyRequest.U_ProcessDate = oDate,
			sBodyRequest.U_Key3 = sKey3,
			sBodyRequest.U_INPUTBODY = BatchLogs

			$.ajax({
				url: "https://18.136.35.41:50000/b1s/v1/U_APP_ERRORLOGS",
				type: "POST",
				contentType: "multipart/mixed;boundary=a",
				data: JSON.stringify(sBodyRequest),
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					console.error("Error Posting in Error Logs");
				},
				success: function (json) {
					//sap.m.MessageToast.show("Success saving Batch: " + BatchCode );
				},
				context: this

			}).done(function (results) {
				if (results) {
					//
				}
			});
			//return returnValue;
		},
        fGetButtons: function(sDatabase,sUserCode,sModule){
			var aReturnResult = [];
			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName="+ sDatabase +"&procName=spAppRetention&QUERYTAG=getButtons" +
				"&VALUE1="+ sUserCode +"&VALUE2="+ sModule +"&VALUE3=&VALUE4=",
				type: "GET",
				async: false,
				dataType: "json",
				beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:P@ssw0rd805~"));
				},
				error: function (xhr, status, error) {
					var Message = xhr.responseJSON["error"].message.value;			
					sap.m.MessageToast.show(Message);
				},
				success: function (json) {},
				context: this
			}).done(function (results) {
				if (results) {
					aReturnResult = results;
				}
			});
			return aReturnResult;
		},

	});

});