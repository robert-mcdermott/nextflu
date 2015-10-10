function parseSequences(){
    var lines = document.getElementById('seqinput').value.split('\n');
    var seqs = {};
    var unmatched = [];
    var closest_nodes = {};
    var current_seq_name = "";
    var current_seq = "";
    for (var li=0; li<lines.length; li++){
        if (lines[li][0]=='>'){
            if (current_seq.length){
                current_seq_name += " seq "+Object.keys(seqs).length;
                seqs[current_seq_name]=current_seq;
             }
            current_seq_name = lines[li].substring(1,lines[li].length);
            current_seq = "";
        }else{
            current_seq += lines[li].toUpperCase().replace(/[^ACGTWRN]/g,"");
        }
    }
    if (current_seq.length){
        current_seq_name += " seq "+Object.keys(seqs).length;
        seqs[current_seq_name]=current_seq;
    }
    for (current_seq_name in seqs){
        var tmpclade = locateSequence(current_seq_name, seqs[current_seq_name]);
        if (tmpclade!=null){
            if (typeof closest_nodes[tmpclade]=="undefined"){closest_nodes[tmpclade]=[current_seq_name];}
            else{closest_nodes[tmpclade].push(current_seq_name);}
        }else{
            unmatched.push(current_seq_name);
        }
    }
    markInTree(closest_nodes);
    if (unmatched.length){
        console.log(unmatched);
        var tmp_str = "";
        for (var ii=0; ii<unmatched.length; ii++){ tmp_str+=unmatched[ii].substring(0,30)+"\n";}
        window.alert("No close match was found for \n" + tmp_str + "\nMaybe gapped or not recent isolate from current lineage?");
    }
}

function locateSequence(name, seq){
    var mutations, olap_start, olap_end;
    console.log('Provided sequence: '+ name +': ' + seq.substring(0,20)+'....');
    tmp = alignToRoot(seq);
    olap_start=tmp[0]; olap_end=tmp[1]; mutations=tmp[2];
    if (olap_start==null){
        return null;
    }else{
        console.log("start, end:", olap_start, olap_end);
        console.log("mutations:", mutations);
        var bestClade = findClosestClade(mutations);
        return bestClade;
    }
}

function findClosestClade(mutations){
    var bestClade=-1, bestScore=0;
    var tmpScore=0;
    for (clade in cladeToSeq){
        tmpScore=0;
        for (mut in mutations){
            if (stateAtPosition(clade, 'nuc', mut)==mutations[mut]){
                tmpScore++;
            }
        }
        if (clade!="root") {
            tmpScore -= 0.5*Object.keys(cladeToSeq[clade]['nuc']).length;
        }
        if (tmpScore>bestScore){
            bestScore=tmpScore;
            bestClade=clade;
        }
    }
    console.log("best match:",bestClade);
    return bestClade;
}

function markInTree(clades){
    var nodesToHighlight = nodes.filter(function(d){
        var tmp=0; for (var clade in clades){tmp+= (d.clade==clade);} return tmp>0;});

    for (var mi=0; mi<nodesToHighlight.length; mi++){
        nodesToHighlight[mi].matches = clades[nodesToHighlight[mi].clade];
    }

    treeplot.selectAll('.match').data(nodesToHighlight)
        .enter()
        .append('text')
        .attr("class", "match")
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .style("font-size", "24px")
        .style('font-family', 'FontAwesome')
        .style("fill", "#555555")
        .text(function(d) { console.log(d.strain); return '\uf069'; })
        .attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y; })
        .style("cursor", "default")
        .on('mouseover', function(d) {
            matchTooltip.show(d, this);
        })
        .on('mouseout', matchTooltip.hide);
}


function alignToRoot(seq){
    var rootSeq = cladeToSeq["root"]["nuc"];
    var shift = 0;
    var max_score = 0.0, max_shift;

    for(shift=0; shift<seq.length-30;shift++){
        var tmp_score = 0;
        var olaplen=Math.min(seq.length-shift, rootSeq.length);
        for (var pos=0; pos<olaplen; pos++){
            if (seq[pos+shift]==rootSeq[pos]){
                tmp_score++;
            }
        }
        tmp_score*=1.0/olaplen;
        if (tmp_score>max_score){
            max_score=tmp_score;
            max_shift=-shift;
        }
    }

    for(shift=0; shift<rootSeq.length-30;shift++){
        var tmp_score = 0;
        var olaplen=Math.min(rootSeq.length-shift, seq.length);
        for (var pos=0; pos<olaplen; pos++){
            if (seq[pos]==rootSeq[shift+pos]){
                tmp_score++;
            }
        }
        tmp_score*=1.0/olaplen;
        if (tmp_score>max_score){
            max_score=tmp_score;
            max_shift=shift;
        }
    }
    console.log("best shift: ",max_shift, " score: ",max_score);
    if (max_score>0.9){
        var mutations = {};
        if (max_shift<0){
            var olaplen=Math.min(seq.length+max_shift, rootSeq.length);
            var olap_start = 0;
            var olap_end = olaplen;
        }else{
            var olaplen=Math.min(rootSeq.length-max_shift, seq.length);
            var olap_start = max_shift;
            var olap_end = max_shift+olaplen;
        }
        for (var pos=olap_start; pos<olap_end; pos++){
            if (rootSeq[pos]!=seq[pos-max_shift]){
                mutations[pos]=seq[pos-max_shift];
            }
        }
        return [olap_start, olap_end, mutations];
    }else{
        console.log("no good match");
        return [null, null, null];
    }
}



d3.select('#seqinputsubmit').on('click', parseSequences); 
d3.select('#seqinputclear').on('click', function (){
    treeplot.selectAll('.match').data([]).exit().remove();
    document.getElementById('seqinput').value = "";
    }); 
