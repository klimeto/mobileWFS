//Application Window Component Constructor
function ApplicationLabel(title, callback) {
    if(title === undefined) { title='This is label'; }
    var label = Ti.UI.createLabel({
	  color: 'black',
	  font: { fontSize:18 },
	  html: title,
	  textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
	  height: 56
	  //shadowColor: '#aaa',
	  //shadowOffset: {x:5, y:5},
	  //shadowRadius: 3,
	});
	
	label.addEventListener('click', function(evt){ 
		if(typeof callback === 'function') { 
			callback(evt); 
			console.log("EventListener :: onLabelClick :: callBack has been called !");
			return;
		}
		console.log("EventListener :: onLabelClick :: no callBack was given");	
	});
	
	return label;
}

//make constructor function the public component interface
module.exports = ApplicationLabel;