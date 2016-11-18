function ApplicationAlertInput(title, titleText, callback, centerOrLeft) {
	
  	if(title === undefined) { title="Please enter data:"; }
  	if(titleText === undefined) { titleText=""; }
  	
  	var textField = Ti.UI.createTextField();
  	textField.setValue(titleText);
  	
	var dialog = Ti.UI.createAlertDialog({
		title: title,
		textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
		androidView: textField,
		buttonNames: ['OK', 'cancel']
	});
	dialog.addEventListener('click', function(e){
		if(typeof callback === 'function') { 
			callback(e); 
			console.log("EventListener :: onAlertInputSelectedButton :: callBack has been called !");
			return; 
		}
		
		// nasledovne sa stane iba ked nepride callback funkcia:
		alert("You have clicked: " + e.index); 
		console.log("EventListener :: onAlertInputSelectedButton :: no callBack function has arrived, default button click behaviour has been invoked"); 		
	});
	dialog.show();
	
	// no return value needed here..
	return true;
}

//make constructor function the public component interface
module.exports = ApplicationAlertInput;