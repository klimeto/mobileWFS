function ApplicationDatePicker(date, callback) {
	if(date === undefined) { date=new Date(2016,5,6); }
	Ti.UI.backgroundColor = 'white';
	
	var picker = Ti.UI.createPicker({
	  type:Ti.UI.PICKER_TYPE_DATE,
	  //minDate:new Date(2009,0,1),
	  //maxDate:new Date(2014,11,31),
	  value:new Date(2016,5,6)
	});
	
	picker.showDatePickerDialog({
	  value: date,
	  callback: function(evt) {
	    if(typeof callback === 'function') { 
			callback(evt); 
			console.log("EventListener :: onDatePickerSelected :: callBack has been called !");
			return;
		}
		console.log("EventListener :: onDatePickerSelected :: no callBack was given");
	    
	    /*if (e.cancel) {
	      Ti.API.info('User canceled dialog');
	    } else {
	      Ti.API.info('User selected date: ' + e.value);
	    }*/
	  }
	});
	
}

//make constructor function the public component interface
module.exports = ApplicationDatePicker;