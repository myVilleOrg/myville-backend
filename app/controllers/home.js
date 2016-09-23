var express = require('express'),
	router 	= express.Router();

router.get('/', function (req, res, next) {
	return res.status(200).json({message: 'Welcome on API'});
});
module.exports = function (app) {
	app.use('/', router);
};
