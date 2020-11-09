sap.ui.define([
  "sap/m/MessageBox",
	"sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/ui/core/Fragment",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "com/apptech/app-retention/controller/AppUI5",
	"sap/ui/core/BusyIndicator"
], function(MessageBox, Controller, JSONModel,Fragment, MessageToast, Filter, FilterOperator,AppUI5,BusyIndicator) {
  "use strict";

  return Controller.extend("com.apptech.app-retention.controller.ProjectCode", {

    onInit: function () {

      //Getting Data From LoginView
			this.Database = jQuery.sap.storage.get("Database");
      this.UserName = jQuery.sap.storage.get("Usename");

      this.oMdlAllEmp = new JSONModel(); //
			this.oMdlAllEmp.getData().allbp = [];

      this.oMdlAllProjects = new JSONModel();
      this.fGetAllProjectCode("getAllProjectCode");

			//INPUT PO CREATION PROJECTS
			this.Project = new JSONModel("model/ProjectCode.json");
      this.getView().setModel(this.Project, "Project");
      
      //getButtons
			this.oMdlButtons = new JSONModel();
			this.oResults = AppUI5.fGetButtons(this.Database,this.UserName,"projectCode");
			var newresult = [];
				this.oResults.forEach((e)=> {
					var d = {};
					d[e.U_ActionDesc] = JSON.parse(e.visible);
					newresult.push(JSON.parse(JSON.stringify(d)));
				});
			var modelresult = JSON.parse("{" + JSON.stringify(newresult).replace(/{/g,"").replace(/}/g,"").replace("[","").replace("]","") + "}");
			this.oMdlButtons.setJSON("{\"buttons\" : " + JSON.stringify(modelresult) + "}");
			this.getView().setModel(this.oMdlButtons, "buttons");

      this.EmpName = "";

    },
    fGetAllProjectCode: function (queryTag) {

      $.ajax({
        url: "https://18.141.110.57:4300/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database + "&procName=spAppRetention&queryTag=" + queryTag +
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
          this.oMdlAllProjects.setJSON("{\"allbp\" : " + JSON.stringify(results) + "}");
          this.getView().setModel(this.oMdlAllProjects, "oMdlAllProjects");
        }
      });
  
    },
    fProcess: function (){

      this.oTable = this.getView().byId("tblProjects");
      this.oTable.setModel(this.oMdlAllProjects);
      
      var iIndex = this.oTable.getSelectedIndex();
      var sCode = "";

      var oRowSelected = this.oTable.getBinding().getModel().getData().allbp[this.oTable.getBinding().aIndices[iIndex]];

      this.Project.getData().Project.ProjectCode = oRowSelected.ProjectCode;
      this.Project.getData().Project.ProjectName = oRowSelected.ProjectName;
      this.Project.getData().Project.ValidFrom = oRowSelected.ValidFrom; 
      this.Project.getData().Project.ValidTo = oRowSelected.ValidTo;
      this.Project.getData().Project.Active = oRowSelected.Active;  
      this.getView().byId("ProjMAnager").setValue(oRowSelected.ProjectManager);
      this.Project.getData().btnAdd.ENABLED = false ;  
      this.Project.getData().btnUpdate.ENABLED = true ;
      this.Project.getData().ProjectCode.ENABLED = false ;
      this.Project.refresh();

      var otab1 = this.getView().byId("idIconTabBarInlineMode");
      otab1.setSelectedKey("tab2");    

    },
    fIconTabSelect: function () {
			var Tab = this.getView().byId("idIconTabBarInlineMode").getSelectedKey();

			if (Tab === "tab1") {
        this.fGetAllProjectCode("getAllProjectCode");
        this.fRemoveData();
			}else{
        this.Project.getData().btnAdd.ENABLED = true ;  
        this.Project.getData().btnUpdate.ENABLED = false ;
        this.Project.getData().ProjectCode.ENABLED = true ;
        this.Project.refresh();
      }
    },
    fRemoveData: function(){
      this.EmpName = "";
      this.getView().byId("ProjMAnager").setValue("");
      this.Project.getData().Project.ProjectCode = "";
      this.Project.getData().Project.ProjectName = "";
      this.Project.getData().Project.ValidFrom = ""; 
      this.Project.getData().Project.ValidTo = "";
      this.Project.getData().Project.Active = "";  
      this.Project.refresh();
    },
    //Add Project Code
    fAddProjCode: function(){

      this.fShowBusyIndicator(4000, 0);
      var ProjectCode = this.byId("ProCode").getValue();

      if (ProjectCode === ""){
        sap.m.MessageToast.show("Input Data");
        this.fHideBusyIndicator();
      }else{

          var Project = {};
          var Code = this.Project.getData().Project.ProjectCode;

          Project.Code = Code;
          Project.Name = this.Project.getData().Project.ProjectName;
          Project.ValidFrom = this.Project.getData().Project.ValidFrom;
          Project.ValidTo = this.Project.getData().Project.ValidTo;
          Project.Active = this.Project.getData().Project.Active;
          Project.U_APP_ProjectManager = this.EmpName;

          // POsting Project in SAP
			    $.ajax({
			    	url: "https://18.141.110.57:50000/b1s/v1/Projects",
			    	data: JSON.stringify(Project),
			    	type: "POST",
			    	xhrFields: {
			    		withCredentials: true
			    	},
			    	error: function (xhr, status, error) {
              var ErrorMassage = xhr.responseJSON["error"].message.value;
              sap.m.MessageToast.show(ErrorMassage);
              console.error(ErrorMassage);
              this.fHideBusyIndicator();
              AppUI5.fErrorLogs("OPRJ","Posting Project Code","null","null",ErrorMassage,"Retention Posting Project Code",this.UserName,"null", this.Database,JSON.stringify(Project));
			    	},
			    	context: this,
			    	success: function (json) {}
			    }).done(function (results) {
			    	if (results) {
              sap.m.MessageToast.show("Project Code" + results.Code + " Added Successfully");
              this.fRemoveData();
			    		this.fHideBusyIndicator();
			    	}
			    });

      }

    },
    // Updatin of Project Code
    fUpdateProjCode: function(){
      this.fShowBusyIndicator(4000, 0);

      var ProjectCode = this.byId("ProCode").getValue();

      if (ProjectCode === ""){
        sap.m.MessageToast.show("Input Data");
        this.fHideBusyIndicator();
      }else{

        var sCode = this.Project.getData().Project.ProjectCode;

        var Project = {};
  
        Project.Code = this.Project.getData().Project.ProjectCode;
        Project.Name = this.Project.getData().Project.ProjectName;
        Project.ValidFrom = this.Project.getData().Project.ValidFrom;
        Project.ValidTo = this.Project.getData().Project.ValidTo;
        Project.Active = this.Project.getData().Project.Active;
        Project.U_APP_ProjectManager = this.EmpName;
  
        // Update Project in SAP
        $.ajax({
          url: "https://18.141.110.57:50000/b1s/v1/Projects('"+ sCode +"')",
          data: JSON.stringify(Project),
          type: "PATCH",
          xhrFields: {
            withCredentials: true
          },
          error: function (xhr, status, error) {
            this.fHideBusyIndicator();
            var Message = xhr.responseJSON["error"].message.value;
            sap.m.MessageToast.show(Message);
            console.error(ErrorMassage);
            AppUI5.fErrorLogs("OPRJ","Update Project Code",sCode,"null",ErrorMassage,"Retention Update Project Code",this.UserName,"null",this.Database,JSON.stringify(Project));      
            this.fRemoveData();
          },
          context: this,
          success: function (json) {
            sap.m.MessageToast.show("Updated Successfully");
            this.fRemoveData();
            this.fHideBusyIndicator();
          }
        }).done(function (results) {
          if (results) {
            sap.m.MessageToast.show("Updated Successfully");
            this.fRemoveData();
            this.fHideBusyIndicator();
          }
        });

      }

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
    // Grid Filter
    onFilterValue:function (oEvent){

      var value = oEvent.mParameters.column.sId;
      var oVAlue1 = oEvent.mParameters.value;
      
      if (value === "__column0"){
        this.fGetFilterValues("getFilterProjectCode",oVAlue1);
      } else if (value === "__column3"){
        this.fGetFilterValues("getFilterProjectActive",oVAlue1);
      } else {
        this.fGetAllProjectCode("getAllProjectCode");
      }
      
    },
    fGetFilterValues: function (queryTag, oValue) {
      this.oMdlAllProjects = new JSONModel();
			$.ajax({
				url: "https://18.141.110.57:4300/app_xsjs/ExecQuery.xsjs?dbName=" + this.Database + "&procName=spAppRetention&queryTag=" + queryTag +
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
					this.oMdlAllProjects.setJSON("{\"allbp\" : " + JSON.stringify(results) + "}");
          this.getView().setModel(this.oMdlAllProjects, "oMdlAllProjects");
				}
			});

    },
    //Add New Project Code Button
    fAddNew:function (){

      var Tab = this.getView().byId("idIconTabBarInlineMode").getSelectedKey();

        this.Project.getData().btnAdd.ENABLED = true ;  
        this.Project.getData().btnUpdate.ENABLED = false ;
        this.Project.getData().ProjectCode.ENABLED = true ;
        this.Project.refresh();
      var otab1 = this.getView().byId("idIconTabBarInlineMode");
      otab1.setSelectedKey("tab2");    
    },

    	//----------------------- Business Partner -------------------//
    	//BP Search Fragment
    onHandleSearchEmployee: function (oEvent) {
        var sValue = oEvent.getParameter("value");
        var oFilter = new Filter("firstName", FilterOperator.Contains, sValue);
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
            oCard.firtName = oContext.getObject().firstName;
            oCard.lastName = oContext.getObject().lastName;
            return oCard;
          });
        }
        oEvent.getSource().getBinding("items").filter([]);
        this.EmpName =  CardDetails[0].firtName + " " + CardDetails[0].lastName;
        // this.CardName = CardDetails[0].firtN;
        // this.CardCode = CardDetails[0].CardCode;
        this.getView().byId("ProjMAnager").setValue(this.EmpName);
    },
    ///BP LIST FROM FRAGMENT
    onHandleValueEmpMaster: function () {
          Fragment.load({
            name: "com.apptech.app-retention.view.fragments.EmployeeFragment",
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
        var sInputValue = this.byId("ProjMAnager").getValue();
    
          $.ajax({
            url: "https://18.141.110.57:4300/app_xsjs/ExecQuery.xsjs?dbName=" + Database +
              "&procName=spAppRetention&queryTag=getEmployee&value1=&value2=&value3=&value4=",
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
              this.oMdlAllEmp.getData().allbp = results;
              this.getView().setModel(this.oMdlAllEmp, "oMdlAllEmp");
              this.oMdlAllEmp.refresh();
            
              var aList = this.oMdlAllEmp.getProperty("/allbp");
            
              aList.forEach(function (oRecord) {
                oRecord.selected = (oRecord.firstName === sInputValue);
              });
            
            }
          });
        
    },
    //----------------- Business Partner END -------------------//


  });
});
