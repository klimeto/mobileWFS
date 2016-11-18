//Application Window Component Constructor
function ApplicationScrollView() {
    
    var scrollView = Ti.UI.createScrollView({
	  showVerticalScrollIndicator: true,
	  showHorizontalScrollIndicator: false,
	  height: '100%',
	  width: '100%'
	});
	
	return scrollView;
}

//make constructor function the public component interface
module.exports = ApplicationScrollView;