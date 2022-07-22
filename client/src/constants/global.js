export const colors = {
  red: "#C62828",
  green: "#558B2F",
  orange: "#FF8F00"
};

export const k_induction_join = {
	listing: 0,
	packaging: 1,
	merging: 2,
};

export const change_targets = {
	variables: 0,
	initial_set: 1,
	parameters: 2,
	invariant: 3
};

export const invariant_results = {
	proved: "proved",
	disproved: "disproved",
	epoch_limit: "epoch limit reached"
};

export const tasks = {
	undefined: "undefined",
	reachability: "reachability",
	synthesis: "synthesis",
	invariant_validation: "invariant validation"
};

export const task_name = (task) => {

  switch(task) {
    case tasks.reachability:
      return "Reachability";
    case tasks.synthesis:
      return "Synthesis";
    case tasks.invariant_validation:
      return "Invariant Validation";
    default:
      return "Analysis Method";
  }
};

export const deepCopy = value => {
  return JSON.parse(JSON.stringify(value));
};

export const capitalizeFirstLetter = string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export const downloadFile = (data, name, type) => {
  var bb = new Blob([data], { type: type });
  var a = document.createElement('a');
  a.download = name;
  a.href = window.URL.createObjectURL(bb);
  a.click();
};

export const parseResults = (input) => 
{
	var varNum = undefined;
	var lines = input.split("\n");
	var blocks = [];
	
	var prev_i = 0;
	lines.forEach((line, i) => {
		if (line === "")
		{
			blocks.push(lines.slice(prev_i, i));
			if (varNum === undefined) varNum = (i - prev_i) / 2;
			prev_i = i+1;
		}
	});
	
	var result = {
		directions: [],
		regions: []
	};
	
	if (blocks.length === 0)
		return result;
	
	blocks[0].forEach(line => {
		result.directions.push(line.split(" <= ")[0].split(" "));
		result.directions[result.directions.length - 1].map(x => parseFloat(x));
	});
	result.directions.splice(varNum, varNum);
	
	blocks.forEach(b => {
		if (b.length > 0)
		{
			result.regions.push({
				lb: [],
				ub: [],
			});
			var i = 0;
			for (; i < b.length/2; i++)
				result.regions[result.regions.length - 1].ub.push(parseFloat(b[i].split(" <= ")[1]));
			for (; i < b.length; i++)
				result.regions[result.regions.length - 1].lb.push(-parseFloat(b[i].split(" <= ")[1]));
		}
	});
	
	return result;
};

export const parseLinearSystemSet = (input) =>
{	
	var ls_txts = input.split("\n\n");

	var result = {
		linear_systems: []
	};

	ls_txts.forEach(ls_txt => {
		if (ls_txt !== "")
		{
			var lines = ls_txt.split("\n");
			var ls = {
				directions: [],
				offsets: []
			};
			lines.forEach(line => {
				if (line !== "")
				{
					var line_parts = line.split(" <= ");
					var dir = []
					
					line_parts[0].split(" ").forEach((value) => {
						dir.push(parseFloat(value));
					});
					var off = parseFloat(line_parts[1]);

					if (!allZeroes(dir))
					{
						ls.directions.push(dir);
						ls.offsets.push(off);
					}
				}
			});
			result.linear_systems.push(ls);
		}
	});
	return result;
};

function allZeroes(v)
{
	for (var i = 0; i < v.length; i++)
		if (v[i] !== 0) return false;
	
	return true;
}
