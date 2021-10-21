export const colors = {
  red: "#C62828",
  green: "#558B2F",
  orange: "#FF8F00"
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

export const parseParams = (input) =>
{
	if (input === "") return undefined;
	
	if (input.slice(0, 18) === "--- empty set ----")
		return [];
	
	var linearSets = input.split("--------------");
	var sets = [];
	linearSets.forEach(set => {
		if (set !== "")
		{
			var lines = set.split("\n");
			//alert("line number: " + lines.length)
			var resSet = {
				directions: [],
				offsets: []
			};
			lines.forEach(line => {
				if (line !== "")
				{
					var dir = line.split(" <= ")[0].split(" ");
					var off = line.split(" <= ")[1];
					var vi = check(dir, resSet.directions);

					//alert("direction = " + dir.toString() + "; offset = " + off)
					
					if (!allZeroes(dir))
					{
						if (resSet.directions.length === 0 || vi === -1)
						{
							//alert("add direction " + dir.toString());
							resSet.directions.push(dir);
							resSet.offsets.push(off);
						}
						else
						{
							//alert("direction already present in position " + vi.pos)
							if (resSet.offsets[vi] > off)
								resSet.offsets[vi] = off;
						}
					}
				}
			});
			sets.push(resSet);
		}
	});
	
	console.log("printing sets");
	console.log(sets);
	
	return sets;
};

function check(v, vs)
{
	for (var i = 0; i < vs.length; i++)
		if (checkVector(v, vs[i]))
			return i;
	
	return -1;
};

function checkVector(v,w)
{
	for (var i = 0; i < v.length; i++)
		if (v[i] !== w[i])
			return false;
	
	return true;
};

function allZeroes(v)
{
	for (var i = 0; i < v.length; i++)
		if (v[i] !== 0) return false;
	
	return true;
}
