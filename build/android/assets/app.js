/* ***************************** *
 * ******** VARIABLES ********** *
 * ***************************** */

var menoDatabazy = "db7";

var osname = Ti.Platform.osname,
version = Ti.Platform.version,
height = Ti.Platform.displayCaps.platformHeight,
width = Ti.Platform.displayCaps.platformWidth,
apiLevel = Ti.Platform.Android.API_LEVEL,
isAndroid = Ti.Platform.osname === 'android';

var isOnline = Titanium.Network.getOnline();

var utilsModule = require('com.tokenbros.utils');

var html2as = require('nl.fokkezb.html2as');
var Window = require('ui/window');
var Button = require('ui/button');
var Map = require('ui/map');
var List = require('ui/list');
var Image = require('ui/image');
var ImageCropped = require('ui/imageCropped');
var DatePicker = require('ui/datepicker');
var Camera = require('ui/camera');
var Label = require('ui/label');
var TextField = require('ui/textfield');
var TextArea = require('ui/textarea');
var ScrollView = require('ui/scrollview');
var AlertInput = require('ui/alertinput');

var myDeviceId = Ti.App.Properties.getString('myDeviceId', Ti.Platform.getId() );
var myNickname = Ti.App.Properties.getString('myNickname', 'DEMO#0');
var currentZoomLevel = Ti.App.Properties.getString('currentZoomLevel', 3);
var currentCenter = Ti.App.Properties.getString('currentCenter', '[19.5, 48.7]');
var endpointURL = "http://bolegweb.geof.unizg.hr/geoserver/ows";
var featureTYPE;
var positionPoint;
var positionMultiPoint;
var databuttonRetrieveDatasets, databuttonRetrieveDatasetsLocal;
var featIdIn = 1;
var manualModEnabled = 0;
var currentGML;
var currentFeatIdIn;
var imageNativePath;
var termsOfUse;
var uid = '';
var iPS = '';
var iID = '';
var imageText = '';


var default_plnt_name = 'Governmental Service type not defined';

var obsColor, labelObservationsNew, observationsTop, labelObservationsNewBox, observationObjects, labelObservationsUpdated, labelObservationsUpdBox, labelObservationsRemoved, labelObservationsDelBox;
var observationsInitialOffset = 50;
var noDataTextNew = "No new data has been collected";
var noDataTextUpd = "No data has been marked for update";
var noDataTextRem = "No data has been marked for removal";
var labelObservationsNewText = "New observations";
var labelObservationsUpdText = "Updated observations";
var labelObservationsRemText = "Removed observations";

/* ***************************** *
 * ******** DATABASE SETUP ***** *
 * ***************************** */
var db = Ti.Database.open(menoDatabazy);
db.execute('CREATE TABLE IF NOT EXISTS annotations (' + 
'id INTEGER PRIMARY KEY,' + 
'lat DECIMAL (20,14) NOT NULL,' + 
'lon DECIMAL (20,14) NOT NULL,' + 
'acc DECIMAL (10,4),' + 
'alt DECIMAL (10,4),' + 
'ala DECIMAL (10,4),' + 
'type varchar(255),' + 
'gmlID varchar(255),' +
'codeSpace varchar(255),' +
'uid varchar(255),' + 
'featureType varchar(255),' + 
'endpointURL varchar(255),' + 
'imageDeviceId varchar(255) default \'\',' +
'imagePathLocal varchar(255) default \'\',' + 
'imagePathServer varchar(255) default \'\',' +
'serviceType varchar(255),' +
'serviceName varchar(255),' +
'serviceAddress varchar(255) default \'\',' +
'image varchar(255) default \'\',' + 
'imageText varchar(255) default \'\',' +
'obs_date varchar(255),' + 
'mark_for_push integer(1) default 0,' + 
'mark_for_del integer(1) default 0' + 
');    ');
db.execute('CREATE TABLE IF NOT EXISTS featureTypes (' + 'featureType varchar(255),' + 'endpointURL varchar(255)' + ');    ');
var select = db.execute('SELECT * from annotations ORDER BY id DESC LIMIT 1');
while (select.isValidRow()) { featIdIn = 1 + select.fieldByName('id'); select.next(); };

db.close();

/* ***************************** *
 * ******** MAIN APPLICATION *** *
 * ***************************** */
var toRefreshMainWindow=0;
var MainWindow = new Window("mobileWFS", true);
MainWindow.open();

var MapWindow = new Window("Map");
var MapWindowOpen = false;
var zoomTo = {
	lat : 10,
	lon : 10
};

// webview MAP
var webView = Ti.UI.createWebView({ 
		left : 0,
		top : 0,
		right : 0,
		bottom : 0,
		width : '100%',
		height : '100%',
		borderRadius : 15,
		enableZoomControls : false, // Android only
		url : '/HTML/openlayers/index.html',
		setWebContentsDebuggingEnabled : true
	});
	//webView.setLayerType(Ti.Android.R.LAYER_TYPE_SOFTWARE, null);

// scroll view
var MainWindowScrollTopLast = 0;
var MainWindowScrollView = new ScrollView();
MainWindow.add(MainWindowScrollView);

// push view
var pushView = Ti.UI.createView({
    width : '90%',
    height : 60,
    left : '5%',
    top : observationsTop,
    backgroundColor : 'red',
    top: -1000
});
MainWindowScrollView.add(pushView);

// webview icon for INSERT mode
/*
var insertIconImageView = new Image("/images/drawable-xxhdpi/ic_mode_edit_black_48dp.png");
insertIconImageView.bottom = '10dp';
insertIconImageView.left = '10dp';
insertIconImageView.width = '50dp';
insertIconImageView.height = '50dp';
*/
var insertIconImageView = new Label("Manual insert mode active - touch map to insert marker");
insertIconImageView.bottom=0;
insertIconImageView.left=0;
insertIconImageView.right=0;
insertIconImageView.height=25;
insertIconImageView.backgroundColor='#5B6F55';
insertIconImageView.color='white';
insertIconImageView.textAlign = Ti.UI.TEXT_ALIGNMENT_CENTER;
insertIconImageView.font={ fontSize: 12, fontWeight: 'bold'};

var mapDownloadEnabled=false;
var mapDownloadOverlay=null;


// WELCOME TEXT
html2as( 
	'<font size="25" face="Arial">Welcome to the\n<b>mobileWFS</b> App</font>',
	function (err, as) { 
    	if (err) {
    		console.error(err);
    
    	} else {
    
    		var labelWelcomeText = new Label();
    		labelWelcomeText.attributedString = as;
    		labelWelcomeText.top = 20;
    		labelWelcomeText.textAlign = Ti.UI.TEXT_ALIGNMENT_CENTER;
    		labelWelcomeText.font = {
    			fontSize : 22
    		};
    		labelWelcomeText.width = '75%';
    		labelWelcomeText.height = 65;
    		MainWindowScrollView.add(labelWelcomeText);
    
    	}
    }
);
 

// USER LABEL
var labelUser = new Label("User: " + myNickname);
labelUser.top = 90;
labelUser.textAlign = Ti.UI.TEXT_ALIGNMENT_CENTER;
labelUser.font = { fontSize : 20 };

MainWindowScrollView.add(labelUser);

// USER BUTTON
var buttonUser = new Button("Change user", buttonUserClick);
buttonUser.top = 140;
MainWindowScrollView.add(buttonUser);

// WFS SERVER LABEL
var labelServerWFS = new Label ("WFS Server Endpoint");
//labelServer.top = 190;
observationsTop = 150 + observationsInitialOffset;
labelServerWFS.top = observationsTop; 
labelServerWFS.font = {
    fontSize : 24
    };
MainWindowScrollView.add(labelServerWFS);

var labelServer = new Label (endpointURL);
//labelServer.top = 190;
observationsTop = 190 + observationsInitialOffset;
labelServer.top = observationsTop; 
//labelServer.width = '80%';
labelServer.font = {
    fontSize : 14,
    fontWeight : 'bold'
    };
MainWindowScrollView.add(labelServer);



// TERMS WINDOW
var TermsWindow = new Window('Terms of use for data');

var progressIndicator = Ti.UI.Android.createProgressIndicator({
  message: 'In progress...',
  location: Ti.UI.Android.PROGRESS_INDICATOR_DIALOG,
  type: Ti.UI.Android.PROGRESS_INDICATOR_DETERMINANT,
  cancelable: false,
  min: 0,
  max: 100
});
// activity indicator should be last
var activityIndicator = Ti.UI.Android.createProgressIndicator({
  message: 'Please wait...',
  location: Ti.UI.Android.PROGRESS_INDICATOR_DIALOG,
  type: Ti.UI.Android.PROGRESS_INDICATOR_INDETERMINANT,
  cancelable: false
});
MainWindow.add(activityIndicator);


/* ***************************** *
 * ******** EVENT LISTENERS **** *
 * ***************************** */
readdEventListener(MainWindow, "open", eventListenerMainWindow);
readdEventListener(MainWindowScrollView, 'scroll', eventListenerMainWindowScrollViewScrollDo);
readdEventListener(MapWindow, "open", eventListenerMapWindow);
readdEventListener(MapWindow, "close", eventListenerSetMapWindowOpenFalse);
readdEventListener(Ti.App, 'app:fromWebView', eventListenerFromWebView);
readdEventListener(Ti.App, 'app:fromWebView2', eventListenerFromWebView2);
readdEventListener(Ti.App, 'app:fromWebView3', eventListenerFromWebView3);
readdEventListener(Ti.App, 'app:fromWebView4', eventListenerFromWebView4);
readdEventListener(Ti.App, 'app:fromWebViewTileLoaded', eventListenerFromWebViewTileLoaded);
readdEventListener(TermsWindow, 'open', eventListenerTermsWindowOpen);
readdEventListener(webView, "load", eventListenerwebViewLoad);
readdEventListener(Titanium.Geolocation, "location", eventListenerTiGeolocation);


function eventListenerTiGeolocation(e)
{
    if (e.error)
    {
        // manage the error
        divider(e.error);
        return;
    }
    divider("eventListenerTiGeolocation");
    //console.log(e);
    
    var longitude = e.coords.longitude;
    var latitude = e.coords.latitude;
    var altitude = e.coords.altitude;
    var heading = e.coords.heading;
    var accuracy = e.coords.accuracy;
    var speed = e.coords.speed;
    var timestamp = e.coords.timestamp;
    var altitudeAccuracy = e.coords.altitudeAccuracy;
    //alert('LON: ' + longitude + '\nLAT: ' + latitude + '\nALT: ' + altitude + '\nHEAD: ' + heading + '\nACC: ' + accuracy + '\nSPEED: ' + speed + '\nTIME: ' + timestamp + '\nALA: ' + altitudeAccuracy );
  }

/* ***************************** *
 * ******** HELPER FUNC ******** *
 * ***************************** */

function usleep(microseconds) {
	// Delay for a given number of micro seconds
	//

	// version: 902.122
	// discuss at: http://phpjs.org/functions/usleep
	// // +   original by: Brett Zamir
	// %        note 1: For study purposes. Current implementation could lock up the user's browser.
	// %        note 1: Consider using setTimeout() instead.
	// %        note 2: Note that this function's argument, contrary to the PHP name, does not
	// %        note 2: start being significant until 1,000 microseconds (1 millisecond)
	// *     example 1: usleep(2000000); // delays for 2 seconds
	// *     returns 1: true
	var start = new Date().getTime();
	while (new Date() < (start + microseconds / 1000));
	return true;
}

function formatString(str, arr) {
	return str.replace(/%(\d+)/g, function (_, m) {
		return arr[--m];
	});
}

function getElementById(w, id) {

	var chi = w.templates.template.childTemplates[1].tiProxy.children;
	for (var x in chi) {
		//Ti.api.info('Number of children: ' + chi.length);
		//Ti.api.info(chi[x].id);
		if (chi[x].id == id) {
			return chi[x];
		}
	}

	Ti.API.warn('No children, its single: ');
	//console.log(JSON.stringify(w));
	return null;
}

function dateTime(getSeconds, ts) {
	if (ts === undefined) {
		var currentTime = new Date();
	} else {
		var currentTime = new Date(ts);
	}
	var hours = currentTime.getHours();
	var minutes = currentTime.getMinutes();
	var seconds = currentTime.getSeconds();
	var month = currentTime.getMonth() + 1;
	var day = currentTime.getDate();
	var year = currentTime.getFullYear();

	if (month < 10) {
		month = "0" + month;
	}
	if (day < 10) {
		day = "0" + day;
	}
	if (hours < 10) {
		hours = "0" + hours;
	}
	if (minutes < 10) {
		minutes = "0" + minutes;
	}
	if (seconds < 10) {
		seconds = "0" + seconds;
	}

	var ret = year + "-" + month + "-" + day + " " + hours + ":" + minutes;
	if (getSeconds !== undefined) {
		ret += ":" + seconds;
	}

	return ret;
};

function divider(txt) {
    if(txt === undefined){ txt="######################"; }
    else{ txt = " " + txt + " "; }

	Ti.API.warn("#");
	Ti.API.warn("## " + dateTime(true) + " #################################"+txt+"##");
	Ti.API.warn("#");

}

function clearObservationsFromMainWindow() {
	var mc = MainWindowScrollView.children;
	var mcl = mc.length;
	var obsf = false;

	divider();
	for (i = 0; i < mcl; i++) {
		if (mc[i].html == labelObservationsNewText) {
			obsf = true;
		}
		if (obsf) {
			MainWindowScrollView.remove(mc[i]);
		}
	}
}

