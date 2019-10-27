var Table = [0]
module.exports = {
	table: Table,
	insert: (name, type) => {
		if (!module.exports.lookup(name)) {
			Table.push({ name, type, value: null });
			return true;
		} else return false;
	},
	lookup: (name) => {
		let len = Table.length
		let ret = false;
		while (len--) {
			if (Table[len].name === name) ret = Table[len];
		}
		
		return ret;
	},
	asignar: (pos) => {

	}
}