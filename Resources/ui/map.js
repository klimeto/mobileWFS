//Application Window Component Constructor
function ApplicationMap(callback) {
	// map
	var MapModule = require('ti.map');
	
	// check if its everything up-to-date...
	var rc = MapModule.isGooglePlayServicesAvailable();
	switch (rc) {
	    case MapModule.SUCCESS:
	        Ti.API.info('Google Play services is installed.');
	        break;
	    case MapModule.SERVICE_MISSING:
	        alert('Google Play services is missing. Please install Google Play services from the Google Play store.');
	        break;
	    case MapModule.SERVICE_VERSION_UPDATE_REQUIRED:
	        alert('Google Play services is out of date. Please update Google Play services.');
	        break;
	    case MapModule.SERVICE_DISABLED:
	        alert('Google Play services is disabled. Please enable Google Play services.');
	        break;
	    case MapModule.SERVICE_INVALID:
	        alert('Google Play services cannot be authenticated. Reinstall Google Play services.');
	        break;
	    default:
	        alert('Unknown Google Maps error. Try to update maps please...');
	}
	
	var map1 = MapModule.createView({
	    userLocation: true,
	    mapType: MapModule.HYBRID_TYPE,
	    animate: true,
	    region: {latitude: 48.139891674722094, longitude:17.126449048519135, latitudeDelta: 0.15, longitudeDelta: 0.15 },
	    height: '100%',
	    top: 0,
	    left: 0,
	    width: '100%'
	});
	
	var MapMoved = new Date().getTime();
	map1.addEventListener('regionchanged', function(e){
	    if( (new Date().getTime()) - MapMoved > 500 )
	    {
	    	MapMoved = new Date().getTime();
	    	console.log(e.type);
		    console.log(e.latitude + "," + e.longitude);
		    console.log(e.latitudeDelta + "," + e.longitudeDelta);	    	
	    }
	    
	});
	
	if(typeof callback === 'function') { 
		callback(map1); 
		console.log("EventListener :: onMapCreated :: callBack has been called !");
	} return map1;	
}

//make constructor function the public component interface
module.exports = ApplicationMap;