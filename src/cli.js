module.exports = {
	lex: function (path, options) {
	analizar(path);
	if(options.setup_mode)	console.log('traigo s');
   }
}

function analizar(file) {
	console.log(`estoy analizando ${file}`);
}