function drawObservationsToMainWindow() {
	// ///////////////// //
	//  NEW OBSERVATIONS
	obsColor = "#00A20B";
	labelObservationsNew = new Label(labelObservationsNewText);
	observationsTop = 280 + observationsInitialOffset;
	labelObservationsNew.top = observationsTop;	
    labelObservationsNew.width = '80%';
    labelObservationsNew.left = '15%';
	//labelObservationsNew.backgroundColor= 'yellow';	
	labelObservationsNew.textAlign = Ti.UI.TEXT_ALIGNMENT_LEFT;
	labelObservationsNew.font = {
		fontSize : 24
	};
	MainWindowScrollView.add(labelObservationsNew);

	labelObservationsNewBox = new Label();
	labelObservationsNewBox.top = observationsTop + 16;
	labelObservationsNewBox.left = '5%';
	labelObservationsNewBox.width = 24;
	labelObservationsNewBox.height = 24;
	labelObservationsNewBox.color = obsColor;
	labelObservationsNewBox.borderRadius = 5;
	labelObservationsNewBox.backgroundColor = obsColor;
	MainWindowScrollView.add(labelObservationsNewBox);

	observationObjects = [];

	// prve posunutie o 60px
	observationsTop = observationsTop + 55;

	// observacie z DB
	var myNicknameText = myNickname.split("#");
        myNicknameText = myNicknameText[0];
	var db = Ti.Database.open(menoDatabazy);
	var select = db.execute('SELECT * from annotations WHERE gmlID=0 AND uid=\''+myNicknameText+'\' ORDER BY id DESC');

	var noDataText = noDataTextNew;
	selectedObservationsToBoxes(select, noDataText, "new");
    db.close();
    
	// ////////////////////// //
	//  UPDATED OBSERVATIONS
	obsColor = "#FFD600";
	labelObservationsUpdated = new Label(labelObservationsUpdText);
	labelObservationsUpdated.top = observationsTop;
	labelObservationsUpdated.left = '15%';
	labelObservationsUpdated.width = '80%';
    //labelObservationsUpdated.backgroundColor= 'yellow'; 
	labelObservationsUpdated.textAlign = Ti.UI.TEXT_ALIGNMENT_LEFT;
	labelObservationsUpdated.font = {
		fontSize : 24
	};
	MainWindowScrollView.add(labelObservationsUpdated);

	labelObservationsUpdBox = new Label();
	labelObservationsUpdBox.top = observationsTop + 16;
	labelObservationsUpdBox.left = '5%';
	labelObservationsUpdBox.width = 24;
	labelObservationsUpdBox.height = 24;
	labelObservationsUpdBox.color = obsColor;
    labelObservationsUpdBox.borderRadius = 5;
	labelObservationsUpdBox.backgroundColor = obsColor;
	MainWindowScrollView.add(labelObservationsUpdBox);

	observationsTop = observationsTop + 55;

	// observacie z DB
	var db = Ti.Database.open(menoDatabazy);
	var select = db.execute('SELECT * from annotations WHERE mark_for_push=1 AND uid=\''+myNicknameText+'\' ORDER BY id DESC');

	var noDataText = noDataTextUpd;
	selectedObservationsToBoxes(select, noDataText, "upd");
    db.close();
    
	// ////////////////////// //
	//  REMOVED OBSERVATIONS
	obsColor = "#FF0000";
	labelObservationsRemoved = new Label(labelObservationsRemText);
	labelObservationsRemoved.top = observationsTop;
    labelObservationsRemoved.left = '15%';
    labelObservationsRemoved.width = '80%';
    //labelObservationsRemoved.backgroundColor= 'yellow'; 
	labelObservationsRemoved.textAlign = Ti.UI.TEXT_ALIGNMENT_LEFT;
	labelObservationsRemoved.font = {
		fontSize : 24
	};
	MainWindowScrollView.add(labelObservationsRemoved);

	labelObservationsDelBox = new Label();
	labelObservationsDelBox.top = observationsTop + 16;
	labelObservationsDelBox.left = '5%';
	labelObservationsDelBox.width = 24;
	labelObservationsDelBox.height = 24;
	labelObservationsDelBox.color = obsColor;
    labelObservationsDelBox.borderRadius = 5;
	labelObservationsDelBox.backgroundColor = obsColor;
	MainWindowScrollView.add(labelObservationsDelBox);

	observationsTop = observationsTop + 55;

	// observacie z DB
	var db = Ti.Database.open(menoDatabazy);
	var select = db.execute('SELECT * from annotations WHERE mark_for_del=1 AND uid=\''+myNicknameText+'\' ORDER BY id DESC');

	var noDataText = noDataTextRem;
	selectedObservationsToBoxes(select, noDataText, "del");
	db.close();
}

function redrawObservations() {
	clearObservationsFromMainWindow();
	// draw observations to main window
	var myNicknameText = myNickname.split("#");
        myNicknameText = myNicknameText[0];
    var db = Ti.Database.open(menoDatabazy);
    var select = db.execute('SELECT * from annotations WHERE uid=\''+myNicknameText+'\' AND (gmlID=0 OR mark_for_push=1 OR mark_for_del=1) ');
    db.close();
    
    if( select.rowCount )
    {
        drawPushWindow();
    }
	drawObservationsToMainWindow();
	MainWindowScrollView.scrollTo(0, MainWindowScrollTopLast);
	activityIndicator.hide();
}

function redrawObservationsToMainWindow() {
	redrawObservations();

}

function pushOneImage(){
    divider("pushOneImage - START OF FUNCTION ");
    var myNicknameText = myNickname.split("#");
        myNicknameText = myNicknameText[0];
    var db = Ti.Database.open(menoDatabazy);
    var s1='SELECT * from annotations WHERE uid=\''+myNicknameText+'\' AND imageDeviceId=\''+myDeviceId+'\' AND imagePathLocal!=\'\' AND imagePathLocal!=\'null\' AND (imagePathServer=\'\' OR imagePathServer=\'null\') LIMIT 1';
    var s2='SELECT * from annotations WHERE uid=\''+myNicknameText+'\' AND imageDeviceId=\''+myDeviceId+'\' AND imagePathLocal!=\'\' AND imagePathLocal!=\'null\' AND (imagePathServer=\'\' OR imagePathServer=\'null\')';
    var select = db.execute(s1);
    var select_all = db.execute(s2);
    db.close();
    
    //divider(s1); divider(s2);
    
    divider(select.rowCount); // to je asi nula druhy raz
    divider(select_all.rowCount);
    
    if(select.rowCount)
    {
        toRefreshMainWindow++; // reason for resfresh...
        
        // sem sa nedostaneme druhy raz, to znamena ze ten select hore uz nenajde nist
        divider("pushOneImage - if(select.rowCount) is TRUE - starting to push image");
        
        var url = 'http://bolegweb.geof.unizg.hr/mobileWFS/api/push_photo.php';
        var myFilename = dateTime(true).replace(/\s+/g, '_').replace(/:/g, '-'); 
        var myImage = Ti.Filesystem.getFile( select.fieldByName('imagePathLocal') );
        var myImageBlob = myImage.read();
        var boundary = '---------------------------170062046428149';
        var preSendStream = true;
        
        progressIndicator.value = 0;
        progressIndicator.message= 'Uploading '+select_all.rowCount+' images';
        if(select_all.rowCount==1){
            progressIndicator.message= 'Uploading 1 image';
        }
        progressIndicator.show();
        
        var xhr = Titanium.Network.createHTTPClient();
        
        var oldValue = "";
        xhr.onsendstream = function(e) {
            preSendStream = false;
            progressIndicator.value = Math.ceil( e.progress*100 );
            if(oldValue != progressIndicator.value)
            {
                oldValue = progressIndicator.value;
                //Ti.api.info('ONSENDSTREAM - PROGRESS: ' + Math.ceil( e.progress*100 ) + '%');
            }
            
        };
        xhr.onreadystatechange = function (e) {
            divider("XHR onreadystatechange");
            if (xhr.readyState == 4) {
                
                divider("XHR onreadystatechange xhr.readyState == 4");
                if (xhr.status == 200) {
                    divider("XHR onreadystatechange xhr.readyState == 4 xhr.status == 200");
                    
                    progressIndicator.hide();
                    var db = Ti.Database.open(menoDatabazy);
                    var myNicknameText = myNickname.split("#");
                    myNicknameText = myNicknameText[0];
                    
                    // toto maze iba jednu takze to musi dojebat update cast kera zmaze vac ako jednu
                    // lenze update cast nic nemaze
                    db.execute('DELETE FROM annotations WHERE id='+select.fieldByName('id'));
                    db.close();
                    
                    divider('DELETE FROM annotations WHERE id='+select.fieldByName('id'));
                    
                    if(select_all.rowCount == 1){ 
                        
                        Ti.UI.createAlertDialog({
                              title:'Upload was done',
                              message:"You need to re-download server data to see your changes"
                        }).show();
                        
                        
                        if(toRefreshMainWindow == 1)
                        {
                          toRefreshMainWindow=0;
                            
                          redrawObservations();
                          pushRemoveIfNeeded();  
                        }
                        if(toRefreshMainWindow > 1)
                        {
                            toRefreshMainWindow--;
                        }
                        
                    }
                    xhr.onreadystatechange = null;
                    
                    //console.log(e.source.responseData.text);
                    
                    divider("ROW 3140 - triggering another photo.......");
                    pushOneImage();
                    
                }
            }
        };
        xhr.onload = function(e) {
            divider("XHR ONLOAD 579 - preSendStream");
            if(!preSendStream)
            {
                divider("XHR ONLOAD 582");
            }
            
        };
        xhr.onerror = function(e){
            //console.log(e);
            alert(e.message);
            
          };
          
        xhr.open('POST',url);
        xhr.send({
            fileContent: myImageBlob, /* blob image */
            myNickname:myNicknameText,  
            myFilename:myFilename,
            nativePath:select.fieldByName('imagePathLocal'),
            
          });
        
        
    }
    
    
}


function clickedOnUnchecked(){
    MainWindowScrollView.remove(iconRadioUnchecked);
    MainWindowScrollView.add(iconRadioChecked);
    termsOfUse = 1;
    
}

function clickedOnChecked(){
    MainWindowScrollView.remove(iconRadioChecked);
    MainWindowScrollView.add(iconRadioUnchecked);
    termsOfUse = 0;
}

/* ***************************** *
 * ******** BUTTON CLICKS ****** *
 * ***************************** */

function buttonUserClick() {
	new AlertInput("Enter your nickname#pin or enter nickname only to create new user account: ", myNickname, function (e) {
		if (e.index == 0) {
			// OK clicked, try to login
			changeUser(e.source.androidView.value);
		}

	});
}

function buttonServerClick() {

	new AlertInput("You can set server URL here: ", endpointURL, function (e) {

		if (e.index == 0) {
			// OK clicked, try to login
			if (e.source.androidView.value == '')
			{
			    alert ('No Value Provided');
			}
			else{
			    changeServer(e.source.androidView.value);    
			}
			
		}

	});

}
//var databuttonRetrieveDatasets = [];
function buttonRetrieveDatasetsFunc() {
	isOnline = Titanium.Network.getOnline();

	if (isOnline) {
		var url = endpointURL + '?service=WFS&version=2.0.0&request=GetCapabilities';
		var xhr = Ti.Network.createHTTPClient();
		try {

			xhr.onload = function () {
				var doc = this.responseXML.documentElement;
				var items = doc.getElementsByTagName("FeatureType");
				databuttonRetrieveDatasets = [];
				var db = Ti.Database.open(menoDatabazy);
				db.execute("DELETE FROM featureTypes WHERE endpointURL='" + endpointURL + "' ");

				for (var i = 0; i < items.length; i++) {
					var featureType = items.item(i).getElementsByTagName("Name").item(0).textContent;
					databuttonRetrieveDatasets[i] = featureType;
					db.execute("INSERT INTO featureTypes (endpointURL, featureType) VALUES ('" + endpointURL + "', '" + featureType + "')");
				}

				buttonSelectDataset();
				db.close();
			};

			xhr.onerror = function (e) {
				// should do something more robust
				alert('Whoops...something is wrong check URL you entered. Error details: ' + e.error);
			};

			xhr.open('GET', url);
			xhr.send();
		} catch (e) {
			alert(e);
		}

	} else {
		// OFFLINE MODE - FROM LOCAL DB
		// alert("You are in offline mode, load data from local database...");
		databuttonRetrieveDatasetsLocal = [];
		//buttonLocalDataFunc();

		var db = Ti.Database.open(menoDatabazy);
		var select = db.execute("SELECT * from featureTypes WHERE endpointURL='" + endpointURL + "' ORDER BY featureType");
		db.close();
		//Ti.api.info('GEO APP: Loading endpointURLs from local db');
		var i = 0;
		while (select.isValidRow()) {
			databuttonRetrieveDatasetsLocal[i] = select.fieldByName('featureType');
			select.next();
			i++;
		}

		buttonSelectDataset();

	};

};

function buttonSelectDataset() {

	var optionsDialogOpts = {
		destructive : 1,
		cancel : 2,
		title : 'Choose feature type:'
	};

	if (isAndroid) {
		optionsDialogOpts.selectedIndex = 0;
	}

	var dialog = Titanium.UI.createOptionDialog(optionsDialogOpts);

	dialog.title = 'Select dataset:';

	isOnline = Titanium.Network.getOnline();
	if (isOnline) {
		// tu naplname dataList - ONLINE
		dialog.options = databuttonRetrieveDatasets;
		dialog.destructive = 0;
		dialog.cancel = 3;
		if (isAndroid) {
			dialog.androidView = null;
			dialog.buttonNames = ['Cancel'];
		}
		dialog.show();
	} else {
		// tu naplname dataList - OFFLINE
		if (databuttonRetrieveDatasetsLocal.length < 1) {
			alert("No local data found! No internet connection found! Cannot load data...");

		} else {

			dialog.options = databuttonRetrieveDatasetsLocal;
			//alert("Use the local data!");
			dialog.destructive = 0;
			dialog.cancel = 3;
			if (isAndroid) {
				dialog.androidView = null;
				dialog.buttonNames = ['Cancel'];
			}

			dialog.show();
		}
	}

	// add event listener
	readdEventListener(dialog, 'click', function (e) {
		// CLICK ON THE SELECTED FEATURE TYPE
		if (e.button) {
			// label.text = ' button';
			activityIndicator.hide();
		} else {
			//$.buttonAddToMap.show();
			isOnline = Titanium.Network.getOnline();
			if (isOnline) {
				featureTYPE = databuttonRetrieveDatasets[e.index];
			} else {

				featureTYPE = databuttonRetrieveDatasetsLocal[e.index];
				Ti.api.info(featureTYPE);
			}

			buttonAddToMapFunc();
		}

	});
};

