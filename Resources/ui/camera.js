function ApplicationCamera(callback) {
	var image;
	function getImage(){
		return image;
	}
	var hasCameraPermissions = Ti.Media.hasCameraPermissions();
	console.log('Ti.Media.hasCameraPermissions', hasCameraPermissions);
	
	if (hasCameraPermissions) {

		Titanium.Media.showCamera({
			success:function(event) {
				// called when media returned from the camera
				Ti.API.debug('Our type was: '+event.mediaType);
				if(event.mediaType == Ti.Media.MEDIA_TYPE_PHOTO) {
					image=event.media;
					if(typeof callback === 'function') { 
						callback(event); 
						console.log("EventListener :: onCameraImageDone :: callBack has been called !");
					}
					return image;
				} else {
					alert("Error: Only photos are allowed: type received: "+event.mediaType);
				}
			},
			cancel:function() {
				// called when user cancels taking a picture
			},
			error:function(error) {
				// called when there's an error
				var a = Titanium.UI.createAlertDialog({title:'Camera'});
				if (error.code == Titanium.Media.NO_CAMERA) {
					a.setMessage('Please run this test on device');
				} else {
					a.setMessage('Unexpected error: ' + error.code);
				}
				a.show();
			},
			saveToPhotoGallery:true,
		    // allowEditing and mediaTypes are iOS-only settings
			allowEditing:true,
			mediaTypes:[Ti.Media.MEDIA_TYPE_VIDEO,Ti.Media.MEDIA_TYPE_PHOTO]
		});
	}
	else
	{
		Ti.Media.requestCameraPermissions(function(e) {
			console.log('Ti.Media.requestCameraPermissions', e);
	
			if (e.success) {
	
				// Instead, probably call the same method you call if hasCameraPermissions() is true
				alert('You granted permission.');
	
			} else if (OS_ANDROID) {
				alert('You don\'t have the required uses-permissions in tiapp.xml or you denied permission for now, forever or the dialog did not show at all because you denied forever before.');
	
			} else {
	
				// We already check AUTHORIZATION_DENIED earlier so we can be sure it was denied now and not before
				alert('You denied permission.');
			}
		});
	}
	
	
}

//make constructor function the public component interface
module.exports = ApplicationCamera;