function ApplicationImageCropped(img, myWidthHeight, zoomLevel, callback) {
	if(img === undefined) { img='/appicon.png'; }
    if(myWidthHeight === undefined) { myWidthHeight = 100; }
        
    
    var myWidth = myWidthHeight;
    var myHeight= myWidthHeight;
    
	var image = Ti.UI.createImageView({
      image: img
    });
    
    var imageSize = image.toBlob();
    var imgW=imageSize.getWidth();
    var imgH=imageSize.getHeight();
    imageSize=null;
	
	var imgScroll = Ti.UI.createScrollView({
	    layout: 'composite',
	    scrollType: 'vertical',
	    overScrollMode: Titanium.UI.Android.OVER_SCROLL_NEVER,
	    top:10,
	    left: 10,
	    width: myWidth,
	    height: myHeight
	});
	imgScroll.add(image);
	image.width = myWidth*zoomLevel;
    image.height= imgH / ( imgW / image.width );
	
	// this is SET CENTER, ladies and gentlemen..
    image.top  = -((image.height - myHeight)/2);
    image.left = -((image.width -  myWidth) /2);
    
	image.addEventListener('click', function(evt){ 
		if(typeof callback === 'function') { 
			callback(evt); 
			console.log("EventListener :: onImageInsideScrollClick :: callBack has been called !");
			return;
		}
		console.log("EventListener :: onImageInsideScrollClick :: no callBack was given");	
	});
	
	
	
	// create and assign setImage function to scroll object	
	imgScroll.setImage = function setImage(img){
        image.image=img;
    };
	imgScroll.setProps = function setProps(p){
        image.myProps=p;
    };
	return imgScroll;
}

module.exports = ApplicationImageCropped;