function buttonAddToMapFunc() {
	//var selectedIndex = evt.source.selectedIndex;
	var data = [];
	//var url = endpointURL + '?service=WFS&version=2.0.0&request=GetFeature&typeName=' + featureTYPE + '&srsName=EPSG:4326&outputFormat=application/json';
	var featureTYPETitle = featureTYPE.split(":");
    featureTYPETitle = featureTYPETitle[1];
	var url = 'http://bolegweb.geof.unizg.hr/mobileWFS/api/index.php?featureTypeName=' + featureTYPE;
	console.log(url);
	isOnline = Titanium.Network.getOnline();
	if (isOnline) {
		var xhr = Ti.Network.createHTTPClient();
		try {

			xhr.onreadystatechange = function () {

				if (xhr.readyState == 4) {
					if (xhr.status == 200) {
						var res = xhr.responseText;
						console.log(res);
						try {

							var obj = JSON.parse(res);
							console.log(obj);

						} catch (e) {

							alert('COULD NOT PARSE THE JSON: NO VALID JSON?');

						}

						pocet = 0;
						try {

							pocet = obj.FeatureCollection["@numberReturned"];
							positionPoint = obj.FeatureCollection["wfs:member"][0]["uge:UtEx"]["ugs:serviceLocation"]["ugs:ServiceLocationType"]["ugs:serviceLocationByGeometry"]["gml:Point"];
							positionMultiPoint = obj.FeatureCollection["wfs:member"][0]["uge:UtEx"]["ugs:serviceLocation"]["ugs:ServiceLocationType"]["ugs:serviceLocationByGeometry"]["gml:MultiPoint"];
						} catch (e) {}

						var pocetLimit = 1000;
						/*
						if (pocet > 50) {
							pocetLimit = 50;

							alert("WARNING: too many results, only first 50 will be added to map");
						}
						*/

						var vyfailovalo = 0;
                        
                        // GML IDS to compare with server - delete local data if removed from server
                        var gmlIDS ="";
                        
						for (var i = 0; i < pocet; i++) {
							var gmlID = 0;

							//Ti.api.info("ANNOTATION LOOP #"+i);

							// ANNOTATIONS FOR POINT TYPE
							if (positionPoint) {							
								/*
								 * typeName = ugepix:uge_pix
								 */
								if (!obj.FeatureCollection["wfs:member"][i]["uge:UtEx"]["uge:imgs"])
								{
								    uid='';
								    iID = '';
								    iPS = '';
								    imageText = '';
								} 
								else if (obj.FeatureCollection["wfs:member"][i]["uge:UtEx"]["uge:imgs"]["uge:Img"]){
								    if (obj.FeatureCollection["wfs:member"][i]["uge:UtEx"]["uge:imgs"]["uge:Img"]["uge:userId"]){
                                        uid = obj.FeatureCollection["wfs:member"][i]["uge:UtEx"]["uge:imgs"]["uge:Img"]["uge:userId"];
                                    }
                                    if (obj.FeatureCollection["wfs:member"][i]["uge:UtEx"]["uge:imgs"]["uge:Img"]["uge:imgDeviceId"]){
                                        iID = obj.FeatureCollection["wfs:member"][i]["uge:UtEx"]["uge:imgs"]["uge:Img"]["uge:imgDeviceId"];
                                    }
								    if (obj.FeatureCollection["wfs:member"][i]["uge:UtEx"]["uge:imgs"]["uge:Img"]["uge:imgLink"]){
								        iPS = obj.FeatureCollection["wfs:member"][i]["uge:UtEx"]["uge:imgs"]["uge:Img"]["uge:imgLink"]["@xlink:href"];    
								    }  
                                    if (obj.FeatureCollection["wfs:member"][i]["uge:UtEx"]["uge:imgs"]["uge:Img"]["uge:imgText"]){
                                        imageText = obj.FeatureCollection["wfs:member"][i]["uge:UtEx"]["uge:imgs"]["uge:Img"]["uge:imgText"];
                                    }								    
								}
								var iPL = '';
                                /*
                                 * typeName = ugepix:ugs_govser
                                 */
                                var serviceTypeSplit = obj.FeatureCollection["wfs:member"][i]["uge:UtEx"]["ugs:serviceType"]["@xlink:href"].split("/ServiceTypeValue/");
                                var serviceType = serviceTypeSplit[1];
                                var positionSplit = obj.FeatureCollection["wfs:member"][i]["uge:UtEx"]["ugs:serviceLocation"]["ugs:ServiceLocationType"] ["ugs:serviceLocationByGeometry"]["gml:Point"]["gml:pos"].split(" "); 
                                var lon = positionSplit[0];
                                var lat = positionSplit[1];
                                var gmlID = obj.FeatureCollection["wfs:member"][i]["uge:UtEx"]["@gml:id"];
                                //var gmlID = obj.FeatureCollection["wfs:member"][i]["uge:UtEx"]["gml:identifier"];
                                var codeSpace = obj.FeatureCollection["wfs:member"][i]["uge:UtEx"]["gml:identifier"]["@codeSpace"];
                                var serviceName = obj.FeatureCollection["wfs:member"][i]["uge:UtEx"]["gml:name"];
                                var obs_date = obj.FeatureCollection["wfs:member"][i]["uge:UtEx"]["ugs:beginLifespanVersion"]; 
                                /*
                                 * typeName = ugepix:bs2_contact
                                 */ 
                                var serviceAddress = obj.FeatureCollection["wfs:member"][i]["uge:UtEx"]["ugs:pointOfContact"]["base2:Contact"]["base2:address"]["ad:AddressRepresentation"]["ad:locatorDesignator"];
                                
                                    
                                                                  
								gmlIDS=gmlIDS + "'" + gmlID + "', ";
							}

							// ANNOTATIONS FOR MULTIPOINT TYPE
							else if (positionMultiPoint) {
								//Ti.api.info("==> ANNOTATION TYPE MULTI POINT");
								var lon = obj.features[i].geometry.coordinates[0][0];
								var lat = obj.features[i].geometry.coordinates[0][1];
								var gmlID = obj.features[i].id;
								gmlIDS=gmlIDS + "'" + gmlID + "', ";
								
								var plnt_name = obj.features[i].properties.plnt_name;
								var photo = obj.features[i].properties.image;
                                var iPL = obj.features[i].properties.imagePathLocal;
                                var iPS = obj.features[i].properties.imagePathServer;
                                var iID = obj.features[i].properties.imageDeviceId;

								var ts = 0;
								try {
									ts = Date.parse(obj.features[i].properties.obs_date);
								} catch (e) {}

								if (ts > 0) {
									var obs_date = dateTime(true, ts);

								} else {
									var obs_date = "1970-01-01 00:00:00";
								}

								var uid = obj.features[i].properties.uid;
								var crtn = obj.features[i].properties.crtn;
								var site_conf = obj.features[i].properties.site_conf;
								var site_descr = obj.features[i].properties.site_descr;
								//Ti.api.info(lat + '\n' + lon);
								if (i < pocetLimit) {
									//var uid = $.nicknameField.getValue();
									spl = uid.split("#");
									var uidText = spl[0];
								}

							} else {
								//Ti.api.info("==> ANNOTATION TYPE ERROR");
								vyfailovalo += 1;
								//alert("CURRENT VERSION SUPPORTS ONLY POINT GEOMETRY TYPES");
								break;
							}

							//Ti.api.info(db.getFile().nativePath);


							// mame to uz v db?
							var db = Ti.Database.open(menoDatabazy);

							//Ti.api.info("========================================================");
							//Ti.api.info("AddtoMapButton: SELECT * from annotations WHERE gmlID='" + gmlID + "'");

							var select = db.execute("SELECT * from annotations WHERE gmlID='" + gmlID + "'");
							if (select.rowCount) {
								// update v db


								// TODO: VYRIESIT ZE CO SA MA STAT
								// teraz sa updatne datami z internetu lokalna databaza
								// co ak je v GEOSERVERI iny udaj ako mame v lokal DB?


								db.execute("UPDATE annotations SET lat=" + lat + ", lon=" + lon + ", featureType='" + featureTYPE + "', endpointURL='" + endpointURL + "', uid='" + uid + "',codeSpace='" + codeSpace + "', serviceType='"+ serviceType +"', serviceName='"+ serviceName +"', imageDeviceId='"+ iID +"', imagePathLocal='"+ iPL +"', imagePathServer='"+ iPS +"', serviceAddress='"+ serviceAddress +"', imageText='"+ imageText +"', obs_date='"+ obs_date +"', mark_for_del=0, mark_for_push=0 WHERE gmlID='" + gmlID + "' ");
							} else {
								// insert do db
								db.execute("INSERT INTO annotations (id, lat, lon, featureType, endpointURL, gmlID, codeSpace, uid, serviceType, serviceName,imageDeviceId,imagePathLocal,imagePathServer,serviceAddress,imageText,obs_date) VALUES (" + featIdIn + "," + lat + "," + lon + ",'" + featureTYPE + "', '" + endpointURL + "', '" + gmlID + "','" + codeSpace + "', '" + uid + "', '"+ serviceType +"','"+ serviceName +"','"+ iID +"','"+ iPL +"','"+ iPS +"','"+ serviceAddress +"','"+ imageText +"','"+ obs_date +"' ) ");
								featIdIn += 1;

							}
							db.close();
							lon = null;
							lat = null;
							gmlID = null;
							annotationWFS = null;
							db = null;
							select = null;
						}

                        try{ gmlIDS = gmlIDS.substring(0,(gmlIDS.length-2)); }catch(e){}
                        if(gmlIDS == ""){ gmlIDS = "''";}

                        var str = "DELETE FROM annotations WHERE gmlID NOT IN(0, "+gmlIDS+")";
                        var db = Ti.Database.open(menoDatabazy);
                        db.execute(str);
                        db.close();
                        divider();
                        //console.log(str);   
                        
						if (vyfailovalo > 0) {
							//alert("CURRENT VERSION SUPPORTS ONLY POINT GEOMETRY TYPES, "+vyfailovalo+" FAILED OUT OF "+pocet+" ANOTATIONS IMPORTED");
							alert("CURRENT VERSION SUPPORTS ONLY POINT GEOMETRY TYPES");

						} else {
							//$.index.setActiveTab(2);
							buttonLocalDataFunc();

						}
					}
				}
			};
			xhr.onerror = function (e) {
				// should do something more robust
				alert('Whoops...something is wrong check URL you entered. Error details: ' + e.error);
				//console.log(JSON.stringify(e));
			};
			xhr.open('GET', url, true);
			//activityIndicator.show();


			xhr.send();
		} catch (e) {
			alert("There was network error: " + e);
		}

	} else {
		// alert("There was network error");
		buttonLocalDataFunc();
	}

};

function buttonLocalDataFunc(evt) {

	if (MapWindowOpen) {
		buttonLocalDataFuncInternal();

	} else {
		MapWindow.open();
		readdEventListener(MapWindow, "open", eventListenerMapWindow_fromButton);
	}

};

function buttonLocalDataFuncInternal() {
	var db = Ti.Database.open(menoDatabazy);
	var select = db.execute('SELECT * from annotations WHERE mark_for_del=0');
	db.close();
	while (select.isValidRow()) {
		var gmlID = select.fieldByName('gmlID');
		var plnt_name = select.fieldByName('plnt_name');
		var photo = select.fieldByName('image');
		var pathLocal = select.fieldByName('imagePathLocal');
		var pathServer = select.fieldByName('imagePathServer');
		var obs_date = select.fieldByName('obs_date');
		var uid = select.fieldByName('uid');
		var uidText = uid.split("#");
		uidText = uidText[0];
		var crtn = select.fieldByName('crtn');
		var site_conf = select.fieldByName('site_conf');
		var site_descr = select.fieldByName('site_descr');

		var annotationColor = 'balloon_blue.png';
		var myNicknameText = myNickname.split("#");
		// tu som zacal menit myNicknameText
		myNicknameText = myNicknameText[0];
		if (uid == myNicknameText) {
			// my own annotation color
			var annotationColor = 'balloon_yellow.png';
		}
		if (uid == '') {
            // no owner yet annotation color
            var annotationColor = 'balloon_green.png';
        }

		var mojeID = select.fieldByName('id');
		var marker = annotationColor;
		var lon = select.fieldByName('lon');
		var lat = select.fieldByName('lat');
		var vec = 'addAnnotation(' + mojeID + ',' + lon + ',' + lat + ',"' + marker + '");';
		Ti.App.fireEvent('app:fromTitanium', {
			message : vec
		}); // LIFO FIFO


		//console.log("=========================================================");
		//console.log(vec);
		//console.log("=========================================================");
		select.next();
	}

	Ti.App.fireEvent('app:fromTitanium', {
		message : 'removeAllAnnotations();'
	});

}


/* ***************************** *
 * **** EVENT LISTENER FUNC **** *
 * ***************************** */

function eventListenerMainWindow() {
    
    // draw observations to main window
    var myNicknameText = myNickname.split("#");
        myNicknameText = myNicknameText[0];
    var db = Ti.Database.open(menoDatabazy);
    var select = db.execute('SELECT * from annotations WHERE uid=\''+myNicknameText+'\' AND (gmlID=0 OR mark_for_push=1 OR mark_for_del=1) ');
    db.close();
    
    if( select.rowCount )
    {
        drawPushWindow();
    }
    drawObservationsToMainWindow();
      
    // draw main window top toolbar
	MainWindow.activity.onCreateOptionsMenu = function (e) {
		var win = MainWindow;
		var menu = e.menu,
		collapseActionView = Ti.UI.createView({
				width : 100,
				height : 20,
				backgroundColor : 'gray'
			}),

		helpItem = menu.add({
				title : 'HELP',
				icon : "/images/drawable-xxhdpi/ic_help_outline_white_24dp.png",
				showAsAction : Ti.Android.SHOW_AS_ACTION_ALWAYS,
				order : 1
			}),

		overflowItem = menu.add({
				title : 'M',
				icon : "/images/drawable-xxhdpi/ic_reorder_white_48dp.png",
				actionView : collapseActionView,
				showAsAction : Ti.Android.SHOW_AS_ACTION_ALWAYS | Ti.Android.SHOW_AS_ACTION_COLLAPSE_ACTION_VIEW,
				order : 2
			});

		collapseActionView.addEventListener('click', function () {
			overflowItem.expandedActionView();
		});

		readdEventListener(MainWindow, 'click', function (evt) {

			try {
				overflowItem.collapseActionView();
			} catch (e) {}

		});
		readdEventListener(overflowItem, 'expand', function () {
			//Ti.api.info(' -------------> Expanded menu item!');

			//var dataSet = ['Local Data', 'WFS Server', 'Server Data', 'Open Map', 'Support', 'About'];
			var dataSet = ['Local Data', 'WFS Server', 'Server Data', 'Open Map'];
			var heightCalc = 52 * (dataSet.length);

			subMenu = Titanium.UI.createView({
					backgroundColor : '#000000', //DCEADE
					color : 'white',
					opacity : 0.90,
					width : 135,
					height : heightCalc,
					right : 0,
					top : 0
				});

			var tableList = new List("", dataSet,
					function callbackOnItemListClicked(list) {
					var index = list.itemIndex;
					var itemTemplate = list.section.items[index].title;
					var itemSource = list.source;
					// local data
					if (index == 0) {
						activityIndicator.show();
						buttonLocalDataFunc();
					}
					// WFS Server URL
					if (index == 1){
					    buttonServerClick();
					}
					
					// server data
					if (index == 2) {
						activityIndicator.show();
						buttonRetrieveDatasetsFunc();
					}
					// open map
					if (index == 3) {
					    activityIndicator.show();
						MapWindow.open();
						MapWindow.add(webView);
					}
					// support
                    if (index == 4) {
                        var SupportWindow = new Window('Proplant support');
                        var SupportWindowWebView = Ti.UI.createWebView({
                                left : 0,
                                top : 0,
                                right : 0,
                                bottom : 0,
                                width : '100%',
                                height : '100%',
                                borderRadius : 1,
                                enableZoomControls : false, // Android only
                                url : '/HTML/acknow/index.html',
                                setWebContentsDebuggingEnabled : true
                            });
                        SupportWindow.open();
                        SupportWindow.addEventListener('open', function(){
                            SupportWindow.activity.actionBar.hide();
                        });
                        SupportWindow.add(SupportWindowWebView);
                    }
					// about
					if (index == 5) {
						var AboutWindow = new Window('About Proplant');
						var AboutWindowWebView = Ti.UI.createWebView({
								left : 0,
								top : 0,
								right : 0,
								bottom : 0,
								width : '100%',
								height : '100%',
								borderRadius : 1,
								enableZoomControls : false, // Android only
								url : '/HTML/about/index.html',
								setWebContentsDebuggingEnabled : true
							});
						AboutWindow.open();
						AboutWindow.addEventListener('open', function(){
                            AboutWindow.activity.actionBar.hide();
                        });
						AboutWindow.add(AboutWindowWebView);

					}
					

					//console.log("Klikol si MENU item: " + itemTemplate.text);

					overflowItem.collapseActionView();
				},

					function callbackOnListItemCreated(item, menuListView) {

					item.title.backgroundColor = 'white';
					item.title.color = 'black';
					item.title.textAlign = Ti.UI.TEXT_ALIGNMENT_CENTER;
				});

			subMenu.add(tableList);
			win.add(subMenu);
		});

		readdEventListener(overflowItem, 'collapse', function () {
			try {
				win.remove(subMenu);
			} catch (e) {}
		});

		readdEventListener(overflowItem, 'click', function () {
			//Ti.api.info(' -------------> Click menu item!');

		});

		readdEventListener(helpItem, "click", function (e) {
			//alert("Help Item Clicked!");
			var HelpMainWindow = new Window('Help', false);
			var HelpMainWindowWebView = Ti.UI.createWebView({
					left : 0,
					top : 0,
					right : 0,
					bottom : 0,
					width : '100%',
					height : '100%',
					borderRadius : 1,
					enableZoomControls : false, // Android only
					url : '/HTML/help/index-home.html',
					setWebContentsDebuggingEnabled : true
				});
			HelpMainWindow.open();
			HelpMainWindow.add(HelpMainWindowWebView);
		});
	};

	MainWindow.activity.invalidateOptionsMenu();

}

