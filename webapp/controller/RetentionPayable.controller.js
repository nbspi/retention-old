sap.ui.define([
  "sap/m/MessageBox",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(MessageBox, Controller, JSONModel, MessageToast, Filter, FilterOperator) {
  "use strict";

  return Controller.extend("com.apptech.app-retention.controller.RetentionPayable", {

    _data: {
			"date": new Date()
		},

		onInit: function () {

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

			//Table View of Purchase Order
			this.oGetAllPOTransaction();

			this.tableId = "tblRetention";
			this.oModelPurchase = new JSONModel();
			this.oModelUDT = new JSONModel();
		},

		onProcess: function () {

			var that = this;
			that.oTable = that.getView().byId(that.tableId);
			that.oTable.setModel(that.oMdlAllRecord);

			var iIndex = this.oTable.getSelectedIndex();
			var sStatus = "";
			var sCode = "";

			var oRowSelected = that.oTable.getBinding().getModel().getData().allbp[that.oTable.getBinding().aIndices[iIndex]];
			sStatus = oRowSelected.DocStatus;
			sCode = oRowSelected.DocEntry;
			var oPoStatus = this.getView().byId("selectRecordGroup").getSelectedKey();

			that.DocTotalProcess = oRowSelected.DocTotal;

			if (sStatus === "Draft") {

				// Getting Data From UDT 
				this.oGetDatafromHeaderUDT("DP");

				if (oPoStatus === "0") {
					this.oSetTransacationType("0");
				} else if (oPoStatus === "3") {
					this.oSetTransacationType("3");
				} else if (oPoStatus === "4") {
					this.oSetTransacationType("4");
				}

				var tab1 = this.getView().byId("idIconTabBarInlineMode");
				tab1.setSelectedKey("tab2");
				this.bIsAdd = "E";

			} else {

				// Gettting Data Information
				this.oGetRetentionProcess(sCode);
				// Getting Transtion Number
				this.oGetTransactionNumber();

				if (oPoStatus === "0") {
					this.oSetTransacationType("0");
				} else if (oPoStatus === "3") {
					this.oSetTransacationType("3");
				} else if (oPoStatus === "4") {
					this.oSetTransacationType("4");
				}

				var otab1 = this.getView().byId("idIconTabBarInlineMode");
				otab1.setSelectedKey("tab2");
				this.bIsAdd = "E";

			}

		},

		oGetDatafromHeaderUDT: function (oDocStatus) {

			var that = this;
			that.oTable = that.getView().byId(that.tableId);
			that.oTable.setModel(that.oMdlAllRecord);

			var iIndex = this.oTable.getSelectedIndex();
			var sStatus = "";
			var sCode = "";

			var oRowSelected = that.oTable.getBinding().getModel().getData().allbp[that.oTable.getBinding().aIndices[iIndex]];
			sStatus = oRowSelected.DocStatus;
			sCode = oRowSelected.DocEntry;
			var PoStatus = this.getView().byId("selectRecordGroup").getSelectedKey();
			that.DocTotalProcess = oRowSelected.DocTotal;

			this.oModelOpenPO = new JSONModel();
			$.ajax({
				url: "https://18.136.35.41:4300/appxsjs/ExecQuery.xsjs?dbName=SBODEMOAU_SL&procName=spAppRetention&queryTag=getPOTransaction&value1=" +
					sCode + "&value2=&value3=&value4=",
				type: "GET",
				async: false,
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					// MessageToast.show(error);
				},
				success: function (json) {},
				context: this
			}).done(function (results) {
				if (results.length === 0) {
					// MessageToast.show("No Retention Row to process");
					//resetting of POFields.json model
					this.DeleteData();
				} else {
					this.DeleteData();

					this.oModelPurchase.setJSON("{\"POFields\" : " + JSON.stringify(results).replace("[", "").replace("]", "") + "}");
					this.getView().setModel(this.oModelPurchase, "oModelPurchase");

					// this.oModelPurchase.getData().POFields.DocEntry = "";
					// this.oModelPurchase.getData().POFields.CardCode = "";
					// this.oModelPurchase.getData().POFields.CardName = "";
					// this.oModelPurchase.getData().POFields.DocNum = "";
					// this.oModelPurchase.getData().POFields.DocDate = "";
					// this.oModelPurchase.getData().POFields.DocTotal = "";
					// this.oModelPurchase.getData().POFields.Price = "";
					// this.oModelPurchase.getData().POFields.WTCode = "";
					// this.oModelPurchase.getData().POFields.Rate = "";
					// this.oModelPurchase.refresh();
				}

			});

			// SET VALUE FROM UDT
			// Header Information

			$.ajax({
				url: "https://18.136.35.41:4300/appxsjs/ExecQuery.xsjs?dbName=SBODEMOAU_SL&procName=spAppRetention&queryTag=getUDThdr&value1=" + sCode +
					"&value2=" + oDocStatus + "&value3=&value4=",
				type: "GET",
				async: false,
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					// MessageToast.show(error);
				},
				success: function (json) {},
				context: that
			}).done(function (results) {
				if (results.length === 0) {
					// MessageToast.show("No Retention Row to process");
					// //resetting of POFields.json model
					// that.DeleteData();
				} else {
					this.DeleteData();

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

					if (PoStatus === "0") {
						oRetention = that.oModelUDT.getData().UDTFields.U_App_RentAmnt;
						oDocTotal = that.oModelUDT.getData().UDTFields.U_App_ContractAmount;
					} else {
						oRetention = "";
						oDocTotal = "";
					}

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

					this.oModelPurchase.getData().POFields.Price = oRetention;
					this.getView().byId("DPayment").setValue(oDP);
					this.oModelPurchase.getData().POFields.DocTotal = oDocTotal;
					this.getView().byId("ProgBill").setValue(oProgBill);
					this.getView().byId("PBType").setValue(oProgType);

					this.getView().byId("TextArea").setValue(oRemarks);

					this.oModelPurchase.refresh();

				}

			});

			// DETAILES INFORMATION
			// getUDTdtl

			var Dog = "";

			$.ajax({
				url: "https://18.136.35.41:4300/appxsjs/ExecQuery.xsjs?dbName=SBODEMOAU_SL&procName=spAppRetention&queryTag=getUDTdtl&value1=" + sCode +
					"&value2=&value3=&value4=",
				type: "GET",
				async: false,
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					// MessageToast.show(error);
				},
				success: function (json) {},
				context: that
			}).done(function (oresults) {
				if (oresults.length === 0) {

				} else {
					that.oModelUDT.setJSON("{\"UDFFields\" : " + JSON.stringify(oresults).replace("[", "").replace("]", "") + "}");
					that.getView().setModel(that.oModelUDT, "oModelUDT");

					var oCWIP = "";
					var oGrossAmount = "";
					var oWtx = "";
					var oProratedDP = "";
					var oProratedRetention = "";
					var oNetProgBill = "";

					oCWIP = that.oModelUDT.getData().UDFFields.U_App_CWIP;
					oGrossAmount = that.oModelUDT.getData().UDFFields.U_App_GrossAmnt;
					oWtx = that.oModelUDT.getData().UDFFields.U_App_WTax;
					oProratedDP = that.oModelUDT.getData().UDFFields.U_App_ProDP;
					oProratedRetention = that.oModelUDT.getData().UDFFields.U_App_ProReten;
					oNetProgBill = that.oModelUDT.getData().UDFFields.U_App_NetProgBill;

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

		onAddingSAP: function () {

			var SupplierCode = this.getView().byId("VenSupCode").getValue();

			if (SupplierCode !== "") {

				var PoStatus = this.getView().byId("selectRecordGroup").getSelectedKey();

				if (PoStatus === "0") {
					this.onSavingDownPayment();
				} else {

					var ProgType = this.getView().byId("PBType").getSelectedKey();

					if (ProgType === "0") {

					} else if (ProgType === "1") {
						// First Progress Billing
						this.onSavingFirstProgressBilling();
					} else if (ProgType === "2") {
						// Subsequent Progress Billing 
						this.onSavingSubsequentBilling();
						// Final Progress Billing 
					} else if (ProgType === "3") {

					}

				}

			} else {
				sap.m.MessageToast.show("No Data to Post in SAP");
				this.DeleteData();
			}

		},

		onSavingFirstProgressBilling: function () {

			// ADDING GRPO
			var oFGRPO = {};
			var oFGRPOLines = {};

			var GRPOCardCode = this.oModelPurchase.getData().POFields.CardCode;

			oFGRPO.CardCode = GRPOCardCode;
			oFGRPO.DocType = "dDocument_Service";
			oFGRPO.DocTotal = this.DTRetention.getData().DetailesRetention[0].GrossAmount;
			oFGRPO.Comments = this.getView().byId("TextArea").getValue();
			oFGRPO.U_APP_RETTranstype = 2;
			oFGRPO.DocumentLines = [];

			oFGRPOLines.BaseLine = 0;
			oFGRPOLines.BaseEntry = this.oModelPurchase.getData().POFields.DocEntry;
			oFGRPOLines.BaseType = 22;
			oFGRPOLines.UnitPrice = this.DTRetention.getData().DetailesRetention[0].GrossAmount;
			oFGRPOLines.VatGroup = "IVAT-EXC";
			oFGRPOLines.U_APP_RtnRowType = "C";
			oFGRPOLines.WTLiable = "tNO";

			oFGRPO.DocumentLines.push(oFGRPOLines);

			this.oModelGRPO = new JSONModel();
			var oGRPO = {
				"url": "https://18.136.35.41:50000/b1s/v1/PurchaseDeliveryNotes",
				"method": "POST",
				"timeout": 0,
				"headers": {
					"Content-Type": "application/json"
				},
				"data": JSON.stringify(oFGRPO)
			};

			var PoDocEntry = this.oModelPurchase.getData().POFields.DocEntry;
			var INVGRPOCardCode = this.oModelPurchase.getData().POFields.CardCode;
			var APWTCode = this.oModelPurchase.getData().POFields.WTCode;
			var APRemarks = this.getView().byId("TextArea").getValue();
			var APUnitPrice = this.DTRetention.getData().DetailesRetention[0].CWIP;
			var APWTX = this.DTRetention.getData().DetailesRetention[0].WTX;

			$.ajax(oGRPO).done(function (response) {
				// ADDING A/P INVOICE

				var GRPODocEntry = response.DocEntry;

				this.oModelAPINV = new JSONModel();
				$.ajax({
					url: "https://18.136.35.41:4300/appxsjs/ExecQuery.xsjs?dbName=SBODEMOAU_SL&procName=spAppRetention&queryTag=getAPINVDoc&value1=" +
						PoDocEntry + "&value2=&value3=&value4=",
					type: "GET",
					xhrFields: {
						withCredentials: true
					},
					error: function (xhr, status, error) {
						MessageToast.show(xhr.responseText);
					},
					success: function (json) {},
					context: this
				}).done(function (FirstProgress) {
					if (FirstProgress) {

						var DpDocEntry = FirstProgress[0].DocEntry;
						var DpDocNum = FirstProgress[0].DocNum;
						var DPDocTotal = FirstProgress[0].DocTotal;

						var oAPINV = {};
						var oAPINVlines = {};
						var oAPDPlines = {};
						var oAPINVWTlines = {};

						oAPINV.CardCode = INVGRPOCardCode;
						oAPINV.DocType = "dDocument_Service";
						oAPINV.Comments = APRemarks;
						oAPINV.U_APP_RETTranstype = 2;

						oAPINV.DocumentLines = [];

						oAPINVlines.BaseType = 20;
						// oAPINVlines.BaseEntry = GRPODocEntry;
						oAPINVlines.BaseEntry = GRPODocEntry;
						oAPINVlines.BaseLine = 0;
						oAPINVlines.Price = 0;
						oAPINVlines.PriceAfterVAT = 0;
						oAPINVlines.UnitPrice = APUnitPrice;

						oAPINV.DocumentLines.push(oAPINVlines);

						oAPINV.DownPaymentsToDraw = [];

						oAPDPlines.DocEntry = DpDocEntry;
						oAPDPlines.DocNumber = DpDocNum;
						oAPDPlines.AmountToDraw = DPDocTotal;
						oAPDPlines.DownPaymentType = "dptInvoice";

						oAPINV.DownPaymentsToDraw.push(oAPDPlines);

						oAPINV.WithholdingTaxDataCollection = [];
						oAPINVWTlines.WTCode = APWTCode;
						oAPINVWTlines.WTAmount = APWTX;

						oAPINV.WithholdingTaxDataCollection.push(oAPINVWTlines);

						var fPbInv = {
							"url": "https://18.136.35.41:50000/b1s/v1/PurchaseInvoices",
							"method": "POST",
							"timeout": 0,
							"headers": {
								"Content-Type": "application/json"
							},
							"data": JSON.stringify(oAPINV)
						};

						$.ajax(fPbInv).done(function (firstAPresponse) {
							sap.m.MessageToast.show("Added Successfully");

						});

					}

				});

			});

			this.DeleteData();

		},

		onSavingSubsequentBilling: function () {

			// ADDING GRPO
			var oFGRPO = {};
			var oFGRPOLines = {};

			var GRPOCardCode = this.oModelPurchase.getData().POFields.CardCode;

			oFGRPO.CardCode = GRPOCardCode;
			oFGRPO.DocType = "dDocument_Service";
			oFGRPO.DocTotal = this.DTRetention.getData().DetailesRetention[0].GrossAmount;
			oFGRPO.Comments = this.getView().byId("TextArea").getValue();
			oFGRPO.U_APP_RETTranstype = 2;
			oFGRPO.DocumentLines = [];

			oFGRPOLines.BaseLine = 0;
			oFGRPOLines.BaseEntry = this.oModelPurchase.getData().POFields.DocEntry;
			oFGRPOLines.BaseType = 22;
			oFGRPOLines.UnitPrice = this.DTRetention.getData().DetailesRetention[0].GrossAmount;
			oFGRPOLines.VatGroup = "IVAT-EXC";
			oFGRPOLines.U_APP_RtnRowType = "C";
			oFGRPOLines.WTLiable = "tNO";

			oFGRPO.DocumentLines.push(oFGRPOLines);

			this.oModelGRPO = new JSONModel();
			var oGRPO = {
				"url": "https://18.136.35.41:50000/b1s/v1/PurchaseDeliveryNotes",
				"method": "POST",
				"timeout": 0,
				"headers": {
					"Content-Type": "application/json"
				},
				"data": JSON.stringify(oFGRPO)
			};

			var PoDocEntry = this.oModelPurchase.getData().POFields.DocEntry;
			var INVGRPOCardCode = this.oModelPurchase.getData().POFields.CardCode;
			var APWTCode = this.oModelPurchase.getData().POFields.WTCode;
			var APRemarks = this.getView().byId("TextArea").getValue();
			var APUnitPrice = this.DTRetention.getData().DetailesRetention[0].CWIP;
			var APWTX = this.DTRetention.getData().DetailesRetention[0].WTX;

			$.ajax(oGRPO).done(function (response) {
				// ADDING A/P INVOICE

				var GRPODocEntry = response.DocEntry;

				this.oModelAPINV = new JSONModel();
				$.ajax({
					url: "https://18.136.35.41:4300/appxsjs/ExecQuery.xsjs?dbName=SBODEMOAU_SL&procName=spAppRetention&queryTag=getAPINVDoc&value1=" +
						PoDocEntry + "&value2=&value3=&value4=",
					type: "GET",
					xhrFields: {
						withCredentials: true
					},
					error: function (xhr, status, error) {
						MessageToast.show(xhr.responseText);
					},
					success: function (json) {},
					context: this
				}).done(function (FirstProgress) {
					if (FirstProgress) {

						var DpDocEntry = FirstProgress[0].DocEntry;
						var DpDocNum = FirstProgress[0].DocNum;
						var DPDocTotal = FirstProgress[0].DocTotal;

						var oAPINV = {};
						var oAPINVlines = {};
						var oAPINVWTlines = {};

						oAPINV.CardCode = INVGRPOCardCode;
						oAPINV.DocType = "dDocument_Service";
						oAPINV.Comments = APRemarks;
						oAPINV.U_APP_RETTranstype = 2;

						oAPINV.DocumentLines = [];

						oAPINVlines.BaseType = 20;
						// oAPINVlines.BaseEntry = GRPODocEntry;
						oAPINVlines.BaseEntry = GRPODocEntry;
						oAPINVlines.BaseLine = 0;
						oAPINVlines.Price = 0;
						oAPINVlines.PriceAfterVAT = 0;
						oAPINVlines.UnitPrice = APUnitPrice;

						oAPINV.DocumentLines.push(oAPINVlines);

						oAPINV.WithholdingTaxDataCollection = [];
						oAPINVWTlines.WTCode = APWTCode;
						oAPINVWTlines.WTAmount = APWTX;

						oAPINV.WithholdingTaxDataCollection.push(oAPINVWTlines);

						var fPbInv = {
							"url": "https://18.136.35.41:50000/b1s/v1/PurchaseInvoices",
							"method": "POST",
							"timeout": 0,
							"headers": {
								"Content-Type": "application/json"
							},
							"data": JSON.stringify(oAPINV)
						};

						$.ajax(fPbInv).done(function (firstAPresponse) {
							sap.m.MessageToast.show("Added Successfully");

						});

					}

				});

			});

			this.DeleteData();

		},

		onSavingDownPayment: function () {

			// var SupplierCode = this.getView().byId("VenSupCode").getValue();

			var oAPDown = {};
			var oAPLines = {};

			var CardCode = this.oModelPurchase.getData().POFields.CardCode;

			oAPDown.CardCode = CardCode;
			oAPDown.DocDate = this.oModelPurchase.getData().POFields.DocDate;
			oAPDown.DocType = "S";
			oAPDown.Comments = this.getView().byId("TextArea").getValue();
			oAPDown.U_APP_RETTranstype = 1;
			oAPDown.DownPaymentType = "dptInvoice";
			oAPDown.DocumentLines = [];

			oAPLines.BaseLine = 0;
			oAPLines.BaseEntry = this.oModelPurchase.getData().POFields.DocEntry;
			oAPLines.BaseType = 22;
			oAPLines.WTLiable = "tNO";
			oAPLines.VatGroup = "IVAT-EXC";
			oAPLines.UnitPrice = this.getView().byId("Doctotal").getValue();
			oAPLines.U_APP_RtnRowType = "C";
			oAPDown.DownPaymentPercentage = this.getView().byId("DPayment").getValue();

			oAPDown.DocumentLines.push(oAPLines);

			var settings = {
				"url": "https://18.136.35.41:50000/b1s/v1/PurchaseDownPayments",
				"method": "POST",
				"timeout": 0,
				"headers": {
					"Content-Type": "application/json"
				},
				"data": JSON.stringify(oAPDown),
			};

			$.ajax(settings).done(function (response) {
				if (response) {
					sap.m.MessageToast.show("Added Successfully");
				}
			});

			this.DeleteData();

		},

		oSetTransacationType: function (TransCode) {

			if (TransCode === "0") {
				this.getView().byId("TransType").setSelectedKey("0");
				this.getView().byId("TaxType").setSelectedKey("1");
				this.getView().byId("ProgBill").setEnabled(false);
				this.getView().byId("PBType").setEnabled(false);
				this.getView().byId("DPayment").setEnabled(true);
			} else if (TransCode === "3") {

				this.getView().byId("TransType").setSelectedKey("1");
				this.getView().byId("TaxType").setSelectedKey("");
				this.getView().byId("PBType").setSelectedKey("1");
				this.getView().byId("RentAmount").setEnabled(false);
				this.getView().byId("DPayment").setEnabled(false);
				this.getView().byId("Doctotal").setEnabled(false);

			} else if (TransCode === "4") {

				this.getView().byId("TransType").setSelectedKey("1");
				this.getView().byId("TaxType").setSelectedKey("");
				this.getView().byId("PBType").setSelectedKey("2");
				this.getView().byId("RentAmount").setEnabled(false);
				this.getView().byId("DPayment").setEnabled(false);
				this.getView().byId("Doctotal").setEnabled(false);

			} else {
				this.getView().byId("TransType").setSelectedKey("1");
				this.getView().byId("TaxType").setSelectedKey("");
				this.getView().byId("RentAmount").setEnabled(false);
				this.getView().byId("DPayment").setEnabled(false);
				this.getView().byId("Doctotal").setEnabled(false);
			}

		},

		oGetTransactionNumber: function () {

			// Viewing Transaction Number
			this.oTransID = new JSONModel();
			$.ajax({
				url: "https://18.136.35.41:4300/appxsjs/ExecQuery.xsjs?dbName=SBODEMOAU_SL&procName=spAppRetention&queryTag=getTransCount&value1=&value2=&value3=&value4=",
				type: "GET",
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					MessageToast.show(error);
				},
				success: function (json) {},
				context: this
			}).done(function (results) {
				if (results) {
					this.oTransID.setJSON("{\"count\" : " + JSON.stringify(results).replace("[", "").replace("]", "") + "}");
					this.getView().setModel(this.oTransID, "oTransID");
				}
			});

		},

		eNableAllFields: function (oCode) {

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
				this.getView().byId("btn1").setEnabled(false);
				this.getView().byId("btn2").setEnabled(false);

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
				this.getView().byId("PBType").setEnabled(true);
				this.getView().byId("CWIP").setEnabled(true);
				this.getView().byId("fileUploader").setEnabled(true);
				this.getView().byId("TextArea").setEnabled(true);
				this.getView().byId("btn1").setEnabled(true);
				this.getView().byId("btn2").setEnabled(true);

			}
		},

		oGetRetentionProcess: function (sCode) {
			this.oModelOpenPO = new JSONModel();

			$.ajax({
				url: "https://18.136.35.41:4300/appxsjs/ExecQuery.xsjs?dbName=SBODEMOAU_SL&procName=spAppRetention&queryTag=getPOTransaction&value1=" +
					sCode + "&value2=&value3=&value4=",
				type: "GET",
				async: false,
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					// MessageToast.show(error);
				},
				success: function (json) {},
				context: this
			}).done(function (results) {
				if (results.length === 0) {
					MessageToast.show("No Retention Row to process");
					//resetting of POFields.json model
					this.DeleteData();
				} else {
					this.oModelPurchase.setJSON("{\"POFields\" : " + JSON.stringify(results).replace("[", "").replace("]", "") + "}");
					this.getView().setModel(this.oModelPurchase, "oModelPurchase");
				}
			});
		},

		oGetAllPOTransaction: function () {

			// Viewing Open Purchase Order Transaction
			this.oModelOpenPO = new JSONModel();
			$.ajax({
				url: "https://18.136.35.41:4300/appxsjs/ExecQuery.xsjs?dbName=SBODEMOAU_SL&procName=spAppRetention&queryTag=getAllUnprocessedPO&value1=Y&value2=&value3=&value4=",
				type: "GET",
				crossDomain:true,
				dataType:"json",
				headers : {
					"Access-Control-Allow-Origin" : "*"
				},
				beforeSend: function(xhr) {
					xhr.setRequestHeader("Authorization", "Basic " + btoa("asd:ads"));
				},
				xhrFields: {
					withCredentials: true
				},
				
				error: function (xhr, status, error) {
					MessageToast.show(error);
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

		onSelectPurchaseTransaction: function () {

			var PoStatus = this.getView().byId("selectRecordGroup").getSelectedKey();

			if (PoStatus === "0") {
				this.eNableAllFields("1");
				this.oFilterPurchaseOrderTransaction("getAllUnprocessedPO");
			} else if (PoStatus === "1") {
				this.eNableAllFields("0");
				this.oFilterPurchaseOrderTransaction("getDPwthOP");
			} else if (PoStatus === "2") {
				this.eNableAllFields("0");
				this.oFilterPurchaseOrderTransaction("getPOwithAPDP");
			} else if (PoStatus === "3") {
				this.eNableAllFields("1");
				this.oFilterPurchaseOrderTransaction("getFirstBilling");
			} else if (PoStatus === "4") {
				this.eNableAllFields("1");
				this.oFilterPurchaseOrderTransaction("getSubsequentBilling");
			}

		},

		onSelectionWTX: function () {

			var TaxType = this.getView().byId("TaxType").getSelectedKey();

			if (TaxType === "0") {

				var oProgType = this.getView().byId("PBType").getSelectedKey();

				if (oProgType === "1") {

					var oGrossDP = this.DTRetention.getData().DetailesRetention[0].CWIP;
					var oWTHTaxRate = this.oModelPurchase.getData().POFields.Rate;
					var GrossCount = oWTHTaxRate / 100;
					var aTotalWTX = oGrossDP / 1.12;
					var oWtx = aTotalWTX * GrossCount;

					var ooTotal4 = oWtx.toFixed(2);

					this.DTRetention.getData().DetailesRetention[0].WTX = ooTotal4;
					this.DTRetention.refresh();

				} else if (oProgType === "2") {

					var oGrossDP = this.DTRetention.getData().DetailesRetention[0].CWIP;
					var oWTHTaxRate = this.oModelPurchase.getData().POFields.Rate;
					var GrossCount = oWTHTaxRate / 100;
					var aTotalWTX = oGrossDP / 1.12;
					var oWtx = aTotalWTX * GrossCount;

					var ooTotal4 = oWtx.toFixed(2);

					this.DTRetention.getData().DetailesRetention[0].WTX = ooTotal4;
					this.DTRetention.refresh();

					this.ProgressBillingType();

				} else if (oProgType === "3") {

				}

			} else {
				this.DTRetention.getData().DetailesRetention[0].WTX = "0";
				this.DTRetention.refresh();
			}

		},

		ProgressBIll: function () {

			// COMPUTATION FOR GROSS AMOUNT
			var ProgressBill = this.oModelPurchase.getData().POFields.DocTotal;
			var oProgresBill = this.getView().byId("ProgBill").getValue();
			var oCount = oProgresBill / 100;
			var oToTal = ProgressBill * oCount;
			var oTotal4 = oToTal.toFixed(2);
			this.DTRetention.getData().DetailesRetention[0].GrossAmount = oTotal4;
			this.DTRetention.refresh();

			// COMPUTATION FOR PRORATED DOWN PAYMENT
			var oDocEntry = "";
			oDocEntry = this.oModelPurchase.getData().POFields.DocEntry;
			if (oDocEntry === "") {
				oDocEntry = this.oModelUDT.getData().UDTFields.U_App_DocEntry;
			}
			this.oAPDocTotal = new JSONModel();
			$.ajax({
				url: "https://18.136.35.41:4300/appxsjs/ExecQuery.xsjs?dbName=SBODEMOAU_SL&procName=spAppRetention&queryTag=getAPDoctotal&value1=" +
					oDocEntry +
					"&value2=&value3=&value4=",
				type: "GET",
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					MessageToast.show(xhr.responseText);
				},
				success: function (json) {},
				context: this
			}).done(function (results) {
				if (results) {
					this.oAPDocTotal.setJSON("{\"doctotal\" : " + JSON.stringify(results) + "}");
					this.getView().setModel(this.oAPDocTotal, "oAPDocTotal");

					var oDocTotal = this.oAPDocTotal.getData().doctotal[0].DocTotal;
					var ProgresBill = this.getView().byId("ProgBill").getValue();
					var oPercent = ProgresBill / 100;
					var oProratedDP = oDocTotal * oPercent;
					var oTotals = oProratedDP.toFixed(2);
					this.DTRetention.getData().DetailesRetention[0].ProratedDP = oTotals;
					this.DTRetention.refresh();

					// PRORATED RETENTION COMPUTATION
					var RetentionAmount = this.oModelPurchase.getData().POFields.Price;
					var PoProgresBill = this.getView().byId("ProgBill").getValue();
					var ProgPercent = PoProgresBill / 100;
					var ProTotal = RetentionAmount * ProgPercent;
					var oProrated = ProTotal.toFixed(2);

					this.DTRetention.getData().DetailesRetention[0].ProratedRetention = oProrated;
					this.DTRetention.refresh();

					// FRO CWIP COMPUTATOIN
					var ProgType = this.getView().byId("PBType").getSelectedKey();

					if (ProgType === "1") {
						this.ProgressBillingType();
						// WITH HOLDING TAX COMPUTAION
						this.onSelectionWTX();
					} else if (ProgType === "2") {
						this.ProgressBillingType();
						// WITH HOLDING TAX COMPUTAION
						this.onSelectionWTX();
					}

				}
			});

		},

		ProgressBillingType: function () {

			var ProgType = this.getView().byId("PBType").getSelectedKey();

			// First Progress Billing Computation
			if (ProgType === "1") {

				// COMPUTATION FOR CWIP
				var PODocTotal = this.oModelPurchase.getData().POFields.DocTotal;
				var ProgresBill = this.getView().byId("ProgBill").getValue();
				var ProDP = this.DTRetention.getData().DetailesRetention[0].ProratedDP;
				var ProReten = this.DTRetention.getData().DetailesRetention[0].ProratedRetention;
				// var Grossmount = this.DTRetention.getData().DetailesRetention[0].GrossAmount;
				var APDocTotal = this.oAPDocTotal.getData().doctotal[0].DocTotal;

				var oProgbillRate = ProgresBill / 100;
				var CWIP1 = PODocTotal * oProgbillRate;
				var oProrated = CWIP1.toFixed(2);
				var CWIP2 = oProrated - ProDP;
				var CWIP3 = CWIP2 - ProReten;
				var CWIP4 = Number([CWIP3]);
				var oAPDocTotal = Number([APDocTotal]);

				var TotalCWIP = CWIP4 + oAPDocTotal;

				this.DTRetention.getData().DetailesRetention[0].CWIP = TotalCWIP;
				this.DTRetention.refresh();

				// COMPUTATIO FOR NET PROGRESS BILLING AMOUNT

				var PBCWIP = this.DTRetention.getData().DetailesRetention[0].CWIP;
				var PBAPDocTotal = this.oAPDocTotal.getData().doctotal[0].DocTotal;
				var PBWTX = this.DTRetention.getData().DetailesRetention[0].WTX;

				var oPBCWIP = Number([PBCWIP]);
				var oPBAPDocTotal = Number([PBAPDocTotal]);

				var PBAmnt1 = oPBCWIP - oPBAPDocTotal;
				var oPBAmnt1 = Number([PBAmnt1]);

				var PBAmtn2 = oPBAmnt1 - PBWTX;

				this.DTRetention.getData().DetailesRetention[0].NetProgress = PBAmtn2;
				this.DTRetention.refresh();

			} else if (ProgType === "2") {

				// Computation for CWIP

				var sPODocTotal = this.oModelPurchase.getData().POFields.DocTotal;
				var sProgresBill = this.getView().byId("ProgBill").getValue();
				var sProDP = this.DTRetention.getData().DetailesRetention[0].ProratedDP;
				var sProReten = this.DTRetention.getData().DetailesRetention[0].ProratedRetention;

				var sProgbillRate = sProgresBill / 100;
				var sCWIP1 = sPODocTotal * sProgbillRate;
				var sProrated = sCWIP1.toFixed(2);
				var sCWIP2 = sProrated - sProDP;
				var sCWIP3 = sCWIP2 - sProReten;
				var sCWIPTotal = Number([sCWIP3]);

				this.DTRetention.getData().DetailesRetention[0].CWIP = sCWIPTotal;
				this.DTRetention.refresh();

				// Computation for Net Progress Billing Amount

				var sPBCWIP = this.DTRetention.getData().DetailesRetention[0].CWIP;
				var sPBWTX = this.DTRetention.getData().DetailesRetention[0].WTX;

				var sNetProg = sPBCWIP - sPBWTX;
				var sNetProgTotal = Number([sNetProg]);

				this.DTRetention.getData().DetailesRetention[0].NetProgress = sNetProgTotal;
				this.DTRetention.refresh();

			} else if (ProgType === "3") {
				sap.m.MessageToast.show("Final Billing");
			}

		},

		oFilterPurchaseOrderTransaction: function (queryTag) {

			this.oModelOpenPO = new JSONModel();
			$.ajax({
				url: "https://18.136.35.41:4300/appxsjs/ExecQuery.xsjs?dbName=SBODEMOAU_SL&procName=spAppRetention&queryTag=" + queryTag +
					"&value1=&value2=&value3=&value4=",
				type: "GET",
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					MessageToast.show(xhr.responseText);
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

		onRetentionAmount: function (oEvent) {

			var DPValue = this.getView().byId("DPayment").getValue();

			if (DPValue === "" || DPValue === "0") {

				this.DTRetention.getData().DetailesRetention[0].GrossAmount = "";
				this.DTRetention.refresh();

			} else {

				var Doctotal = this.DocTotalProcess;

				var DP = this.getView().byId("DPayment").getValue();

				var oDocTotal = DP / 100;

				var GrossTotal = Doctotal * oDocTotal;

				var oTotal = GrossTotal.toFixed(2);

				this.DTRetention.getData().DetailesRetention[0].GrossAmount = oTotal;
				this.DTRetention.refresh();

			}

		},

		DeleteData: function (oEvent) {

			this.getView().byId("TransNo").setValue("");
			this.getView().byId("VenSupCode").setValue("");
			this.getView().byId("DocNum").setValue("");
			this.getView().byId("DateFrom").setValue("");
			this.getView().byId("Name").setValue("");
			this.getView().byId("TransType").setValue("");
			this.getView().byId("TaxType").setValue("");
			this.getView().byId("RentAmount").setValue("");
			this.getView().byId("ProgBill").setValue("");
			this.getView().byId("DPayment").setValue("");
			this.getView().byId("ProgBill").setValue("");
			this.getView().byId("Doctotal").setValue("");
			this.getView().byId("PBType").setValue("");
			this.getView().byId("CWIP").setValue("");
			this.getView().byId("TextArea").setValue("");
			this.DTRetention.getData().DetailesRetention[0].CWIP = "";
			this.DTRetention.getData().DetailesRetention[0].WTX = "";
			this.DTRetention.getData().DetailesRetention[0].GrossAmount = "";
			this.DTRetention.getData().DetailesRetention[0].ProratedDP = "";
			this.DTRetention.getData().DetailesRetention[0].ProratedRetention = "";
			this.DTRetention.getData().DetailesRetention[0].NetProgress = "";

			this.DTRetention.refresh();

		},

		onSave: function () {

			var SupplierCode = this.getView().byId("VenSupCode").getValue();

			if (SupplierCode !== "") {

				var oPoStatus = this.getView().byId("selectRecordGroup").getSelectedKey();
				var CodeH = this.generateUDTCode("GetCode");
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
				oPurchase_Order.U_App_TransDate = this.getTodaysDate();
				oPurchase_Order.U_App_ProgBill = this.getView().byId("ProgBill").getValue();
				oPurchase_Order.U_App_TransType = this.getView().byId("TransType").getSelectedKey();
				oPurchase_Order.U_App_ProgBill_Type = this.getView().byId("TransType").getSelectedKey();
				oPurchase_Order.U_App_TaxType = this.getView().byId("TaxType").getSelectedKey();
				oPurchase_Order.U_App_Remarks = this.getView().byId("TextArea")._lastValue;
				oPurchase_Order.U_App_RentAmnt = this.oModelPurchase.getData().POFields.Price;

				if (oPoStatus === "0") {
					oPurchase_Order.U_App_DosStatus = "DP";
				} else if (oPoStatus === "3") {
					oPurchase_Order.U_App_DosStatus = "1stPB";
				} else if (oPoStatus === "4") {
					oPurchase_Order.U_App_DosStatus = "SubPB";
				}

				var DP = this.getView().byId("DPayment").getValue();

				if (DP === "") {
					oPurchase_Order.U_App_DwnPymnt = 0.0;
				} else {
					oPurchase_Order.U_App_DwnPymnt = this.getView().byId("DPayment").getValue();
				}

				var ProgBill = this.getView().byId("DPayment").getValue();

				if (ProgBill === "") {
					oPurchase_Order.U_App_ProgBill = 0.0;
				} else {
					oPurchase_Order.U_App_ProgBill = this.getView().byId("ProgBill").getValue();
				}

				oPurchase_Order.U_App_CreatedDate = this.getTodaysDate();
				oPurchase_Order.U_App_CreatedBy = this.getView().byId("Username").getValue();
				// oPurchase_Order.U_App_UpdatedDate = "2020-02-04";
				// oPurchase_Order.U_App_UpdatedBy = "jerome";
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
				// var oTable = this.getView().byId("tblDetails");
				// var myTableRows= oTable.getRows();
				// var selectedIndeices=oTable.getSelectedIndices();
				for (d = 0; d < this.DTRetention.getData().DetailesRetention.length; d++) {
					// for (i = 0; i < selectedIndeices.length; i++) {
					// row = selectedIndeices[i];
					// if (row === d) {
					var iLineNumDP = d + 1;
					//oT_PAYMENT_PROCESSING_D.O = "I";
					code = this.generateUDTCode("GetCode");
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
					oPurchase_Details.U_App_CreatedDate = this.getTodaysDate();
					oPurchase_Details.U_App_CreatedBy = "JOANA<3";
					oPurchase_Details.U_App_UpdatedDate = "";
					oPurchase_Details.U_App_UpdatedBy = "";
					oPurchase_Details.U_App_DocEntry = this.oModelPurchase.getData().POFields.DocEntry;
					oPurchase_Details.U_App_LineNum = iLineNumDP;

					batchArray.push(JSON.parse(JSON.stringify(({
						"tableName": "U_APP_RPT1",
						"data": oPurchase_Details //this.generateUDTCode();
					}))));

					this.DeleteData();

				}

				var sBodyRequest = this.prepareBatchRequestBody(batchArray);
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
					if (results) {
						sap.m.MessageToast.show("Save as Draft!");
					}
				});

			} else {
				sap.m.MessageToast.show("No Data to Post in SAP");
			}

			this.DeleteData();

		},

		getTodaysDate: function () {
			var today = new Date();
			var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
			return date;
		},

		prepareBatchRequestBody: function (oRequest) {

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

		generateUDTCode: function (docType) {

			var generatedCode = "";

			$.ajax({
				url: "https://18.136.35.41:4300/appxsjs/ExecQuery.xsjs?dbName=SBODEMOAU_SL&procName=SPAPP_GENERATENUMBER&DocType=" + docType,
				type: "GET",
				async: false,
				xhrFields: {
					withCredentials: true
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

		oFilterValue: function (oEvent) {
			
			this.oFilter.getData().GridFilter.DocNum = oEvent.mParameters.value;
			this.oFilter.getData().GridFilter.CardName = oEvent.mParameters.value;
			this.oFilter.refresh();

			var oDocNum = this.oFilter.getData().GridFilter.DocNum;
			var oCardName = this.oFilter.getData().GridFilter.CarName;
			var PoStatus = this.getView().byId("selectRecordGroup").getSelectedKey();
			
			// Filter For DocNum
			if (oDocNum !== "") {

				if (PoStatus === "0") {
					this.eNableAllFields("1");
					this.oGetFilterValues("oDownPaymentFilterDocNum",oDocNum);
				} else if (PoStatus === "1") {
					// this.eNableAllFields("0");
					// this.oGetFilterValues("oDownPaymentFilterCardName",filterStatus);
				} else if (PoStatus === "2") {
					// this.eNableAllFields("0");
					// this.oFilterPurchaseOrderTransaction("getPOwithAPDP");
				} else if (PoStatus === "3") {
					// this.eNableAllFields("1");
					// this.oFilterPurchaseOrderTransaction("getFirstBilling");
				} else if (PoStatus === "4") {
					// this.eNableAllFields("1");
					// this.oFilterPurchaseOrderTransaction("getSubsequentBilling");
				}
					
			} else if (oCardName !== ""){
		  		
		  		if (PoStatus === "0") {
					this.eNableAllFields("0");
					this.oGetFilterValues("oDownPaymentFilterCardName",oCardName);
				} else if (PoStatus === "1") {
					// this.eNableAllFields("0");
					// this.oGetFilterValues("oDownPaymentFilterCardName",filterStatus);
				} else if (PoStatus === "2") {
					// this.eNableAllFields("0");
					// this.oFilterPurchaseOrderTransaction("getPOwithAPDP");
				} else if (PoStatus === "3") {
					// this.eNableAllFields("1");
					// this.oFilterPurchaseOrderTransaction("getFirstBilling");
				} else if (PoStatus === "4") {
					// this.eNableAllFields("1");
					// this.oFilterPurchaseOrderTransaction("getSubsequentBilling");
				}
		  	
			}else {

				if (PoStatus === "0") {
					this.eNableAllFields("1");
					this.oFilterPurchaseOrderTransaction("getAllUnprocessedPO");
				} else if (PoStatus === "1") {
					// this.eNableAllFields("0");
					// this.oFilterPurchaseOrderTransaction("getDPwthOP");
				} else if (PoStatus === "2") {
					// this.eNableAllFields("0");
					// this.oFilterPurchaseOrderTransaction("getPOwithAPDP");
				} else if (PoStatus === "3") {
					// this.eNableAllFields("1");
					// this.oFilterPurchaseOrderTransaction("getFirstBilling");
				} else if (PoStatus === "4") {
					// this.eNableAllFields("1");
					// this.oFilterPurchaseOrderTransaction("getSubsequentBilling");
				}
					
			}
				
			// // Filter for CardName
			// var oCardName = this.oFilter.getData().GridFilter.DocNum;
			
			// if (oCardName !== "") {
				
			// 	if (PoStatus === "0") {
			// 		this.eNableAllFields("0");
			// 		this.oGetFilterValues("oDownPaymentFilterCardName",oCardName);
			// 	} else if (PoStatus === "1") {
			// 		// this.eNableAllFields("0");
			// 		// this.oGetFilterValues("oDownPaymentFilterCardName",filterStatus);
			// 	} else if (PoStatus === "2") {
			// 		// this.eNableAllFields("0");
			// 		// this.oFilterPurchaseOrderTransaction("getPOwithAPDP");
			// 	} else if (PoStatus === "3") {
			// 		// this.eNableAllFields("1");
			// 		// this.oFilterPurchaseOrderTransaction("getFirstBilling");
			// 	} else if (PoStatus === "4") {
			// 		// this.eNableAllFields("1");
			// 		// this.oFilterPurchaseOrderTransaction("getSubsequentBilling");
			// 	}
				
			// }else{
					
			// 	if (PoStatus === "0") {
			// 		this.eNableAllFields("1");
			// 		this.oFilterPurchaseOrderTransaction("getAllUnprocessedPO");
			// 	} else if (PoStatus === "1") {
			// 		// this.eNableAllFields("0");
			// 		// this.oFilterPurchaseOrderTransaction("getDPwthOP");
			// 	} else if (PoStatus === "2") {
			// 		// this.eNableAllFields("0");
			// 		// this.oFilterPurchaseOrderTransaction("getPOwithAPDP");
			// 	} else if (PoStatus === "3") {
			// 		// this.eNableAllFields("1");
			// 		// this.oFilterPurchaseOrderTransaction("getFirstBilling");
			// 	} else if (PoStatus === "4") {
			// 		// this.eNableAllFields("1");
			// 		// this.oFilterPurchaseOrderTransaction("getSubsequentBilling");
			// 	}
				
			// }
					

		},

		oGetFilterValues: function (queryTag,oValue) {

			this.oModelOpenPO = new JSONModel();
			$.ajax({
				url: "https://18.136.35.41:4300/appxsjs/ExecQuery.xsjs?dbName=SBODEMOAU_SL&procName=spAppRetention&queryTag=" + queryTag +
					"&value1="+ oValue +"&value2=&value3=&value4=",
				type: "GET",
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					MessageToast.show(xhr.responseText);
				},
				success: function (json) {},
				context: this
			}).done(function (results) {
				if (results) {
					this.oModelOpenPO.setJSON("{\"allbp\" : " + JSON.stringify(results) + "}");
					this.getView().setModel(this.oModelOpenPO, "oModelOpenPO");
				}
			});

		}


  });
});
