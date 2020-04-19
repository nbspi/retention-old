sap.ui.define([
  "sap/m/MessageBox",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "com/apptech/app-retention/controller/AppUI5",
	"sap/ui/core/BusyIndicator"
], function(MessageBox, Controller, JSONModel, MessageToast, Filter, FilterOperator,AppUI5,BusyIndicator) {
  "use strict";

  return Controller.extend("com.apptech.app-retention.controller.ProjectCode", {

    onInit: function () {

      //Getting Data From LoginView
			this.Database = jQuery.sap.storage.get("Database");
      this.UserName = jQuery.sap.storage.get("Usename");

      this.oMdlAllProjects = new JSONModel();
      this.fGetAllProjectCode("getAllProjectCode");

			//INPUT PO CREATION PROJECTS
			this.Project = new JSONModel("model/ProjectCode.json");
			this.getView().setModel(this.Project, "Project");

    },
    fGetAllProjectCode: function (queryTag) {

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

          // POsting Project in SAP
			    $.ajax({
			    	url: "https://18.136.35.41:50000/b1s/v1/Projects",
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
              AppUI5.fErrorLogs("OPRJ","Update Project Code",Code,"null",ErrorMassage,"Retention Update Project Code",this.UserName,"null", this.Database,Project);
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
  
        // POsting Project in SAP
        $.ajax({
          url: "https://18.136.35.41:50000/b1s/v1/Projects('"+ sCode +"')",
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
            AppUI5.fErrorLogs("OPRJ","Update Project Code",sCode,"null",ErrorMassage,"Retention Update Project Code",this.UserName,"null",this.Database,Project);      
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
					this.oMdlAllProjects.setJSON("{\"allbp\" : " + JSON.stringify(results) + "}");
          this.getView().setModel(this.oMdlAllProjects, "oMdlAllProjects");
				}
			});

		}

  });
});