function eventListenerMapWindow() {
	if (!MapWindowOpen) {
		MapWindowOpen = true;
		MapWindow.activity.onCreateOptionsMenu = function (e) {
			var win = MapWindow;
			var menu = e.menu,
			collapseActionView = Ti.UI.createView({
					width : 100,
					height : 20,
					backgroundColor : 'gray'
				}),

			/*
			if (manualModEnabled == 1){
			    helpItem = menu.add({
                    title : 'Insert mode enabled',
                    icon : "/images/drawable-xxhdpi/ic_help_outline_white_24dp.png",
                    showAsAction : Ti.Android.SHOW_AS_ACTION_ALWAYS,
                    order : 3
                }),    
			}
			*/
			helpItem = menu.add({
					title : 'HELP',
					icon : "/images/drawable-xxhdpi/ic_help_outline_white_24dp.png",
					showAsAction : Ti.Android.SHOW_AS_ACTION_ALWAYS,
					order : 1
				}),

			overflowItem = menu.add({
					title : 'MENU',
					icon : "/images/drawable-xxhdpi/ic_reorder_white_48dp.png",
					actionView : collapseActionView,
					showAsAction : Ti.Android.SHOW_AS_ACTION_ALWAYS | Ti.Android.SHOW_AS_ACTION_COLLAPSE_ACTION_VIEW,
					order : 2
				});

			collapseActionView.addEventListener('click', function () {
				overflowItem.expandedActionView();
			});

			readdEventListener(MapWindow, 'click', function (evt) {
				try {
					overflowItem.collapseActionView();
				} catch (e) {}

			});

			readdEventListener(overflowItem, 'expand', function () {
				//Ti.api.info(' -------------> Expanded menu item!');

				var dataSet = ['Locate', 'Observe', 'Insert', 'Capture'];
				var heightCalc = 52 * (dataSet.length);

				subMenu = Titanium.UI.createView({
						backgroundColor : '#000000', //DCEADE
						color : 'white',
						opacity : 0.75,
						width : 135,
						height : heightCalc,
						right : 0,
						top : 0
					});

				var tableList = new List("", dataSet,
						function callbackOnItemListClicked(list) {
						var index = list.itemIndex;
						var itemTemplate = list.section.items[index].title;
						var itemSource = list.source;
						if (index == 0) {
							locate();
						}
						if (index == 1) {
							addGPS();
						}
						if (index == 2) {
							addManually();
                        }
                        if (index == 3) {
							toggleMapDownloadEnabled();
                        }
                        
						//console.log("Klikol si MENU item: " + itemTemplate.text);

						overflowItem.collapseActionView();
					},

						function callbackOnListItemCreated(item, menuListView) {

						item.title.backgroundColor = 'white';
						item.title.color = 'black';
						item.title.textAlign = Ti.UI.TEXT_ALIGNMENT_CENTER;
					});

				subMenu.add(tableList);
				win.add(subMenu);
			});

			readdEventListener(overflowItem, 'collapse', function () {
				//Ti.api.info(' -------------> Collapsed menu item!');

				try {
					win.remove(subMenu);
				} catch (e) {}
			});

			readdEventListener(overflowItem, 'click', function () {
				//Ti.api.info(' -------------> Click menu item!');

			});

			readdEventListener(helpItem, "click", function (e) {
				//alert("Help Item Clicked!");
				var HelpMapWindow = new Window('Help', false);
				var HelpMapWindowWebView = Ti.UI.createWebView({
						left : 0,
						top : 0,
						right : 0,
						bottom : 0,
						width : '100%',
						height : '100%',
						borderRadius : 1,
						enableZoomControls : false, // Android only
						url : '/HTML/help/index-map.html',
						setWebContentsDebuggingEnabled : true
					});
				HelpMapWindow.open();
				HelpMapWindow.add(HelpMapWindowWebView);
			});
		};

		MapWindow.activity.invalidateOptionsMenu();

	}

}

function eventListenerSetMapWindowOpenFalse() {
	//activityIndicator.show();
	MapWindowOpen = false;
	//redrawObservations();
    activityIndicator.hide();
    if( manualModEnabled )
    {
        addManually();
    }
}

// FUNCTION INSERTING OBSERVATIONS ADDED TO THE OL MAP INTO THE APP DATABASE
function eventListenerFromWebView2(e) {
	// VARIABLES FOR INSERT INTO DB
	var lat = e.latitude;
	var lon = e.longitude;
	featureType = featureTYPE;
	var gmlID = 0;
	var serviceType = default_plnt_name;
	var serviceName ='';
	var photo = '';
	var obs_date = dateTime(true);
	var imageText = '';
	var uid = myNickname;
	spl = uid.split("#");
	var uidText = spl[0];
	//var crtn = '';
	//var site_conf = '';
	//var site_descr = '';
	// INSERT QYERY INTO DB
	var db = Ti.Database.open(menoDatabazy);
	db.execute("INSERT INTO annotations (id, lat, lon, featureType, endpointURL, gmlID, uid, serviceType) VALUES (" + featIdIn + "," + lat + "," + lon + ",'" + featureTYPE + "', '" + endpointURL + "', '" + gmlID + "', '" + uidText + "', '"+ serviceType +"') ");
	db.close();
	featIdIn = featIdIn + 1;
	buttonLocalDataFunc();
	var centerMap = 'zoomOnGPS(' + lon + ',' + lat + ');';
	Ti.App.fireEvent('app:fromTitanium', {
		message : centerMap
	});
	// refresh observations on MainWindow
	redrawObservations();

}

function eventListenerFromWebView3(e){
    var answer = e.message;
    if (answer == 'YES'){
        termsOfUse = 1;
        MainWindowScrollView.remove(iconRadioUnchecked);
        MainWindowScrollView.add(iconRadioChecked);
        TermsWindow.close();
    }
    if (answer == 'NO'){
        termsOfUse = 0;
        MainWindowScrollView.remove(iconRadioChecked);
        MainWindowScrollView.add(iconRadioUnchecked);
        TermsWindow.close();
    }
}

function eventListenerFromWebView4(e){
    
    //divider();
    //console.log("============== eventListenerFromWebView4 ======================");
    
    currentCenter = e.center;
    currentZoomLevel = e.zoom;
   
    Ti.App.Properties.setString('currentZoomLevel', currentZoomLevel);
    Ti.App.Properties.setString('currentCenter', currentCenter);
    
    //divider();
    //console.log(e);
    
}

function eventListenerFromWebViewTileLoaded(e){
    if(mapDownloadEnabled)
    {
            
        
        
        //divider("eventListenerFromWebViewTileLoaded");
        //console.log(e.url);
        //console.log(" ");
        
        
        var fs = Titanium.Filesystem;
        
        
        if( fs.isExternalStoragePresent() )
        {
            var sdir = Titanium.Filesystem.externalStorageDirectory;
            //console.log("CASE: external is present OK");
        }
        else
        {
            var sdir = Titanium.Filesystem.applicationDataDirectory;
            //console.log("CASE: external is NOT present");
        }
        var fle=fs.getFile(sdir);
        
        //console.log(" ");
        //console.log("Native path detected: ");
        //Ti.api.info( fle.nativePath );
        
        var freeSpace = fle.getParent().spaceAvailable();
        //console.log(" ");
        //console.log("FREE SPACE AVAILABLE: ");
        //Ti.api.info( bytesToHuman(freeSpace) );
        
        var path1 = fle.nativePath+"/offline/"+e.z;
        if( fs.getFile(path1).isDirectory() )
        {
            //Ti.api.info( "IS DIR #1:" );
            //Ti.api.info( path1 );
        }
        else
        {
            //Ti.api.info( "IS NOT DIR #1:" );
            //Ti.api.info( path1 );
            fs.getFile(path1).createDirectory();
        }
        
        var path2 = fle.nativePath+"/offline/"+e.z+"/"+e.x;
        if( fs.getFile(path2).isDirectory() )
        {
            //Ti.api.info( "IS DIR #2:" );
            //Ti.api.info( path2 );
        }
        else
        {
            //Ti.api.info( "IS NOT DIR #2:" );
            //Ti.api.info( path2 );
            fs.getFile(path2).createDirectory();
        }
        
        var path3 = fle.nativePath+"/offline/"+e.z+"/"+e.x+"/"+e.y+".png";
        if( fs.getFile(path3).isFile() )
        {
            //Ti.api.info( "Tile already exists:" );
            //Ti.api.info( path3 );
        }
        else
        {
            //Ti.api.info( "Tile not downloaded yet:" );
            //Ti.api.info( path3 );
            
            var xhr = Titanium.Network.createHTTPClient({
                curPath: path3,
                onload: function xhrFileDownload(e) {
                    //divider("eventListenerFromWebViewTileLoaded - DL LISTENER");
                    // first, grab a "handle" to the file where you'll store the downloaded data
                    try{
                        //var myE = JSON.parse(JSON.stringify(e));
                        //myE.source.responseText = "raholl was here...";
                        //console.log(myE);
                        var f = Ti.Filesystem.getFile(e.source.curPath);
                        f.write(this.responseData); // write to the file
                        f=null;
                    }catch(e){ //console.log(e.message);
                    }
                    //console.log("FILE DOWNLOADED !!! ");
                },
                timeout: 10000
            });
            xhr.open('GET',e.url);
            xhr.send();
            
        }
        //var list = fle.getParent().getDirectoryListing();
        //var vec = fle.getParent().spaceAvailable();
        //Ti.api.info( bytesToHuman(vec) );
        //divider();
        /*
        for (var i=1;i<list.length;i++){ 
            //Ti.api.info(list[i].toString());
        }
        */
    }
}

var eventFromButton = false;
function eventListenerwebViewLoad() {
    
	//webView.borderRadius = 1;
	
	divider("eventListenerwebViewLoad");
    
    if(!eventFromButton)
    {
        var vec = currentCenter;
        if(typeof vec != typeof []){ vec = eval("["+vec+"]"); }
        Ti.App.fireEvent('app:fromTitanium', {
            message : 'setCenter(['+ vec + ']);setZoom('+ currentZoomLevel + ');' 
        });
    }
        
	
    buttonLocalDataFuncInternal();
}

function eventListenerWebViewZoomButton() {
    divider();
    //console.log("============== eventListenerWebViewZoomButton ======================");
    //console.log("============== ["+zoomTo.lat+", "+zoomTo.lon+"] ======================");
    
    currentCenter = zoomTo.lon+", "+zoomTo.lat;
    
    if(currentZoomLevel < 19){currentZoomLevel = 19;}
    
   
    Ti.App.Properties.setString('currentZoomLevel', currentZoomLevel);
    Ti.App.Properties.setString('currentCenter', currentCenter);
    
    var vec = currentCenter;
    if(typeof vec != typeof []){ vec = eval("["+vec+"]"); }
    Ti.App.fireEvent('app:fromTitanium', {
        message : 'setCenter(['+ vec + ']);setZoom('+ currentZoomLevel + ');' 
    });

    eventFromButton = false;
    
    /*
    
    
    usleep(800 * 1000);
    var centerPoint = 'zoomOnGPS(' + zoomTo.lon + ',' + zoomTo.lat + ', 19);';
    Ti.App.fireEvent('app:fromTitanium', { message : centerPoint });
    
    // len jednorazovo
    webView.removeEventListener('load', eventListenerWebViewZoomButton);
    */
}
function eventListenerMapWindow_fromButton() {
	MapWindowOpen = true;
	MapWindow.add(webView);

	/*
	 *  EDITOR WINDOW DEFINITION AFTER THE CLICK ON AN ANNOTATION WAS FIRED
	 */
}

function eventListMarkForDel() {

    var db = Ti.Database.open(menoDatabazy);
    if (currentGML == 0) {
        db.execute("DELETE FROM annotations WHERE id='" + currentFeatIdIn + "'");
    } else {
        db.execute("UPDATE annotations SET mark_for_del='1', mark_for_push=0 WHERE gmlID='" + currentGML + "' ");
    }

    db.close();
    buttonLocalDataFunc();
};

function eventListenerMapWindowZoomButton() {
    readdEventListener(webView, "load", eventListenerWebViewZoomButton);
}

