var predictedHI = true;
var correctVirus = true;
var correctPotency = true;
var focusNode;
/**
 * for each node, accumulate HI difference along branches
**/
function calcHIsubclade(node){
	node.HI_dist_pred = node.parent.HI_dist_pred+node.dHI;
	if (typeof node.children != "undefined") {
		for (var i=0; i<node.children.length; i++) {
		calcHIsubclade(node.children[i]);
		}
	}else{
		if (typeof node.avidity != "undefined" && correctVirus==false){
			node.HI_dist_pred+=node.avidity;
		}
	}
};

function calcHIpred(node, rootNode){
	if (correctPotency){
		node.HI_dist_pred = 0;
	}else{
		node.HI_dist_pred=node.mean_potency;
	}
	if (typeof node.children != "undefined") {
		for (var i=0; i<node.children.length; i++) {
		calcHIsubclade(node.children[i]);
		}
	}
	var tmp_node = node;
	var pnode = tmp_node.parent;
	while (tmp_node.clade != rootNode.clade){
		pnode.HI_dist_pred=tmp_node.HI_dist_pred + tmp_node.dHI;
		if (typeof pnode.children != "undefined") {
			for (var i=0; i<pnode.children.length; i++) {
				if (tmp_node.clade!=pnode.children[i].clade){
					calcHIsubclade(pnode.children[i]);
				}
			}
		}
		tmp_node = pnode;
		pnode = tmp_node.parent;
	}
	if (correctVirus==false){
		node.HI_dist_pred += node.avidity;
	}
};

function calcHImeasured(node, rootNode){
	console.log(node.strain+ ', mean_potency:'+node.mean_potency);
	for (var i=0; i<tips.length; i+=1){
		d = tips[i];
		if (typeof(node.mean_HI_titers[d.clade])!="undefined"){
			d.HI_dist_meas = node.mean_HI_titers[d.clade]
			if (correctVirus){
				d.HI_dist_meas -= d.avidity;
			}
			if (correctPotency){
				d.HI_dist_meas -= node.mean_potency;
			}
		}else{
			d.HI_dist_meas = 'NaN';
		}
	}
};

function get_mutations(node1, node2){
	var gt1, gt2,muts=[];
	for (var gene in cladeToSeq[node1.clade]){
		var gene_length = cladeToSeq["root"][gene].length;
		if (gene!='nuc'){
			for (var pos=0; pos<gene_length; pos+=1){
				gt1 = stateAtPosition(node1.clade, gene, pos)
				gt2 = stateAtPosition(node2.clade, gene, pos)
				if (gt1!=gt2){
					muts.push(gene+':'+gt1+(pos+1)+gt2);
				}
			}
		}
	}
	return muts;
}

function calcHImutations(node){
	console.log(node.strain+ ', mean_potency:'+node.mean_potency);
	console.log(HI_model);
	for (var i=0; i<tips.length; i+=1){
		d = tips[i];
		var mutations = get_mutations(node, d);
		if (correctPotency){
			d.HI_dist_pred=0;
		}else{
			d.HI_dist_pred=node.mean_potency;	
		}
		for (var mi=0; mi<=mutations.length; mi++){
			var mut = mutations[mi];
			if ((typeof mut != "undefined")&&(typeof HI_model[mut]!="undefined")){
				d.HI_dist_pred += HI_model[mut];
			}
		}
		if ((correctVirus==false)&&(typeof d.avidity != "undefined")){
			d.HI_dist_pred += d.avidity;
		}
	}
};

function tipHIvalid(d) {
	var vis = "visible";
	if ((colorBy=='HI_dist')&&(predictedHI==false)&&(d.HI_dist_meas =='NaN')) {
		vis = "hidden";
	}
	return vis;
}

function getSera(tree_tips){
	return tree_tips.filter(function (d){return d.serum;})
}

d3.select("#serum")
	.on("change", colorByHIDistance);

d3.select("#virus")
	.on("change", colorByHIDistance);

d3.select("#HIPrediction")
	.on("change", colorByHIDistance);

var HI_model;
var structure_HI_mutations;
d3.json(path + file_prefix + "HI.json", function(error, json){
	HI_model = json;
	var positions = {};
	var tmp;
	for (var mut in HI_model){
		tmp = mut.split(':')[1]
		tmp = mut.split(':')[0]+':'+tmp.substring(1,tmp.length-1);
		if (typeof positions[tmp] == "undefined"){
			positions[tmp] = [HI_model[mut]];
		}else{
			positions[tmp].push(HI_model[mut]);
		}
	}
	for (var mut in positions){
		tmp = positions[mut];
		var avg=0;
		for (var i=0; i<tmp.length; i+=1){avg+=tmp[i];}
		positions[mut] = avg/tmp.length;
	}
	console.log(Object.keys(positions));
	structure_HI_mutations = ""
	for (var key in positions){
		var gene = key.split(':')[0];
		var pos = key.split(':')[1];
		if (gene=='HA1'){
			console.log(positions[key]);
			var c = dHIColorScale(positions[key]);
			structure_HI_mutations+= 'select '+pos+':a;spacefill 200; color ' +c+';';//' '+pos+':c, '+pos+':e,';
		}
		//else{
		//	structure_HI_mutations+= pos+':b,'; //' '+pos+':d, '+pos+':f,';			
		//}
	}
	//structure_HI_mutations = structure_HI_mutations.substring(0, structure_HI_mutations.length-1);
	console.log(structure_HI_mutations);
	make_structure();
});
