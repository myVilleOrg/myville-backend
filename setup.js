var request = require('request-promise');

console.log('Launching setup script');
var max_user = 10;
var promises = [];
var data_signup = function(i) {
	return {
		username: 'test_' + i,
		email: 'test_' + i + '@myville.com',
		password: 'test',
		phonenumber: '0505050505'
	};
};
var randomCoords = function() {
	return [
		-3.45 + 0.16 * Math.random() - 0.08, 48.74 + 0.1 * Math.random() - 0.05
	];
}
var data_uas = function(i){
	return {
		description: 'RANDOM DESCRIPTION ' + i,
		geojson: JSON.stringify({"type": "Point", "coordinates": randomCoords()})
	};
};

for(var i = 0; i < max_user; i++) {
	console.log('Account #' + i);
	promises.push(request.post('http://localhost:3000/user/create', {form: data_signup(i)}));
}
Promise.all(promises).then(function(res){
	console.log('Account creation completed');
	console.log('Creation of uas');
	var promises = [];
	for(var i = 0; i < res.length; i++){
		var user = JSON.parse(res[i]);
		for(var j = 0; j < max_user / 2; j++){
			promises.push(request.post({uri: 'http://localhost:3000/ua/create', headers: {'x-access-token': user.token }, form: data_uas(i)}));
			console.log('UAS #' + j + ' for user #' + i);
		}
	}
	Promises.all(promises).then(function(res){
		console.log('Setup finished')
	});
});