var imagePathLocal, imagePathServer, imageDefault, textFieldPlntName, textFieldSiteConf, textFieldObsDate, textFieldSiteDescr, textFieldCrtn,  myImage;
function eventListenerFromWebView(e) {

	Ti.API.warn("**************************************************");
	//console.log("buttonLocalDataFunc RADEK 848 - FROM WEB VIEW");
	Ti.API.warn("**************************************************");
	//console.log("");
	var db = Ti.Database.open(menoDatabazy);
	var select = db.execute('SELECT * from annotations WHERE id=' + e.message);
	db.close();
	if (!select.rowCount) {
		//alert("neznama chyba: SELECT * from annotations WHERE id="+e.message);
		return;
	} else {
		//alert("bez chyby mazeme: SELECT * from annotations WHERE id="+e.message);
	}
       currentFeatIdIn = select.fieldByName('id');
       var uid = select.fieldByName('uid');
	/*
	 * NO OWNER OF THE ANNOTATION
	 */
	var myNicknameText = myNickname.split("#");
        myNicknameText = myNicknameText[0];
	if (myNicknameText != uid && uid != '') {
		var title = ("View observation: " + select.fieldByName('id'));
		var WinEdit = new Window(title, false);
	}
	
	/*
	 * OWNER OF THE ANNOTATION
	 */
	
	else {
		var fotilSom = false;
		var myNicknameText = myNickname.split("#");
        myNicknameText = myNicknameText[0];
		var title = ("Edit observation: " + select.fieldByName('id'));
		var WinEdit = new Window(title, false, true, function (evt) {

				if (evt.source.title == 'Save') {
					currentFeatIdIn = select.fieldByName('id');
					currentGML = select.fieldByName('gmlID');

					var db = Ti.Database.open(menoDatabazy);
                                  
                    var sqlString = "UPDATE annotations SET serviceType='%1', serviceName='%2', obs_date='%3', serviceAddress='%4', imageText='%5', uid = '%9', mark_for_del='0' WHERE id='" + currentFeatIdIn + "'";
                        sqlString = formatString(sqlString, [textFieldPlntName.html, textFieldSiteDescr.value,textFieldObsDate.value,textFieldServiceAddress.value,textFieldSiteDescr.value,cameraImageName, imagePathLocal, imagePathServer, myNicknameText]);
                    
					db.execute(sqlString);
					
					divider();
					//console.log(sqlString);

					var sqlString = "UPDATE annotations SET mark_for_push='1' WHERE id='" + currentFeatIdIn + "' AND gmlID > 0";
					db.execute(sqlString);
					db.close();

					if (e.doNotInvokeMap != true) {
						buttonLocalDataFunc();
					}

					WinEdit.close();

				}
				
				
                
    				if (evt.source.title == 'Delete') {
    					if (myNicknameText = uid){
        					var dialog = Ti.UI.createAlertDialog({
        						cancel : 1,
        						buttonNames : ['Yes', 'No'],
        						message : 'Delete the record?',
        						title : 'Deleting ...'
        					});
        					
        					readdEventListener(dialog, 'click', function (e) {
        						if (e.index === e.source.cancel) {
        							//Ti.api.info('The discard button was clicked');
        						} else {
        							currentFeatIdIn = select.fieldByName('id');
        							currentGML = select.fieldByName('gmlID');
        							//console.log(currentFeatIdIn);
        							//console.log(currentGML);
        							eventListMarkForDel(currentFeatIdIn);
        							WinEdit.close();
        							redrawObservations();
                                    drawPushWindow();
        						}
        					});
        					
        					dialog.show();
    				    }
    				else {
                        alert ("This observation has not an editor yet, you cannot delete it! However you can update it and become its editor.");
                    }
    			}
    			
    				
				
				// refresh observations on MainWindow
				redrawObservationsToMainWindow();

			});

	}
	WinEdit.open();
    
    WinEdit.addEventListener('close', function(e){ if (e.doNotInvokeMap != true) { activityIndicator.hide(); }});

	var scrollview = new ScrollView();
	WinEdit.add(scrollview);

	/*
	 * EDITOR WINDOW LABELS DEFINITIONS
	 */
	var left = 10;
	var top = 10;
	var posun = 95;

	var label;
	label = new Label("Service type: ");
	label.left = left + 140;
	label.top = top - 5;
	label.height = 19;
	label.right = 10;
	label.width = 'auto';
	label.color = '#3C4037';
	//label.backgroundColor='white';
	label.font.fontWeight = 'bold';
	//scrollview.add(label);

	top += posun;
	top += 40;
	label = new Label("Service name:");
	label.left = left;
	label.top = top;
	label.color = '#3C4037';
	scrollview.add(label);

	top += posun;
	label = new Label("Observation Date:");
	label.left = left;
	label.top = top;
	scrollview.add(label);

	top += posun;
	label = new Label("Service Address:");
	label.left = left;
	label.top = top;
	label.color = '#3C4037';
	scrollview.add(label);
	
	top += posun;
    label = new Label("Observation Description:");
    label.left = left;
    label.top = top;
    label.color = '#3C4037';
    scrollview.add(label);
    
    top += posun;
    top += 40;
    label = new Label("GML Identifier");
    label.left = left;
    label.top = top;
    label.color = '#3C4037';
    scrollview.add(label);

	/*
	 * EDITOR WINDOW FIELDS DEFINITIONS
	 */
	/*
	 * 1. SERVICE TYPE
	 */

	top = 60;
	textFieldPlntName = new Label(select.fieldByName('serviceType'));
	//textFieldPlntName.verticalAlign = Ti.UI.TEXT_ALIGNMENT_TOP;
	textFieldPlntName.left = left + 140;
	textFieldPlntName.right = 10;
	//textFieldPlntName.top = top - 30;
	textFieldPlntName.top = 5;
	//textFieldPlntName.height = 110;
	textFieldPlntName.height = 135;
	textFieldPlntName.width = 'auto';
	textFieldPlntName.font = {fontSize : 20 };
	//textFieldPlntName.backgroundColor='white';
	textFieldPlntName.verticalAlign = Ti.UI.TEXT_VERTICAL_ALIGNMENT_TOP;
	textFieldPlntName.horizontalAlign = Ti.UI.TEXT_ALIGNMENT_CENTER;
	scrollview.add(textFieldPlntName);
	var myNicknameText = myNickname.split("#");
        myNicknameText = myNicknameText[0];
	if (myNicknameText == select.fieldByName('uid') || select.fieldByName('uid') == '') {
		readdEventListener(textFieldPlntName, "click", function () {
			// LOADING PROTECTED PLANTS LIST FROM LOCAL JSON FILE
			var fileName = '/data/serviceType.json';
			var file = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, fileName);
			var json,
			codelist,
			containeditems,
			value,
			label,
			definition,
			nametext,
			protectedPlants,
			plant,
			latin,
			national;
			var preParseData = (file.read().text);
			var response = JSON.parse(preParseData);
			divider("SERVICE TYPE JSON");
			console.log (response);
			divider();
			//Ti.api.info('latin0 = ' + response.protectedPlants.plant[0].latin);
			//Ti.api.info('national0 = ' + response.protectedPlants.plant[0].national);

			var serviceTypeCount = response.codelist.containeditems;
			divider("SERVICE TYPE JSON");
            console.log (serviceTypeCount.length);
            divider();
			//var dataListPlantLatinName = [];
			var dataListServiceTypeLabel = [];
			for (var i = 0; i < serviceTypeCount.length; i++) {
				//Ti.api.info([i] + '. latin = ' + response.protectedPlants.plant[i].latin);
				//Ti.api.info([i] + '. national = ' + response.protectedPlants.plant[i].national);
				if (response.codelist.containeditems[i].value.id != ""){
    				var serviceTypeLabelSplit = response.codelist.containeditems[i].value.id.split("/ServiceTypeValue/");
    				var serviceTypeLabel = serviceTypeLabelSplit[1];
    				dataListServiceTypeLabel[i] = serviceTypeLabel;
				}
			}

			
			
			var searchView = Ti.UI.Android.createSearchView({
                hintText: "Service type search",
                backgroundColor: '#000000'
            });

			var service_type_window = new Window("Service Type Labels");
			service_type_window.open();
			
			service_type_window.addEventListener('open', function(){
			    
			    service_type_window.activity.actionBar.hide();
			    
			});
			
			var service_type_list = new List("", dataListServiceTypeLabel, function (evt) {
                service_type_window.close();
                textFieldPlntName.html = dataListServiceTypeLabel[evt.itemIndex];
            }, function (dataItem, menuListView) {

                dataItem.title.color = '#3C4037';
                dataItem.title.borderColor = '#3C4037';
                dataItem.title.backgroundColor = 'white';
                dataItem.title.borderWidth = 1;
                dataItem.title.left = '2%';
                dataItem.title.width = '96%';
                dataItem.title.textAlign = Ti.UI.TEXT_ALIGNMENT_CENTER;
                
            }, searchView);
            
            service_type_window.add(service_type_list);
            
		});
	}
	/*
	 * 2. SERVICE NAME
	 */
	
	top += posun;
	top += 35;
    textFieldSiteDescr = new TextField(select.fieldByName('serviceName'));
    textFieldSiteDescr.left = left;
    textFieldSiteDescr.top = top;
    textFieldSiteDescr.backgroundColor='white';
    var myNicknameText = myNickname.split("#");
        myNicknameText = myNicknameText[0];
    if (myNicknameText != select.fieldByName('uid')) {
        textFieldSiteDescr.setEditable(false);
    }
    if (select.fieldByName('uid') == '') {
        textFieldSiteDescr.setEditable(true);
    }
    scrollview.add(textFieldSiteDescr);
    
    /*
     * 2. SITE CONFIGURATION 
     
	top += posun;
	top += 35;
	textFieldSiteConf = new TextField(select.fieldByName('site_conf'));
	textFieldSiteConf.left = left;
	textFieldSiteConf.top = top;
	textFieldSiteConf.setEditable(false);
	textFieldSiteConf.backgroundColor='white';

	if (myNickname == select.fieldByName('uid')) {
		readdEventListener(textFieldSiteConf, "click", function () {
			var dataListSiteConf = ['in-groups', 'single plant'];
			var site_conf_list = new List("", dataListSiteConf, function (evt) {
					site_conf_window.close();
					var selectedIndex = evt.source.selectedIndex;
					textFieldSiteConf.setValue(dataListSiteConf[evt.itemIndex]);
				}, function (dataItem, menuListView) {

					//dataItem.title.backgroundColor= '#3C4037';
					dataItem.title.color = '#3C4037';
					dataItem.title.borderColor = '#3C4037';
					dataItem.title.backgroundColor = 'white';
					dataItem.title.borderWidth = 1;
					dataItem.title.left = '2%';
					dataItem.title.width = '96%';
					dataItem.title.textAlign = Ti.UI.TEXT_ALIGNMENT_CENTER;
				});

			var site_conf_window = new Window("Select site configuration: ");
			site_conf_window.open();
			site_conf_window.add(site_conf_list);
		});
	}
	scrollview.add(textFieldSiteConf);
*/
	/*
	 * 3. PHOTOGRAPHY
	 */
	imagePathLocal = select.fieldByName('imagePathLocal');
	imagePathServer = select.fieldByName('imagePathServer');
	imageDefault = '/app_ico.png';
	imageDefault2 = '/app_ico2.png';
	var myImagePath = imageDefault;
	var cameraOriginalImage = imageDefault;
	var cameraRotatedImage = imageDefault;
	var cameraImageName = '';

	if (imagePathServer != '') {
		if (imagePathLocal != '') {
			// existuje aj local aj server
			if(myDeviceId == select.fieldByName('imageDeviceId'))
			{
			    myImagePath = imagePathLocal;
			}
			else
			{
			    myImagePath = imagePathServer;
			}
		} 
		else 
		{
			// len server
			myImagePath = imagePathServer;
		}
	} else {
		if (imagePathLocal != '') {
			// len local
			if(myDeviceId == select.fieldByName('imageDeviceId'))
            {
                myImagePath = imagePathLocal;
            }
            else
            {
                myImagePath = imageDefault2; 
            }
		}
	}
	
	// offline?
	if(myImagePath == imagePathServer && !Titanium.Network.getOnline())
	{
	   myImagePath = imageDefault2; 
	}
	
	divider();
	//console.log(myImagePath);

    if(myImagePath == imageDefault || myImagePath == imageDefault2 || myImagePath == imagePathServer)
    {
        try{ myImage = new ImageCropped(myImagePath, 130, 1); }catch(e){ myImagePath = imageDefault2; myImage = new ImageCropped(myImagePath, 130, 1); }
    }
    else
    {
        var myMedia = Ti.Filesystem.getFile(myImagePath);
        var myResized=rotateAndResize(myMedia, 450, 100);
        //console.log(myMedia);
        myImage = new ImageCropped(myResized, 130, 1.25);
    }
    
	myImage.left = left;
	myImage.top = 10;
	scrollview.add(myImage);
	var myNicknameText = myNickname.split("#");
        myNicknameText = myNicknameText[0];
    
	if (myNicknameText == select.fieldByName('uid') || select.fieldByName('uid') == '') {
        
        myImage.setProps({
            currentFeatIdIn:select.fieldByName('id'), 
            myImagePath:myImagePath
        });
        
		//readdEventListener(myImage, "click", eventListenerCameraPhotoDone);
		readdEventListener(myImage, "click", openImagePreview);
	}
	else{
	    myImage.setProps({
            currentFeatIdIn:select.fieldByName('id'), 
            myImagePath:myImagePath
        });
        readdEventListener(myImage, "click", openImagePreviewReadOnly);
	}

	/*
	 * 4. OBSERVATION DATE
	*/ 

	top += posun;
	textFieldObsDate = new TextField(select.fieldByName('obs_date'));
	textFieldObsDate.left = left;
	textFieldObsDate.top = top;
	textFieldObsDate.setEditable(false);
    textFieldObsDate.backgroundColor='white';
	if (myNicknameText == select.fieldByName('uid') || select.fieldByName('uid') == '') {
		readdEventListener(textFieldObsDate, "click", function () {
			var obsDate = new DatePicker(new Date(), function (evt) {
					//console.log(JSON.stringify(evt));
					var ts = 0;
					try {
						ts = Date.parse(evt.value);
					} catch (e) {}

					if (ts > 0) {
						var obs_date = dateTime(true, ts);

					} else {
						var obs_date = dateTime(true);
					}
					textFieldObsDate.setValue(obs_date);
				});

		});
	}
	scrollview.add(textFieldObsDate);

	/*
	 * 5. SERVICE ADDRESS
	 */

    top += posun;
    textFieldServiceAddress = new TextField(select.fieldByName('serviceAddress'));
    textFieldServiceAddress.left = left;
    textFieldServiceAddress.top = top;
    textFieldServiceAddress.backgroundColor='white';
    if (myNicknameText != select.fieldByName('uid')) {
        textFieldServiceAddress.setEditable(false);
    }
    if (select.fieldByName('uid') == '') {
        textFieldServiceAddress.setEditable(true);
    }
    
    scrollview.add(textFieldServiceAddress);
    
    /*
     * 6. SITE DESCRIPTION
    */ 

    top += posun;
    textFieldSiteDescr = new TextArea(select.fieldByName('imageText'));
    textFieldSiteDescr.left = left;
    textFieldSiteDescr.top = top;
    textFieldSiteDescr.backgroundColor='white';
    if (myNicknameText != select.fieldByName('uid')) {
        textFieldSiteDescr.setEditable(false);
    }
    if (select.fieldByName('uid') == '') {
        textFieldSiteDescr.setEditable(true);
    }
    
    scrollview.add(textFieldSiteDescr);


    /*
     * 7. GML ID
    */ 

    top += posun;
    top += 50;
    textFieldGmlId = new TextField(select.fieldByName('gmlID'));
    textFieldGmlId.left = left;
    textFieldGmlId.top = top;
    textFieldGmlId.backgroundColor='white';
    textFieldGmlId.setEditable(false);
    scrollview.add(textFieldGmlId);

	/*
	 * 6. DATA CERTAINITY
	 
	top += posun;
	textFieldCrtn = new TextField(select.fieldByName('crtn'));

	textFieldCrtn.left = left;
	textFieldCrtn.top = top;
	textFieldCrtn.setEditable(false);
    textFieldCrtn.backgroundColor='white';
	if (myNickname == select.fieldByName('uid')) {
		readdEventListener(textFieldCrtn, "click", function () {
			var dataListCrtn = ['high', 'medium', 'low', 'unknown'];
			var site_crtn_list = new List("", dataListCrtn, function (evt) {
					site_crtn_window.close();
					var selectedIndex = evt.source.selectedIndex;
					textFieldCrtn.setValue(dataListCrtn[evt.itemIndex]);
				}, function (dataItem, menuListView) {

					//dataItem.title.backgroundColor= '#3C4037';
					dataItem.title.color = '#3C4037';
					dataItem.title.borderColor = '#3C4037';
					dataItem.title.backgroundColor = 'white';
					dataItem.title.borderWidth = 1;
					dataItem.title.left = '2%';
					dataItem.title.width = '96%';
					dataItem.title.textAlign = Ti.UI.TEXT_ALIGNMENT_CENTER;
				});

			var site_crtn_window = new Window("Select certainity: ");
			site_crtn_window.open();
			site_crtn_window.add(site_crtn_list);
		});
	}

	scrollview.add(textFieldCrtn);
*/
	/*
	 * END OF THE EDITOR WINDOW
	 */

}


function eventListenerCameraPhotoDone() {
    var myCameraImage = new Camera(function (event) {
        
        fotilSom = true;
        imageNativePath = event.media.nativePath;
        cameraImageName = event.media.file.name;
        cameraOriginalImage = event.media;
        cameraRotatedImage = rotateAndResize(cameraOriginalImage, 450, 100);
        
        try{
            myImage.setImage(cameraRotatedImage); 
            myImage.setProps({
                myImagePath:imageNativePath
            });
        }catch(e){}
        
        photoWindowImage.setImage(cameraRotatedImage);
        myImagePath = imageNativePath;
        imagePathLocal=imageNativePath;
        
        var db = Ti.Database.open(menoDatabazy);
        
        var sqlString = "UPDATE annotations SET image='%1',imageDeviceId='%3', imagePathLocal='%2', imagePathServer='' WHERE id='" + currentFeatIdIn + "'";
        
        sqlString = formatString(sqlString, [cameraImageName, imagePathLocal, myDeviceId]); 
        
        divider("SQL");
        //console.log(sqlString);
        
        db.execute(sqlString);
        
        db.close();
        
    });
}


function eventListenerMainWindowScrollViewScrollDo(e) {
	if (e.source.contentOffset.y != MainWindowScrollTopLast) {
		MainWindowScrollTopLast = e.source.contentOffset.y;
		//console.log(MainWindowScrollTopLast);
	}

}

function eventListenerClickPushViewLabelTerms(e){    
    var TermsWindowWebView = Ti.UI.createWebView({
        left : 0,
        top : 0,
        right : 0,
        bottom : 0,
        width : '100%',
        height : '100%',
        borderRadius : 1,
        enableZoomControls : false, // Android only
        url : '/HTML/terms/index.html',
        setWebContentsDebuggingEnabled : true
    });
    TermsWindow.open();
    TermsWindow.add(TermsWindowWebView);            
}

function eventListenerTermsWindowOpen(){
    TermsWindow.activity.actionBar.hide();
}

/* ***************************** *
 * ******** FUNCTIONS ********** *
 * ***************************** */

