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

  return Controller.extend("com.apptech.app-retention.controller.ContractReport", {

    onInit: function () {

	  //BLANK JSONMODEL FOR ALL BP FOR TEMPLATE
			this.oMdlAllBP = new JSONModel(); //
			this.oMdlAllBP.getData().allbp = [];
	  //BLANK JSONMODEL FOR ALL PROJECT CODE FOR TEMPLATE
	        this.oMdlAllProject = new JSONModel(); 
	        this.oMdlAllProject.getData().allbp = [];

	  //INPUT Contract Paramaters Model
		 	this.Contract = new JSONModel("model/ContractReport.json");
		  	this.getView().setModel(this.Contract, "Contract");	

      //Getting Data From LoginView
			this.Database = jQuery.sap.storage.get("Database");
			this.UserName = jQuery.sap.storage.get("Usename");
      
      //getButtons
			this.oMdlButtons = new JSONModel();
			this.oResults = AppUI5.fGetButtons(this.Database,this.UserName,"contractreport");
			var newresult = [];
				  this.oResults.forEach((e)=> {
					  var d = {};
					  d[e.U_ActionDesc] = JSON.parse(e.visible);
					  newresult.push(JSON.parse(JSON.stringify(d)));
				  });
			var modelresult = JSON.parse("{" + JSON.stringify(newresult).replace(/{/g,"").replace(/}/g,"").replace("[","").replace("]","") + "}");
			this.oMdlButtons.setJSON("{\"buttons\" : " + JSON.stringify(modelresult) + "}");
			this.getView().setModel(this.oMdlButtons, "buttons");

		//Vendor Code
			this.VendorCode = "";
		// To Check if the Generate button was clicked if the value is 1 = Clicked else  0 not yet click
			this.Generate  = "0";

		//Get All Contract and Retention Records
			this.oMdlAllRecords = new JSONModel();
		//Get All Contract and Retention Records
			this.oMdlTotal = new JSONModel();
		//Row Count
			this.RowCount = 0;
			
		//Totals
			this.ContractAmountTotal = 0;
			this.PaymentTotal = 0;
			this.BalanceTotal = 0 ;
			this.CardName = "";

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
		this.VendorCode = CardDetails[0].CardCode;
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
				url: "https://xsjs.biotechfarms.net/app-xsjs/ExecQuery.xsjs?dbName=" + Database +
					"&procName=spAppRetention&queryTag=getBPMaster&value1=&value2=&value3=&value4=",
				type: "GET",
				dataType: "json",
			  beforeSend: function (xhr) {
				xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:Qwerty0987$"));
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
					url: "https://xsjs.biotechfarms.net/app-xsjs/ExecQuery.xsjs?dbName=" + Database +
						"&procName=spAppRetention&queryTag=getAllActiveProjectCode&value1=&value2=&value3=&value4=",
					type: "GET",
					dataType: "json",
				  beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:Qwerty0987$"));
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
			this.fConfigValueHelpProjDialogs();
			this.getView().byId("ProjCode").setValue(CardDetails[0].ProjectCode);
	},
	//------------------- Project Code End -----------------//
	//--Print
	fPrint:function(){

		if (this.Generate === "1"){

			var today = new Date();
			var dd = today.getDate();
	
			var mm = today.getMonth()+1; 
			var yyyy = today.getFullYear();
			if(dd<10) 
			{
				dd='0'+dd;
			} 
	
			if(mm<10) 
			{
				mm='0'+mm;
			} 
			today = mm+'-'+dd+'-'+yyyy;
			console.log(today);


			var doc = new jsPDF('l');

			doc.setFontType("bold");
			doc.setFontSize(14)
			doc.text(15,25,'CONTRACT STATUS REPORT');
			doc.setFontSize(13)
			doc.text(15,30,'AS OF ' + today);

		
			doc.autoTable({html:'#tblTransaction'});
			var columns = ["CONTRACTOR","CONTRACT NO","PROJECT DESCRIPTION","DATE STARTED","DATE COMPLETED","DATE LAST PAYMENT","CONTRACT AMOUNT","PAYMENT","BALANCE","ACCOMPLISHMENT","STATUS"];
			var data = [];
			for(var i=0;i<this.RowCount;i++)
					{

							data[i]=[this.oMdlAllRecords.getData().allData[i].CardName,this.oMdlAllRecords.getData().allData[i].DocNum,this.oMdlAllRecords.getData().allData[i].U_APP_ProjCode,this.oMdlAllRecords.getData().allData[i].Date_Started,this.oMdlAllRecords.getData().allData[i].DateCompleted,this.oMdlAllRecords.getData().allData[i].Date_Last_Payment,
							(this.oMdlAllRecords.getData().allData[i].DocTotal).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),(this.oMdlAllRecords.getData().allData[i].Payment).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),(this.oMdlAllRecords.getData().allData[i].Balance).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),this.oMdlAllRecords.getData().allData[i].Accomplishment,this.oMdlAllRecords.getData().allData[i].Status];
					}
			doc.autoTable({
				theme:'plain',
				columns,
				body:data,
				startY:35,
				styles:{
						fontSize: 6,
						halign:'center'
					   }
				});

			let finalY = doc.lastAutoTable.finalY + 13;
			let finalYY = doc.lastAutoTable.finalY + 14;
			let finalX = doc.lastAutoTable.finalY + 2;
			let finalXX = doc.lastAutoTable.finalY + 7;
			let finalXXX = doc.lastAutoTable.finalY + 8;
			doc.setFontSize(14)
			doc.text(15, finalX, "_________________________________________________________________________________________________");
			doc.setFontSize(7)
			doc.text(15, finalXX,this.CardName);

//
			doc.text(175, finalXX, this.ContractAmountTotal);
			doc.text(196, finalXX, this.PaymentTotal);
			doc.text(213, finalXX, this.BalanceTotal);
			doc.setFontSize(14)
			doc.text(15, finalXXX,  "_________________________________________________________________________________________________")  ;
			 doc.save ('BFI COntract Status Report.pdf');
			 this.Generate = "0";	
		}else{
			sap.m.MessageToast.show("Generate First...");
			this.Generate = "0";
		}



	},
	//--Generate Process
	fGenerate:function (){

		this.ContractAmountTotal = 0;
		this.PaymentTotal = 0;
		this.BalanceTotal = 0 ;
		this.CardName = "";



		var Contractor = this.VendorCode;
		var ProjectCode = this.getView().byId("ProjCode").getValue();
		var StartDate =  this.getView().byId("DateFrom").getValue();
		var EndDate =  this.getView().byId("DateEnd").getValue();

		if  (Contractor === "" &&  ProjectCode == "" && StartDate == "" && EndDate == ""  ){
			sap.m.MessageToast.show("No Data to Generate.");
		}else{
			this.Generate = "1";
			//---Contractor Only
			if  (Contractor != "" &&  ProjectCode == "" && StartDate == "" && EndDate == ""  ){
				this.fGetAllRecord("gtAllDtaCntrctOnly",Contractor,"","","");
				this.fGetTotal("getContractOnlyTotal",Contractor,"","","");
			//-- Contractor and ProjectCode Only
			}else if (Contractor != "" &&  ProjectCode !== "" && StartDate == "" && EndDate == ""  ){
				this.fGetAllRecord("gtCntrctANDPrjCode",Contractor,ProjectCode,"","");	
				this.fGetTotal("getContractANDProjectCodeTOTAL",Contractor,ProjectCode,"","");	
			//-- Contractor and Project Code and Start Date Only
			}else if(Contractor !== "" &&  ProjectCode !== "" && StartDate !== "" && EndDate == ""  ){
				this.fGetAllRecord("getContractANDProjectCodeANDStartDate",Contractor,ProjectCode,StartDate,"");	
				this.fGetTotal("getContractANDProjectCodeANDStartDateTotal",Contractor,ProjectCode,StartDate,"" );	
			//-- Contractor and Project Code and Start Date AND End Date
			}else if(Contractor !== "" &&  ProjectCode !== "" && StartDate !== "" && EndDate !== ""  ){
				this.fGetAllRecord("getContractANDProjectCodeANDStartDateTotal",Contractor,ProjectCode,StartDate,EndDate);	
				this.fGetTotal("getWithAllParams",Contractor,ProjectCode,StartDate,EndDate);	
			//--Contractor and StartDate Only
			}else if(Contractor !== "" &&  ProjectCode === "" && StartDate !== "" && EndDate === ""  ){
				this.fGetAllRecord("getContractANDStartDate",Contractor,StartDate,"","");	
				this.fGetTotal("getContractANDStartDateTotal",Contractor,StartDate,"","");	
			//--Project Code and StartDate Only
			}else if(Contractor === "" &&  ProjectCode !== "" && StartDate !== "" && EndDate === ""  ){
				this.fGetAllRecord("getContractANDProjectCode",ProjectCode,StartDate,"","");	
				this.fGetTotal("getProjectCodeANDStartDateTotal",ProjectCode,StartDate,"","");	
			//--Project Code Only
			}else if(Contractor === "" &&  ProjectCode !== "" && StartDate === "" && EndDate === ""  ){
				this.fGetAllRecord("getProjectCodeOnly",ProjectCode,"","","");	
				this.fGetTotal("getProjectCodeTotal",ProjectCode,"","","");	
			//--StartDate and EndDate Only
			}else if(Contractor === "" &&  ProjectCode === "" && StartDate !== "" && EndDate !== ""  ){
				this.fGetAllRecord("getStartDateANDEndDateOnly",StartDate,EndDate,"","");	
				this.fGetTotal("getStartDateANDEndDateTotal",StartDate,EndDate,"","");
			}
		}
	},
	//--Clear filter
	fClear: function(){
		this.VendorCode = "";
		this.getView().byId("BPCode").setValue("");	
		this.getView().byId("ProjCode").setValue("");
		this.getView().byId("DateFrom").setValue("");
		this.getView().byId("DateEnd").setValue("");
	},
	//--Get All Data Report
	fGetAllRecord:function(QueryTag,value1,value2,value3,value4){

		$.ajax({
			url: "https://xsjs.biotechfarms.net/app-xsjs/ExecQuery.xsjs?dbName=" + this.Database + "&procName=spAppRetention_Report&queryTag=" + QueryTag +"&value1=" + value1 + "&value2=" + value2 + "&value3=" + value3 + "&value4="+ value4 ,
			type: "GET",
			beforeSend: function(xhr) {
			  xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:Qwerty0987$"));
			},
			error: function(xhr, status, error) {
			  MessageToast.show(error);
			},
			success: function(json) {},
			context: this
		  }).done(function(results) {
			if (results) {
			  this.oMdlAllRecords.setJSON("{\"allData\" : " + JSON.stringify(results) + "}");
			  this.getView().setModel(this.oMdlAllRecords, "oMdlAllRecords");
			  this.RowCount = results.length;
			}
		  });


	},
	fGetTotal:function(QueryTag,value1,value2,value3,value4){

		$.ajax({
			url: "https://xsjs.biotechfarms.net/app-xsjs/ExecQuery.xsjs?dbName=" + this.Database + "&procName=spAppRetention_Report&queryTag=" + QueryTag +"&value1=" + value1 + "&value2=" + value2 + "&value3=" + value3 + "&value4="+ value4 ,
			type: "GET",
			beforeSend: function(xhr) {
			  xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:Qwerty0987$"));
			},
			error: function(xhr, status, error) {
			  MessageToast.show(error);
			},
			success: function(json) {},
			context: this
		  }).done(function(results) {
			if (results) {
				  this.oMdlTotal.setJSON("{\"allData\" : " + JSON.stringify(results) + "}");
				  this.getView().setModel(this.oMdlTotal, "oMdlTotal");

				  if(results[0].Contract_Amount === null)  {
					this.ContractAmountTotal = "0";
				  }else{
					this.ContractAmountTotal = (results[0].Contract_Amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
				  }

				  if(results[0].Payment === null){
					this.PaymentTotal = "0";
				  }else{
					this.PaymentTotal = (results[0].Payment).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
				  }

				  if(results[0].Balance === null){
					this.BalanceTotal = "0";
				  }else{
					this.BalanceTotal = (results[0].Balance).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
				  }
				  
				if(results[0].CardName === null){
					this.CardName = "" ;
				}else{
					this.CardName = results[0].CardName ;
				}

				this.fPrint(); 

			}
		  });


	}


  });
});
