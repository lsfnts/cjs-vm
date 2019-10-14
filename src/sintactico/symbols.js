var Table = [0]
module.exports = {
	table: Table,
	insert: (name, type, param) => {
		Table.push({ name, type ,value: null});
	},
	lookup: (name) => {
		let len = Table.length
		let ret = false;
		while (len--) {
			if(Table[len].name === name) ret = Table[len];
		}
		return ret
	}
}