function changeUser(loginUser) {
	var url = 'http://bolegweb.geof.unizg.hr/mobileWFS/api/login.php';
	var xhr = Ti.Network.createHTTPClient();
	try {

		xhr.open('GET', url, true);
		xhr.send({
			user : loginUser
		});

	} catch (e) {
		alert(e); // no network? other errors
	}

    divider();
    //console.log("==== PREPARING FOR : STATUS 200 ======");
    
	xhr.onreadystatechange = function () {
		
		if (xhr.readyState == 4) {
			
			if (xhr.status == 200) {
				divider();
				//console.log("==== STATUS 200 ======");
				
				var res = xhr.responseText;
				
				//Ti.api.info(res);
				try {
					var obj = JSON.parse(res);

					if (obj.error) {
						alert(obj.error);
					} else {
						labelUser.text = "User: " + obj.user + '#' + obj.uid;
						alert('Sucessfully logged in. Your nickname is: ' + obj.user + '#' + obj.uid);
						myNickname = obj.user + '#' + obj.uid;
						Ti.App.Properties.setString('myNickname', myNickname);
						// refresh observations on MainWindow
                        redrawObservationsToMainWindow();
                        drawPushWindow();
                        pushRemoveIfNeeded();
					}

				} catch (e) {

					alert('NO VALID JSON');
					//Ti.api.info(url);
					//Ti.api.info(xhr.responseText);
				}
				xhr.onreadystatechange = null;
			}
		}
	};

	xhr.onerror = function (e) {
		// should do something more robust
		alert('Whoops...something is wrong check URL you entered. Error details: ' + e.error);
	};

	return xhr;
}

function changeServer(srv) {

	labelServer.text = srv;
	endpointURL = srv;
	Ti.App.Properties.setString('endpointURL', srv);

	return true;
}

function fieldSiteDescription() {
	new AlertInput("Enter the description of the site here: ", function (e) {
		if (e.index == 0) {
			// OK clicked, try to login
			changeUser(e.source.androidView.value);
		}

	});
}

// FUNCTION INSERTING OBSERVATIONS OBSERVED BY GNSS SENSOR INTO THE APP DATABASE
function addGPS(evt) {
	if (Ti.Geolocation.locationServicesEnabled) {
		Ti.Geolocation.purpose = 'Get Current Location';
		Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_BEST;
		Ti.Geolocation.distanceFilter = 2;
		Ti.Geolocation.preferredProvider = Ti.Geolocation.PROVIDER_GPS;
		Titanium.Geolocation.getCurrentPosition(function (e) {
			if (e.error) {
				Ti.API.error('Error: ' + e.error);
			} else {
				// VARIABLES FOR INSERT INTO DB
				var lat = e.coords.latitude;
				var lon = e.coords.longitude;
				var alt = e.coords.altitude;
				var acc = e.coords.accuracy;
				var spe = e.coords.speed;
				var tim = e.coords.timestamp;
				var ala = e.coords.altitudeAccuracy;
				var gmlID = 0;
				var serviceType = default_plnt_name;
				//var photo = '';
				//var obs_date = dateTime(true);
				var uid = myNickname;
				spl = uid.split("#");
				var uidText = spl[0];
				//var crtn = '';
				//var site_conf = '';
				//var site_descr = '';
				var db = Ti.Database.open(menoDatabazy);
				db.execute("INSERT INTO annotations (id, lat, lon, acc, alt, ala, featureType, endpointURL, gmlID, uid, serviceType) VALUES (" + featIdIn + "," + lat + "," + lon + "," + acc + "," + alt + "," + ala + ",'" + featureTYPE + "', '" + endpointURL + "', '" + gmlID + "', '" + uidText + "', '"+ serviceType +"') ");
				db.close();
				featIdIn = featIdIn + 1;
				buttonLocalDataFunc();
				var centerMap = 'zoomOnGPS(' + lon + ',' + lat + ');';
				Ti.App.fireEvent('app:fromTitanium', {
					message : centerMap
				});
				// refresh observations on MainWindow
				redrawObservations();
			}
		});

	} else {
		alert('Please enable location services');
	}
}


Ti.Geolocation.Android.manualMode=true;

gpsProvider = Ti.Geolocation.Android.createLocationProvider({
    name: Ti.Geolocation.PROVIDER_GPS,
    minUpdateTime: 10, 
    minUpdateDistance: 1
});
Ti.Geolocation.Android.addLocationProvider(gpsProvider);

netProvider = Ti.Geolocation.Android.createLocationProvider({
    name: Ti.Geolocation.PROVIDER_NETWORK,
    minUpdateTime: 10, 
    minUpdateDistance: 1
});
Ti.Geolocation.Android.addLocationProvider(netProvider);

var gpsRule = Ti.Geolocation.Android.createLocationRule({
    provider: Ti.Geolocation.PROVIDER_GPS,
    // Updates should be accurate to 100m
    accuracy: 100,
    // Updates should be no older than 1m
    maxAge: 60000,
    // But  no more frequent than once per 1 seconds
    minAge: 1000
});
Ti.Geolocation.Android.addLocationRule(gpsRule);

var netRule = Ti.Geolocation.Android.createLocationRule({
    provider: Ti.Geolocation.PROVIDER_NETWORK,
    // Updates should be accurate to 100m
    accuracy: 100,
    // Updates should be no older than 1m
    maxAge: 60000,
    // But  no more frequent than once per 1 seconds
    minAge: 1000
});
Ti.Geolocation.Android.addLocationRule(netRule);
       
function locate(evt) {
	if (Ti.Geolocation.locationServicesEnabled) {
	    
		Titanium.Geolocation.getCurrentPosition(function (e) {
			if (e.error) {
				Ti.API.error('Error: ' + e.error);
			} else {
				var lat = e.coords.latitude;
				var lon = e.coords.longitude;
				var alt = e.coords.altitude;
				var centerMap = 'showMyPosition(' + lon + ',' + lat + ');';
				Ti.App.fireEvent('app:fromTitanium', {
					message : centerMap
				});

			}
		});

	} else {
		alert('Please enable location services');
	}

}

function addManually(evt) {

	if (manualModEnabled == 1) {
		//$.addManually.setTitle("INSERT");
		manualModEnabled = 0;
		var insertDisable = 'insertDisable();';
		Ti.App.fireEvent('app:fromTitanium', {
			message : insertDisable
		});
		MapWindow.remove(insertIconImageView);

	} else {
		//$.addManually.setTitle("CANCEL");
		manualModEnabled = 1;
		var insertEnable = 'insertEnable();';
		if(mapDownloadEnabled)
        {
            insertIconImageView.bottom = 25;
        }
        else
        {
            insertIconImageView.bottom = 0;
        }
		MapWindow.add(insertIconImageView);
		Ti.App.fireEvent('app:fromTitanium', {
			message : insertEnable
		});
	}

};

function toggleMapDownloadEnabled(){
    if(mapDownloadEnabled)
    {
        mapDownloadEnabled=false; 
        
        MapWindow.remove(mapDownloadOverlay); 
        mapDownloadOverlay=null;
        
        if (manualModEnabled == 1) {
            insertIconImageView.bottom = 0;
        }
    }
    else
    {
        mapDownloadEnabled=true;
        
        mapDownloadOverlay = new Label("Capturing the map - it will be available for offline use");
        mapDownloadOverlay.bottom=0;
        mapDownloadOverlay.left=0;
        mapDownloadOverlay.right=0;
        mapDownloadOverlay.height=25;
        mapDownloadOverlay.backgroundColor='red';
        mapDownloadOverlay.color='white';
        mapDownloadOverlay.textAlign = Ti.UI.TEXT_ALIGNMENT_CENTER;
        mapDownloadOverlay.font={ fontSize: 12, fontWeight: 'bold'};
        
        
        
        MapWindow.add(mapDownloadOverlay);
        
        if (manualModEnabled == 1) {
            insertIconImageView.bottom = 25;
        }
    }
    
}

function rotateAndResize(media, width, quality) {

	// Create file to store photo.
	var dataDirectory = Ti.Filesystem.getApplicationDataDirectory();
	var fileName = String.format('Proplant_%s.jpg', dateTime().replace(" ", "_").replace(":", "h") + "m");
	var file = Ti.Filesystem.getFile(dataDirectory, fileName);
	var fileNativePath = file.nativePath;

	// Write media to file.
	file.write(media);
	file = null;

	// Rotate photo in file, resize, and adjust quality.
	utilsModule.rotateResizeImage(fileNativePath, width || 640, quality || 80);

	// Get new and improved media out of file.
	media = Ti.Filesystem.getFile(fileNativePath);

	return media;
}

function readdEventListener(obj, type, instance) {
	try {
		obj.removeEventListener(type, instance);
	} catch (e) {}
	obj.addEventListener(type, instance);
};

function selectedObservationsToBoxes(select, noDataText, kind) {
	if (!select.rowCount) {
		var i = 0;
		var observation1 = Ti.UI.createView({
				width : '90%',
				height : 60,
				left : '5%',
				top : observationsTop,
				backgroundColor : 'white',
				borderRadius:5
			});
		MainWindowScrollView.add(observation1);
		observationObjects[i] = observation1;

		observationsTop += 80;

		var observation1pasik = Ti.UI.createView({
				top : 0,
				width : '100%',
				height : 5,
				backgroundColor : obsColor
			});
		observation1.add(observation1pasik);

		var observation1type = new Label(noDataText);
		observation1type.height = 24;
		observation1type.top = 15;
		observation1type.left = 10;
		observation1type.color = "#283618";
		observation1type.font = {
			fontWeight : 'bold'
		};
		observation1.add(observation1type);
	}
	while (select.isValidRow()) {
		var i = select.fieldByName('id');

		var observation1 = Ti.UI.createView({
				width : '90%',
				height : 180,
				left : '5%',
				top : observationsTop,
				backgroundColor : 'white',
				borderRadius:5
			});

		MainWindowScrollView.add(observation1);
		observationObjects[i] = observation1;

		observationsTop += 200;

		var observation1pasik = Ti.UI.createView({
				top : 0,
				width : '100%',
				height : 5,
				backgroundColor : obsColor
			});
		observation1.add(observation1pasik);

		var observation1type = new Label("Data collection");
		observation1type.width = 130;
		observation1type.height = 24;
		observation1type.top = 15;
		observation1type.left = 10;
		observation1type.color = "#283618";
		observation1type.font = {
			fontWeight : 'bold'
		};
		observation1.add(observation1type);

		var observation1date = new Label(select.fieldByName('obs_date'));
		//var observation1date = new Label(select.fieldByName('uid'));
		observation1date.width = 180;
		observation1date.height = 24;
		observation1date.textAlign = Ti.UI.TEXT_ALIGNMENT_RIGHT;
		observation1date.top = 8;
		observation1date.right = 10;
		observation1date.font = {
			fontSize : 11,
			fontWeight : 'bold'
		};
		observation1.add(observation1date);

		var crtn = select.fieldByName('crtn');
		if (crtn == "") {
			crtn = "no";
		}

		var crtnColor = "#DCDCDC";
		if (crtn == "unknown") {
			crtnColor = "#8D66BF";
		}
		if (crtn == "low") {
			crtnColor = "#EFD300";
		}
		if (crtn == "medium") {
			crtnColor = "#FFAB52";
		}
		if (crtn == "high") {
			crtnColor = "#7CBF66";
		}

		var observation1crtn = new Label(crtn + ' certainity');
		observation1crtn.width = 180;
		observation1crtn.height = 24;
		observation1crtn.textAlign = Ti.UI.TEXT_ALIGNMENT_RIGHT;
		observation1crtn.top = 20;
		observation1crtn.right = 10;
		observation1crtn.color = crtnColor;
		observation1crtn.font = {
			fontSize : 11,
			fontWeight : 'bold'
		};
		observation1.add(observation1crtn);

		var observation1latitude = new Label("Latitude:    " + select.fieldByName('lat'));
		observation1latitude.height = 24;
		observation1latitude.textAlign = Ti.UI.TEXT_ALIGNMENT_LEFT;
		observation1latitude.top = 65;
		observation1latitude.left = 10;
		observation1latitude.font = {
			fontSize : 16
		};
		observation1.add(observation1latitude);

		var observation1longitude = new Label("Longitude: " + select.fieldByName('lon'));
		observation1longitude.height = 24;
		observation1longitude.textAlign = Ti.UI.TEXT_ALIGNMENT_LEFT;
		observation1longitude.top = 85;
		observation1longitude.left = 10;
		observation1longitude.font = {
			fontSize : 16
		};
		observation1.add(observation1longitude);

		var observation1plantName = new Label(select.fieldByName('serviceType'), null, 10);
		observation1plantName.height = 19;
		observation1plantName.textAlign = Ti.UI.TEXT_ALIGNMENT_LEFT;
		observation1plantName.top = 40;
		observation1plantName.left = 10;
		observation1plantName.width = '95%';
		observation1plantName.font = {
			fontSize : 14,
			fonWeight : 'bold'
		};
		observation1.add(observation1plantName);

		var observation1delete = new Image("/images/drawable-xxhdpi/ic_delete_forever_black_48dp.png", function (evt) {

				if (kind == "new") {
					var deleteTxt = "Delete this new record from local database";
				}
				if (kind == "upd") {
					var deleteTxt = "Do not push this update to server and mark as 'not changed'?";
				}
				if (kind == "del") {
					var deleteTxt = "Cancel removal of this record from database?";
				}
				var dialog = Ti.UI.createAlertDialog({
						cancel : 1,
						buttonNames : ['Confirm', 'Cancel'],
						message : deleteTxt,
						title : 'Please confirm'
					});

				dialog.addEventListener('click', function (e) {
					if (e.index === e.source.cancel) {
						//Ti.api.info('The cancel button was clicked');
					} else {
						var chldrn = MainWindowScrollView.children;
						var deleteID = evt.source.deleteID;
						var db = Ti.Database.open(menoDatabazy);
						if (kind == "new") {
							db.execute('DELETE FROM annotations WHERE id=' + deleteID);
						}
						if (kind == "upd") {
							db.execute('UPDATE annotations SET mark_for_push=0 WHERE id=' + deleteID);
						}
						if (kind == "del") {
							db.execute('UPDATE annotations SET mark_for_del=0 WHERE id=' + deleteID);
						}
						db.close();
						
                        var pasikColor="black";
                        var pasikText="No new data has been collected";
						var lcr = false;
                        var viewFound = false;
                        var viewFoundIndex = 0;
						for (i = 0; i < chldrn.length; i++) {
							if (viewFound) {
								var posun = 200;
								if(lcr){ posun -= 60;}
								var animation = Titanium.UI.createAnimation();
								animation.top = chldrn[i].top - posun;
								animation.duration = 333;
								chldrn[i].animate(animation);
							}
							if (chldrn[i] == evt.source.getParent()) {
								viewFound = true;
								viewFoundIndex = i;
								if(chldrn[viewFoundIndex-2].html==labelObservationsNewText || chldrn[viewFoundIndex-2].html==labelObservationsUpdText || chldrn[viewFoundIndex-2].html==labelObservationsRemText)
								{
								    if(chldrn[viewFoundIndex+1] === undefined)
                                    {
                                        // last child of Removed observations
                                        lcr = true;
                                        pasikColor = "#FF0000";
                                        var pasikText="No data has been marked for removal";
                                    }
                                    else
                                    {
                                        if(chldrn[viewFoundIndex+1].html == labelObservationsUpdText)
                                        {
                                            // last child of New observations
                                            lcr = true;  
                                            pasikColor = "#00A20B"; 
                                            var pasikText="No new data has been collected";
                                        }
                                        if(chldrn[viewFoundIndex+1].html == labelObservationsRemText)
                                        {
                                            // last child of Updated observations
                                            lcr = true; 
                                            pasikColor = "#FFD600";
                                            var pasikText="No data has been marked for update";
                                        }
                                    }
								}
							}
						}
						evt.source.getParent().getParent().remove(evt.source.getParent());
						drawPushWindow();
						
						// case: Last Child Removed
						if(lcr)
						{
						    divider();
                            //console.log("This was last child removed !!!");	

                            var i = 0;
                            var observation1 = Ti.UI.createView({
                                    width : '90%',
                                    height : 60,
                                    left : '5%',
                                    top : chldrn[viewFoundIndex].top,
                                    backgroundColor : 'white',
                                    borderRadius:5
                                });
                            MainWindowScrollView.add(observation1);
                            observationObjects[i] = observation1;
                    
                            observationsTop += 80;
                    
                            var observation1pasik = Ti.UI.createView({
                                    top : 0,
                                    width : '100%',
                                    height : 5,
                                    backgroundColor : pasikColor
                                });
                            observation1.add(observation1pasik);
                    
                            var observation1type = new Label(pasikText);
                            observation1type.height = 24;
                            observation1type.top = 15;
                            observation1type.left = 10;
                            observation1type.color = "#283618";
                            observation1type.font = { fontWeight : 'bold' };
                            observation1.add(observation1type);				    
						
						  // observations push box - remove if no longer needed
						  pushRemoveIfNeeded();
						  
						}
						
					}
				});
				dialog.show();
			});
		observation1delete.deleteID = i;
		observation1delete.width = 48;
		observation1delete.height = 48;
		observation1delete.bottom = 10;
		observation1delete.right = 10;
		observation1.add(observation1delete);

		var observation1view = new Image("/images/drawable-xxhdpi/ic_language_black_48dp.png", function (evt) {
				activityIndicator.show();
				buttonLocalDataFunc(evt);
				zoomTo.lat = evt.source.lat;
				zoomTo.lon = evt.source.lon;
				eventFromButton = true;
				readdEventListener(MapWindow, 'open', eventListenerMapWindowZoomButton);
			});
		observation1view.lat = select.fieldByName('lat');
		observation1view.lon = select.fieldByName('lon');
		observation1view.width = 48;
		observation1view.height = 48;
		observation1view.bottom = 10;
		observation1view.right = 10 + 48 + 10;
		observation1.add(observation1view);

		var observation1edit = new Image("/images/drawable-xxhdpi/ic_format_line_spacing_black_48dp.png", function (evt) {
				activityIndicator.show();
				var e = {};
				e.message = evt.source.editID;
				e.doNotInvokeMap = true;
				eventListenerFromWebView(e);
			});
		observation1edit.editID = i;
		observation1edit.width = 48;
		observation1edit.height = 48;
		observation1edit.bottom = 10;
		observation1edit.right = 10 + 48 + 10 + 48 + 10;
		observation1.add(observation1edit);

		var observation1img = new Image("/images/drawable-xxhdpi/ic_image_black_48dp.png",openImagePreview);
			
			
			
		observation1img.width  = 48;
		observation1img.height = 48;
		observation1img.bottom = 10;
		observation1img.right  = 10 + 48 + 10 + 48 + 10 + 48 + 10;
		//observation1.add(observation1img);

		select.next();
        
	};
	
}

