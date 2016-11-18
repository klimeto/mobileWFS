//Application Window Component Constructor
function ApplicationTextArea(title, callback) {
    if(title === undefined) { title=''; }
    
    var textArea = Ti.UI.createTextArea({
	  borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
	  //keyboardType: Ti.UI.KEYBOARD_NUMBERS_PUNCTUATION, 
	  top: 10, left: 10,
	  width: '90%',
	  height: '100dp',
	  borderWidth:"2",
	  borderColor:"#283618",
	  borderRadius:"5",
	  color:"#3C4037"
	});
    textArea.setValue(title);
    /*
        Titanium.UI.KEYBOARD_TYPE_DECIMAL_PAD
        Titanium.UI.KEYBOARD_TYPE_ASCII
        Titanium.UI.KEYBOARD_TYPE_DEFAULT
        Titanium.UI.KEYBOARD_TYPE_EMAIL
        Titanium.UI.KEYBOARD_TYPE_NAMEPHONE_PAD
        Titanium.UI.KEYBOARD_TYPE_NUMBERS_PUNCTUATION
        Titanium.UI.KEYBOARD_TYPE_NUMBER_PAD
        Titanium.UI.KEYBOARD_TYPE_PHONE_PAD
        Titanium.UI.KEYBOARD_TYPE_WEBSEARCH
        Titanium.UI.KEYBOARD_TYPE_TWITTER
        Titanium.UI.KEYBOARD_TYPE_URL
     */
    
	textArea.addEventListener('click', function(evt){ 
		if(typeof callback === 'function') { 
			callback(evt); 
			console.log("EventListener :: onTextAreaClick :: callBack has been called !");
			return;
		}
		console.log("EventListener :: onTextAreaClick :: no callBack was given");	
	});
	
	return textArea;
}

//make constructor function the public component interface
module.exports = ApplicationTextArea;