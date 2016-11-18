//Application Window Component Constructor
function ApplicationButton(title, callback) {
	if(title === undefined) { title="Button"; }
	
	//create component instance
	var	button = Ti.UI.createButton();
		button.width = 220;
		button.height = 56;
		button.backgroundColor= "#283618";
		button.title = title;
		button.verticalAlign = Ti.UI.TEXT_VERTICAL_ALIGNMENT_CENTER;
		button.font = 
		{
		   fontSize: 18,
		   fontWeight : 'bold',
		};
		
		button.addEventListener("click", function(evt) { 
			if(typeof callback === 'function') { 
				callback(evt); 
				console.log("EventListener :: onButtonClick :: callBack has been called !");
				return; 
			}
			
			// nasledovne sa stane iba ked nepride callback funkcia:
			alert("Button was clicked!"); 
			console.log("EventListener :: onButtonClick :: no callBack function has arrived, default button click behaviour has been invoked"); 
		});
	return button;
}

//make constructor function the public component interface
module.exports = ApplicationButton;