function eventListenerPhotoWindowOpened()
{
    photoWindow.activity.actionBar.hide();
}

function bytesToHuman(size)
{
    var Kb = 1  * 1024;
    var Mb = Kb * 1024;
    var Gb = Mb * 1024;
    var Tb = Gb * 1024;
    var Pb = Tb * 1024;
    var Eb = Pb * 1024;

    if (size <  Kb)                 return Math.round(size     ) + " byte";
    if (size >= Kb && size < Mb)    return Math.round(size / Kb) + " Kb";
    if (size >= Mb && size < Gb)    return Math.round(size / Mb) + " Mb";
    if (size >= Gb && size < Tb)    return Math.round(size / Gb) + " Gb";
    if (size >= Tb && size < Pb)    return Math.round(size / Tb) + " Tb";
    if (size >= Pb && size < Eb)    return Math.round(size / Pb) + " Pb";
    if (size >= Eb)                 return Math.round(size / Eb) + " Eb";

    return "???";
}
            
function pushRemoveIfNeeded(){
    var myNicknameText = myNickname.split("#");
        myNicknameText = myNicknameText[0];
    var db = Ti.Database.open(menoDatabazy);
    var select = db.execute('SELECT * from annotations WHERE uid=\''+myNicknameText+'\' AND (gmlID=0 OR mark_for_push=1 OR mark_for_del=1) ');
    db.close();
    
    if( !select.rowCount )
    {
        pushView.top=-1000;
        observationsInitialOffset = 0;
        redrawObservations();
    }
  }

