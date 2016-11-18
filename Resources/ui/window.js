//Application Window Component Constructor
function ApplicationWindow(title, exitOnClose, showIcons, showIconsCallback) {
    var spacer = "==========================================================================================";
    if(title === undefined) { title="Title_here"; }
	if(exitOnClose === undefined && exitOnClose!=true) { exitOnClose=false; }
	if(showIcons === undefined && showIcons!=true) { showIcons=false; }
	if(typeof showIconsCallback === 'function') {  }else{ showIconsCallback=function(){ alert("Default click"); }; }
	
	console.log(spacer);
	console.log("Opening window with title: "+title);
	console.log(spacer);
	
	//create component instance
	var self = Ti.UI.createWindow({
		//backgroundColor: '#B9E0AE',
		backgroundColor: '#56a8c4',
		font: {fontSize: 14, color: '#3C4037'},
		exitOnClose:exitOnClose,
        navBarHidden:true,
        fullscreen: true,
        activityEnterAnimation: Ti.Android.R.anim.slide_in_left,
        activityExitAnimation: Ti.Android.R.anim.slide_out_right,
        keepScreenOn: true // prevent display off
	});
	
	self.addEventListener("open", function() {
		actionBar = self.activity.actionBar; 
		actionBar.title=title; 
		
		if(showIcons)
		{
			self.activity.onCreateOptionsMenu = function(e) {
		        
		        var menuItem = e.menu.add({
		            title : "Delete",
		            showAsAction : Ti.Android.SHOW_AS_ACTION_ALWAYS,
		            icon:  '/images/drawable-xxhdpi/ic_delete_forever_white_48dp.png' 
		        });
		        menuItem.addEventListener("click", showIconsCallback);
		        
		        menuItem = e.menu.add({
		            title : "Save",
		            showAsAction : Ti.Android.SHOW_AS_ACTION_ALWAYS,
		            icon:  '/images/drawable-xxhdpi/ic_sd_card_white_48dp.png'
		        });
		       menuItem.addEventListener("click", showIconsCallback);
		       
		    };
		    self.activity.invalidateOptionsMenu();
		    console.log("EventListener :: onWindowOpened :: drawing menu icons");
		}
		
	    
		console.log("EventListener :: onWindowOpened ::");
	});
	
	return self;
}

//make constructor function the public component interface
module.exports = ApplicationWindow;