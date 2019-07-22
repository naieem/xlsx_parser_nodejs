	var express = require('express');
	var app = express();
	var bodyParser = require('body-parser');
	var multer = require('multer');
	var xlstojson = require("xls-to-json-lc");
	var xlsxtojson = require("xlsx-to-json-lc");
	var logger = require("./logger");
	var generator = require('node-uuid-generator');
	var csvToJson = require('csvtojson')
	app.use(bodyParser.json());

	var storage = multer.diskStorage({ //multers disk storage settings
		destination: function (req, file, cb) {
			cb(null, './uploads/')
		},
		filename: function (req, file, cb) {
			var datetimestamp = Date.now();
			cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
		}
	});



	var upload = multer({ //multer settings
		storage: storage,
		fileFilter: function (req, file, callback) { //file filter
			if (['xls', 'xlsx', 'csv'].indexOf(file.originalname.split('.')[file.originalname.split('.').length - 1]) === -1) {
				return callback(new Error('Wrong extension type'));
			}
			callback(null, true);
		}
	}).single('file');

	/** API path that will upload the files */
	app.post('/upload', function (req, res) {
		var filetype;
		upload(req, res, function (err) {
			if (err) {
				res.json({
					error_code: 1,
					err_desc: err
				});
				return;
			}
			/** Multer gives us file info in req.file object */
			if (!req.file) {
				res.json({
					error_code: 1,
					err_desc: "No file passed"
				});
				return;
			}
			/** Check the extension of the incoming file and 
			 *  use the appropriate module
			 */
			let fileExt = req.file.originalname.split('.')[req.file.originalname.split('.').length - 1];
			if (fileExt === 'xlsx') {
				filetype = xlsxtojson;
			} else if (fileExt === 'csv') {
				filetype = xlstojson;
			} else {
				filetype = xlstojson;
			}
			console.log(req.file.path);
			if (fileExt === 'csv') {
				try {
					csvToJson()
						.fromFile(req.file.path)
						.then((jsonObj) => {
							console.log(jsonObj);
							res.json({
								status: 1,
								data: jsonObj
							});
						})
				} catch (e) {
					res.json({
						error_code: 1,
						err_desc: "Corupted file"
					});
				}
			} else {
				try {
					if (filetype)
						filetype({
							input: req.file.path,
							output: null, //since we don't need output.json
							lowerCaseHeaders: true
						}, function (err, result) {
							if (err) {
								return res.json({
									error_code: 1,
									err_desc: err,
									data: null
								});
							}

							for (var i = 0; i < result.length; i++) {
								var guid1 = generator.generate();
								var male = {
									"_id": guid1,
									"Age": parseInt(result[i].age),
									"Gender": "Male",
									"Rate": parseInt(result[i].male)
								}
								var guid2 = generator.generate();
								var female = {
									"_id": guid2,
									"Age": parseInt(result[i].age),
									"Gender": "Female",
									"Rate": parseInt(result[i].female)
								}
								logger.info(male);
								logger.info(female);
							}
							res.json({
								error_code: 0,
								err_desc: null,
								data: result
							});
						});
				} catch (e) {
					res.json({
						error_code: 1,
						err_desc: "Corupted file"
					});
				}
			}
		})

	});

	app.get('/', function (req, res) {
		res.sendFile(__dirname + "/index.html");
	});

	app.listen('3000', function () {
		console.log('running on 3000...');
	});