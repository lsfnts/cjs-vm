module.exports = {
	MAX_LINE: 1000,
	MAX_DIGIT: 10,
	MAX_ID: 10
}

function parame(params) {
	MAX_LINE = params[0];
	MAX_DIGIT = params[1];
	MAX_ID = params[2];
	//alert(params[0])
}


function split_param(text) {
	var responseArray = [];
	console.log(text);
	var s = text.split(";");
	for (i = 1; i < s.length; i++) {
		responseArray.push(s[i].split("\n")[0]);
	}
	// console.log(responseArray);
	return responseArray;
}