function drawPushWindow(){
    // clear window before append    
    var pChldrn =pushView.children;
    for(i=0; i<pChldrn.length; i++)
    {
        try{ pushView.remove(pChldrn[i]); }catch(e){
            //console.log(pChldrn[i]);
        }        
    } 
        
    pushView.backgroundColor='white';
    pushView.layout='horizontal';
    pushView.borderRadius=5;
    pushView.top = 220;
    pushView.height=340;
    
    // append objects
    var pushViewPasik;
    pushViewPasik = Ti.UI.createView({ top : 0, left: 0, width : '25%', height : 5, backgroundColor : '#00A20B' });
    pushView.add(pushViewPasik);
    pushViewPasik = Ti.UI.createView({ top : 0, left: '25%', width : '25%', height : 5, backgroundColor : '#FFD600' });
    pushView.add(pushViewPasik);
    pushViewPasik = Ti.UI.createView({ top : 0, left: '50%', width : '25%', height : 5, backgroundColor : '#FF0000' });
    pushView.add(pushViewPasik);
    pushViewPasik = Ti.UI.createView({ top : 0, left: '75%', width : '25%', height : 5, backgroundColor : 'blue' });
    pushView.add(pushViewPasik);
    
    var pushViewFromTop = 10;
    var pushViewLabelHeader = new Label("Push data to server");
    pushViewLabelHeader.top= pushViewFromTop; 
    pushViewLabelHeader.left= 10; 
    pushViewLabelHeader.right= 10; 
    pushViewLabelHeader.height= 30; 
    pushViewLabelHeader.font={ fontSize:20 };                 
    // pushViewLabelHeader.backgroundColor= "red";             
    pushView.add(pushViewLabelHeader);
    
    var myNicknameText = myNickname.split("#");
        myNicknameText = myNicknameText[0];
    var db = Ti.Database.open(menoDatabazy);
    var select = db.execute('SELECT * from annotations WHERE uid=\''+myNicknameText+'\' AND gmlID=0 ');
    db.close();
    
    pushViewFromTop += 5 +pushViewLabelHeader.height;
    var pushViewLabelCountNew = new Label("<font color='#00A20B' size='30'>•</font> "+select.rowCount+" new observations ");
    pushViewLabelCountNew.top= pushViewFromTop; 
    pushViewLabelCountNew.left= 10 + 15; 
    pushViewLabelCountNew.right= 10; 
    pushViewLabelCountNew.height= 24; 
    pushViewLabelCountNew.font={ fontSize:16 };                 
    // pushViewLabelCountNew.backgroundColor= "red";             
    pushView.add(pushViewLabelCountNew);
    
    var db = Ti.Database.open(menoDatabazy);
    var select = db.execute('SELECT * from annotations WHERE uid=\''+myNicknameText+'\' AND mark_for_push=1 ');
    db.close();
    
    pushViewFromTop += 5 +pushViewLabelCountNew.height;
    var pushViewLabelCountUpd = new Label("<font color='#FFD600' size='30'>•</font> "+select.rowCount+" updated observations ");
    pushViewLabelCountUpd.top= pushViewFromTop; 
    pushViewLabelCountUpd.left= 10 + 15; 
    pushViewLabelCountUpd.right= 10; 
    pushViewLabelCountUpd.height= 24; 
    pushViewLabelCountUpd.font={ fontSize:16 };                 
    // pushViewLabelCountUpd.backgroundColor= "red";             
    pushView.add(pushViewLabelCountUpd);
    
    var db = Ti.Database.open(menoDatabazy);
    var select = db.execute('SELECT * from annotations WHERE uid=\''+myNicknameText+'\' AND mark_for_del=1 ');
    db.close();
    
    pushViewFromTop += 5 +pushViewLabelCountUpd.height;
    var pushViewLabelCountRem = new Label("<font color='#FF0000' size='30'>•</font> "+select.rowCount+" removed observations ");
    pushViewLabelCountRem.top= pushViewFromTop; 
    pushViewLabelCountRem.left= 10 + 15;
    pushViewLabelCountRem.right= 10; 
    pushViewLabelCountRem.height= 24; 
    pushViewLabelCountRem.font={ fontSize:16 };                 
    // pushViewLabelCountRem.backgroundColor= "red";             
    pushView.add(pushViewLabelCountRem);
        
    var db = Ti.Database.open(menoDatabazy);
    var select = db.execute('SELECT * from annotations WHERE uid=\''+myNicknameText+'\' AND imageDeviceId=\''+myDeviceId+'\' AND imagePathLocal!=\'\' AND imagePathLocal!=\'null\' AND (imagePathServer=\'\' OR imagePathServer=\'null\') ');
    db.close();
    
    pushViewFromTop += 5 +pushViewLabelCountRem.height;
    var pushViewLabelCountPhotos = new Label("<font color='blue' size='30'>•</font> "+select.rowCount+" photos created ");
    pushViewLabelCountPhotos.top= pushViewFromTop; 
    pushViewLabelCountPhotos.left= 10 + 15;
    pushViewLabelCountPhotos.right= 10; 
    pushViewLabelCountPhotos.height= 24; 
    pushViewLabelCountPhotos.font={ fontSize:16 };                 
    // pushViewLabelCountPhotos.backgroundColor= "red";             
    pushView.add(pushViewLabelCountPhotos);
    
    pushViewFromTop += 5 +pushViewLabelCountPhotos.height;
    var pushViewLabelTerms = new Label("<strong>You agree with our Terms and conditions</strong> (tap to read)");
    pushViewLabelTerms.top= pushViewFromTop; 
    pushViewLabelTerms.left= 10;
    pushViewLabelTerms.right= 10; 
    pushViewLabelTerms.height= 48; 
    pushViewLabelTerms.font={ fontSize:16 };                 
    // pushViewLabelTerms.backgroundColor= "red";    
    pushView.add(pushViewLabelTerms);                
    readdEventListener(pushViewLabelTerms, 'click', eventListenerClickPushViewLabelTerms);
    
    var pushViewButtonDiscard = new Button("Discard all", function(){
        var dialog = Ti.UI.createAlertDialog({
                cancel : 1,
                buttonNames : ['Yes', 'No'],
                message : 'Do you want to discard your edits?',
                title : 'Discarting your edits...'
            });
        dialog.addEventListener('click', function (e) {
            if (e.index === e.source.cancel) {
                //Ti.api.info('The discard button was clicked');
            } else {
                //alert ('PUSHED DONT PUSH DATA BUTTON');
                var db = Ti.Database.open(menoDatabazy);
                db.execute('UPDATE annotations SET mark_for_push = 0, mark_for_del = 0');
                db.execute('DELETE from annotations WHERE gmlID= 0');
                db.close();
                
                redrawObservations();
                pushRemoveIfNeeded();
            }
        });
        dialog.show();

    });
    pushViewButtonDiscard.bottom=65;
    pushViewButtonDiscard.left = 10;
    pushViewButtonDiscard.width = '45%';
    pushViewButtonDiscard.backgroundColor = '#EEEEEE'; 
    pushViewButtonDiscard.color = '#B3B3B3'; 
    pushView.add( pushViewButtonDiscard );
    
    var pushViewButtonPush = new Button("Push all", function(){
        
        //alert ('PUSHED PUSH DATA BUTTON');
        var dialog = Ti.UI.createAlertDialog({
                cancel : 1,
                buttonNames : ['Confirm', 'Cancel'],
                message : 'Confirm or cancel?',
                title : 'Push all new, edited and/or deleted observations and photos to server?'
            });
            
            

        /* DO PUSH HERE */
        dialog.addEventListener('click', function (e) {
            toRefreshMainWindow = 0;
            //Ti.api.info("toRefreshMainWindow goes to ZERO");
        
            if (e.index === e.source.cancel) {
                //Ti.api.info('The cancel button was clicked');
            } else {
                
                
                /*
                 * TO BE DELETED PART
                 */
    
                // to be deleted = collect
                var myNicknameText = myNickname.split("#");
                myNicknameText = myNicknameText[0];
                var tbd = [];
                var tbdi = 0;
                var db = Ti.Database.open(menoDatabazy);
                var select = db.execute('SELECT * FROM annotations WHERE mark_for_del=1 AND uid=\''+myNicknameText+'\'');
                db.close();
                while (select.isValidRow()) {
                    spl = select.fieldByName('gmlID');
                    var iid = spl;
                    //var delID = select.fieldByName('id');
                    //var db = Ti.Database.open(menoDatabazy);
                    //db.execute("DELETE FROM annotations WHERE id='" + delID + "'");
                    //db.close();
                    var namespace = "http://www.schleidt.org/schemas/ugepix";  
                    var feature = {};
                    feature.type = "Feature";
                    feature.operation = "Delete";
                    feature.typenamespace = namespace;
                    feature.typename1 = "uge_pix";              
                    feature.properties1 = {};
                    feature.properties1.serid = select.fieldByName('codeSpace')+'-'+select.fieldByName('gmlID');
                    feature.typename2 = "ugs_govser";
                    feature.properties2 = {};
                    feature.properties2.conid = select.fieldByName('codeSpace')+'-'+select.fieldByName('gmlID');
                    feature.typename3 = "bs2_contact";
                    feature.properties3 = {};
                    feature.properties3.conid = select.fieldByName('codeSpace')+'-'+select.fieldByName('gmlID');
                    tbd.push(feature);
                    select.next();
                    tbdi++;
                    i++;
                }
    
                if (tbdi) {
                    toRefreshMainWindow++; // reason for refresh later...
                    // to be deleted = do it!
                    var url = 'http://bolegweb.geof.unizg.hr/mobileWFS/api/push_del.php';
                    var xhr = Ti.Network.createHTTPClient();
                    try {
                        xhr.onreadystatechange = function () {
                            if (xhr.readyState == 4) {
                                if (xhr.status == 200) {
                                    //activityIndicator.hide();
                                    var res = xhr.responseText;
                                    //Ti.api.info(res);
                                    var obj = 0;
                                    try {
                                        obj = JSON.parse(res);
    
                                        //Ti.api.info(JSON.stringify(obj));
    
                                    } catch (e) {
                                        alert('NO VALID JSON (delete)');
                                        //Ti.api.info(url);
                                        //Ti.api.info(xhr.responseText);
                                    }
    
                                    if (obj != 0) {
                                        //alert('XHR passed...');
                                        if (obj == "deletedOK") {
                                            var db = Ti.Database.open(menoDatabazy);
                                            db.execute('DELETE FROM annotations WHERE mark_for_del = 1 AND uid=\''+myNicknameText+'\'');
                                            
                                            db.close();
                                            //loaderViewDataFunc();
                                            //Ti.api.info("toRefreshMainWindow if is true");
                                            //buttonAddToMapFunc();
                                            //loaderViewDataFunc();
                                            
                                            if(toRefreshMainWindow == 1)
                                            {
                                              toRefreshMainWindow=0;
                                                
                                              redrawObservations();
                                              pushRemoveIfNeeded();  
                                            }
                                            if(toRefreshMainWindow > 1)
                                            {
                                                toRefreshMainWindow--;
                                            }
                                            //alert("INSERT OK");
                                        } else {
                                            alert('You are offline or our server is unreachable, please retry later.');
                                        }
                                    }
                                    xhr.onreadystatechange = null;
                                }
                            }
                        };
                        xhr.onerror = function (e) {
                            // should do something more robust
                            alert('You are offline or our server is unreachable, please retry later.');
                        };
                        xhr.open('POST', url, true);
                        divider("POST JSON DATA TO BE DELETED");
                        console.log(tbd);
                        var params = {
                            user : myNickname,
                            json : tbd
                        };
    
                        xhr.send(params);
                    } catch (e) {
                        divider();
                        //console.log("************ CATCH ON ROW 2540 *****************");
                        alert(e);
                    }
                }
    
                /*
                 * TO BE UPDATED PART
                 */
    
                // to be udpated = collect markForPush
                var tbd = [];
                var tbdi = 0;
                var db = Ti.Database.open(menoDatabazy);
                var select = db.execute('SELECT * FROM annotations WHERE mark_for_push=1 AND gmlID!=0 AND uid=\''+myNicknameText+'\'');
                var selectCount = select.rowCount;
                while (select.isValidRow()) {
                    spl1 = myNickname.split("#");
                    var myPhotoName = dateTime(true).replace(/\s+/g, '_').replace(/:/g, '-'); 
                    //var iid = spl[1];
                    var pixlink = 'https://bolegweb.geof.unizg.hr/mobileWFS/photo/'+spl1[0]+'/'+myPhotoName+'.jpg';
                    var namespace = "http://www.schleidt.org/schemas/ugepix";    
                    var FeatureCollection = {};
                    FeatureCollection.type = "Feature";
                    FeatureCollection.operation = "Update";
                    FeatureCollection.typenamespace=namespace;
                    FeatureCollection.totalFeatures=selectCount;
                    FeatureCollection.features = [];
                    
                    var feature1 = {};
                    feature1.typename = "uge_pix";              
                    feature1.properties = {};
                    feature1.properties.pixlink = pixlink;
                    feature1.properties.serid = select.fieldByName('codeSpace')+'-'+select.fieldByName('gmlID');
                    feature1.properties.pixtext = select.fieldByName('imageText');
                    feature1.properties.deviceid = select.fieldByName('imageDeviceId');
                    feature1.properties.userid = select.fieldByName('uid');
                    
                    FeatureCollection.features.push(feature1);
                    
                    var feature2 = {};
                    feature2.typename = "ugs_govser";
                    feature2.geometry = {}; 
                    feature2.geometry.type = "Point";
                    feature2.geometry.coordinates = [];
                    feature2.geometry.coordinates.push(select.fieldByName('lon')); 
                    feature2.geometry.coordinates.push(select.fieldByName('lat'));
                    feature2.properties = {};
                    feature2.properties.name = select.fieldByName('serviceName');
                    feature2.properties.servicetype = select.fieldByName('serviceType');
                    feature2.properties.beginlifespan = select.fieldByName('obs_date');
                    feature2.properties.conid = select.fieldByName('codeSpace')+'-'+select.fieldByName('gmlID');
                    
                    FeatureCollection.features.push(feature2);
                    
                    
                    var feature3 = {};
                    feature3.typename = "bs2_contact";
                    feature3.properties = {};
                    feature3.properties.address = select.fieldByName('serviceAddress');
                    feature3.properties.conid = select.fieldByName('codeSpace')+'-'+select.fieldByName('gmlID');
                    
                    FeatureCollection.features.push(feature3);
                    
                    
                    tbd.push(FeatureCollection);
                    select.next();
                    tbdi++;
                    //i++;
                }
                db.close();
    
                if (tbdi) {
                    toRefreshMainWindow++; // reason for refresh later...
                    // to be updated = do it!
                    var url = 'http://bolegweb.geof.unizg.hr/mobileWFS/api/push_upd.php';
                    var xhr = Ti.Network.createHTTPClient();
                    try {
                        xhr.onreadystatechange = function () {
                            if (xhr.readyState == 4) {
                                if (xhr.status == 200) {
                                    //activityIndicator.hide();
                                    var res = xhr.responseText;
                                    //Ti.api.info(res);
                                    var obj = 0;
                                    try {
                                        obj = JSON.parse(res);
    
                                    } catch (e) {
                                        alert('NO VALID JSON (update)');
                                    }
    
                                    if (obj != 0) {
                                        //alert(obj);
                                        if (obj == "updatedOK") {
                                            var db = Ti.Database.open(menoDatabazy);
                                            //db.execute('DELETE FROM annotations WHERE mark_for_push = 1 AND uid=\''+myNickname+'\'');
                                            // raholl fix 1.6.2016 00:19 
                                            // instead of delete we need to update, because there is bug later with photos uploading due to deletion!
                                            
                                            // no a to je lepsie ale tiez ne dobre:
                                            // TU SA MUSI LEN TA JEDNA ZRUSIT HENTO ZRUSI SECKY
                                            // WHERE ID by to chcelo
                                            // a tu hore bude aj to NEW taky isty problem
                                            db.execute('UPDATE annotations SET mark_for_push=0 WHERE mark_for_push = 1 AND uid=\''+myNicknameText+'\'');
                                            divider('UPDATE annotations SET mark_for_push=0 WHERE mark_for_push = 1 AND uid=\''+myNicknameText+'\'');
                                            db.close();
                                            //loaderViewDataFunc();
                                            //Ti.api.info("toRefreshMainWindow if is true");
                                            //buttonAddToMapFunc();
                                            //loaderViewDataFunc();
                                            if(toRefreshMainWindow == 1)
                                            {
                                              toRefreshMainWindow=0;
                                                
                                              redrawObservations();
                                              pushRemoveIfNeeded();  
                                            }
                                            if(toRefreshMainWindow > 1)
                                            {
                                                toRefreshMainWindow--;
                                            }
                                            //alert("INSERT OK");
                                            
                                        } else {
                                            alert('You are offline or our server is unreachable, or there was an error during DB update, please retry later, or contact app administrator.');
                                        }
                                    }
                                    xhr.onreadystatechange = null;
                                }
                            }
                        };
                        xhr.onerror = function (e) {
                            // should do something more robust
                            alert('You are offline or our server is unreachable, please retry later.');
                        };
                        xhr.open('POST', url, true);
                        divider("POST JSON DATA TO BE UPDATED");
                        console.log(tbd);
                        var params = {
                            user : myNickname,
                            json : tbd
                        };
    
                        xhr.send(params);
                    } catch (e) {
                         divider();
                        console.log("************ CATCH ON ROW 3340 *****************");
                        alert(e);
                    }
                }
                
                /*
                 * TO BE INSERTED PART
                 */
    
                // to be inserted = collect markForPush
                var tbd = [];
                var tbdi = 0;
                var db = Ti.Database.open(menoDatabazy);
                var select = db.execute('SELECT * FROM annotations WHERE gmlID=0 AND uid=\''+myNicknameText+'\'');
                while (select.isValidRow()) {
                    spl1 = myNickname.split("#");
                    var myPhotoName = dateTime(true).replace(/\s+/g, '_').replace(/:/g, '-');
                    var uuid = Ti.Platform.createUUID();
                    var conid = myNicknameText+'-'+select.fieldByName('id')+'-'+uuid; 
                    //var iid = spl[1];
                    var pixlink = 'https://bolegweb.geof.unizg.hr/mobileWFS/photo/'+spl1[0]+'/'+myPhotoName+'.jpg';
                    var namespace = "http://www.schleidt.org/schemas/ugepix";    
                    var FeatureCollection = {};
                    FeatureCollection.type = "Feature";
                    FeatureCollection.operation = "Insert";
                    FeatureCollection.typenamespace=namespace;
                    FeatureCollection.totalFeatures=selectCount;
                    FeatureCollection.features = [];
                    
                    var feature1 = {};
                    feature1.typename = "bs2_contact";
                    feature1.properties = {};
                    feature1.properties.address = select.fieldByName('serviceAddress');
                    feature1.properties.conid = conid;
                    feature1.properties.gmlid = conid;
                    
                    FeatureCollection.features.push(feature1);
                    
                    var feature2 = {};
                    feature2.typename = "ugs_govser";
                    feature2.geometry = {}; 
                    feature2.geometry.type = "Point";
                    feature2.geometry.coordinates = [];
                    feature2.geometry.coordinates.push(select.fieldByName('lon')); 
                    feature2.geometry.coordinates.push(select.fieldByName('lat'));
                    feature2.properties = {};
                    feature2.properties.name = select.fieldByName('serviceName');
                    feature2.properties.localid = select.fieldByName('id')+'-'+uuid;
                    feature2.properties.namespace = myNicknameText;
                    feature2.properties.servicetype = select.fieldByName('serviceType');
                    feature2.properties.beginlifespan = select.fieldByName('obs_date');
                    feature2.properties.conid = conid;
                    
                    FeatureCollection.features.push(feature2);
                    
                    var feature3 = {};
                    feature3.typename = "uge_pix";              
                    feature3.properties = {};
                    feature3.properties.pixlink = pixlink;
                    feature3.properties.serid = conid;
                    feature3.properties.pixtext = select.fieldByName('imageText');
                    feature3.properties.deviceid = select.fieldByName('imageDeviceId');
                    feature3.properties.userid = select.fieldByName('uid');
                    
                    FeatureCollection.features.push(feature3);
                               
                    tbd.push(FeatureCollection);
                    select.next();
                    tbdi++;
                    //i++;
                }
                db.close();
                
                if (tbdi) {
                    toRefreshMainWindow++; // reason for refresh later...
                    // to be inserted = do it!
                    var url = 'http://bolegweb.geof.unizg.hr/mobileWFS/api/push_ins.php';
                    
                    
                    divider();
                    //console.log("Navigating to URL: "+ url);
                    divider();
                    
                    //console.log("== pre-xhr");
                    var xhr = Ti.Network.createHTTPClient();
                    try {
                        //console.log("== pre-onreadystatechange");
                        xhr.onreadystatechange = function () {
                            //console.log("onreadystatechange");
                            
                            if (xhr.readyState == 4) {
                                //console.log("xhr.readyState == 4");
                                
                                if (xhr.status == 200) {
                                    //console.log("xhr.status == 200");
                                    
                                    //activityIndicator.hide();
                                    var res = xhr.responseText;
                                    //Ti.api.info(res);
                                    var obj = 0;
                                    try {
                                        obj = JSON.parse(res);
    
                                        //Ti.api.info("========================================================");
                                        //Ti.api.info(JSON.stringify(obj));
    
                                    } catch (e) {
                                        alert('NO VALID JSON (insert)');
                                        //Ti.api.info("========================================================");
                                        //Ti.api.info(url);
                                        //Ti.api.info(xhr.responseText);
                                    }
    
                                    if (obj != 0) {
                                        //alert(obj);
                                        //Ti.api.info("========================================================");
                                        //Ti.api.info(url);
                                        //Ti.api.info(xhr.responseText);
                                        
                                        if (obj == "insertOK") {
                                            //alert("INSERT OK")
                                            var db = Ti.Database.open(menoDatabazy);
                                            // toto je problem pri tej NEW ale pri tej update neni problem aj tak nejde
                                            // toto si tam pridaval recently nie?
                                            // ee to tam jhe odzacatku a odkedy mame fotky tak to robi problemy, lebo te fotky selektuju toto co sa maze
                                            // preto davam update namiesto mazania ale nepomohlo to takze to nerobi co ma alebo nevim
                                            // takze co nevim musim na vlak kureaw
                                            db.execute('DELETE FROM annotations WHERE gmlID = 0 AND uid=\''+myNicknameText+'\'');
                                            db.close();
                                            //loaderViewDataFunc();
                                            
                                            //Ti.api.info("toRefreshMainWindow if is true");
                                            //buttonAddToMapFunc();
                                            //loaderViewDataFunc();
                                            if(toRefreshMainWindow == 1)
                                            {
                                              toRefreshMainWindow=0;
                                                
                                              redrawObservations();
                                              pushRemoveIfNeeded();  
                                            }
                                            if(toRefreshMainWindow > 1)
                                            {
                                                toRefreshMainWindow--;
                                            }
                                            //alert("INSERT OK");
                                            
                                        } else {
                                            alert('You are either offline or our server is unreachable, or there was an error during DB update, please retry later, or contact app administrator.');
                                        }
                                        
                                    }
                                    xhr.onreadystatechange=null;
                                }
                            }
                        };
                        
                        //console.log("== pre-onerror");
                        xhr.onerror = function (e) {
                            // should do something more robust
                            alert('You are offline or our server is unreachable, please retry later.');
                        };
                        
                        //console.log("== pre-open");
                        xhr.open('POST', url, true);
                        divider("POST JSON DATA TO BE INSERTED");
                        console.log(tbd);
                        var params = {
                            //user : myNickname,
                            tbd : tbd
                        };
                        
                        //console.log("== pre-send");
                        xhr.send(params);
                    } catch (e) {
                         divider();
                        //console.log("************ CATCH ON ROW 2727 *****************");
                        //console.log(e);
                        alert(e);
                    }
                }
                
                /*
                 * PUSH PHOTOS TO SERVER
                 */
                
                pushOneImage();
                
                                    
                 
            }
            
        });
        dialog.show();
        
    });
    pushViewButtonPush.bottom=65;
    pushViewButtonPush.right = 10;
    pushViewButtonPush.width = '45%';
    pushViewButtonPush.backgroundColor = '#00A20B';
    pushView.add( pushViewButtonPush );
    
    var pushViewLabelInfoText = new Label("<cite>* you may review your data below this box before uploading.</cite>");
    pushViewLabelInfoText.bottom= 10; 
    pushViewLabelInfoText.left= 10;
    pushViewLabelInfoText.right= 10; 
    pushViewLabelInfoText.height= 48; 
    pushViewLabelInfoText.font={ fontSize:16 };                 
    // pushViewLabelInfoText.backgroundColor= "red";             
    pushView.add(pushViewLabelInfoText);
    
    observationsInitialOffset = pushView.height;
    
    //redrawObservations();
                
    
}

var photoWindowImage;
function openImagePreview(evt) {
    
    divider("openImagePreview");
    //console.log(evt);

    photoWindow = new Window("Image preview");
    photoWindow.open();
    
    try{
        photoWindowImage = new Image(rotateAndResize(Ti.Filesystem.getFile(evt.source.myProps.myImagePath), photoWindow.width, 100));
    }catch(e){
        photoWindowImage = new Image(evt.source.myProps.myImagePath, photoWindow.width, 100);
    }
    
    
    photoWindowImage.top=0;
    photoWindowImage.width='100%';
    photoWindow.add(photoWindowImage);
    
    var buttonNewPhoto = new Button(" ", eventListenerCameraPhotoDone);
    buttonNewPhoto.backgroundImage="/images/drawable-xxhdpi/ic_photo_camera_black_48dp.png";
    buttonNewPhoto.bottom=10;
    buttonNewPhoto.width=64;
    buttonNewPhoto.height=64;
    buttonNewPhoto.backgroundColor= "white";
    photoWindow.add(buttonNewPhoto);
    
    readdEventListener(photoWindow, 'open', eventListenerPhotoWindowOpened);
        
}

function openImagePreviewReadOnly(evt) {
    
    divider("openImagePreview");
    //console.log(evt);

    photoWindow = new Window("Image preview");
    photoWindow.open();
    
    try{
        photoWindowImage = new Image(rotateAndResize(Ti.Filesystem.getFile(evt.source.myProps.myImagePath), photoWindow.width, 100));
    }catch(e){
        photoWindowImage = new Image(evt.source.myProps.myImagePath, photoWindow.width, 100);
    }
    
    
    photoWindowImage.top=0;
    photoWindowImage.width='100%';
    photoWindow.add(photoWindowImage);
    
   
    
    readdEventListener(photoWindow, 'open', eventListenerPhotoWindowOpened);
        
}
