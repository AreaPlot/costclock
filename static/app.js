var tte = 0; // total time elapsed (in seconds)
var taf = undefined; // timer active flag 
var tcpm = 0; // total cost per minute
var party = {};

var multi = 1;
function setMultiplier(tms){
    if(! isNaN(tms) && tms > 0 && tms <= 2){
        multi = tms;
        setTCPM();
        return true;
    }
    return false;
}

var weeks = 52;
function setWeeksPerYear(wks){
    if(! isNaN(wks) && wks > 0 && wks <= 53){
        weeks = wks;
        setTCPM();
        return true;
    }
    return false;
}

var hours = 40;
function setHoursPerWeek(hrs){
    if(! isNaN(hrs) && hrs > 0 && hrs <= 60){
        hours = hrs;
        setTCPM();
        return true;
    }
    return false;
}

function setMeetingTime(nt){
    nt = '1970-01-01T'+nt+'Z';
    secs = moment(nt).utc().unix();
    if(! isNaN(secs) && secs >= 0 && secs <= 864000){
        tte = secs;
        updateTimerDisplay();
        return true;
    }
    return false;
}

function updateCostDisplay(){
    $("#set_costperminute").html(formatCurrency(tcpm * 60));
    $("#set_costperhour").html(formatCurrency(tcpm * 60 * 60));
}

function partySum(obj){
    if(Object.keys(party).length > 0){
        return Object.values(obj).reduce((a, b) => a + b);
    } else {
        return 0;
    }
}
function setTCPM(){
    tcpm = (partySum(party) / (weeks * hours * 60 * 60)) * multi;
    updateTimerDisplay();
    updateCostDisplay();
}

function formatCurrency(num, fixed, fancy){
	fixed = isNaN(fixed) || (fixed == undefined) ? 2 : parseInt(fixed);
    num = isNaN(num) || num === '' || num === null ? 0.00 : num;
    num = parseFloat(num).toFixed(fixed);
	dollars = num.split(".")[0].split("").reverse();
	newdollars = new Array();
	for(i=0;i<dollars.length;++i){
		if(0==(i % 3) && i!=0){
			newdollars.push(",");
		}
		newdollars.push(dollars[i]);
	}
	if(fixed > 0) { 
		num = newdollars.reverse().join('') + "." + num.split(".")[1];
	} else {
		num = newdollars.reverse().join('');
	}
    if(fancy){
        return '<span class="dsp_cursign">$</span>'+
            '<span class="dsp_dollars">'+num.split(".")[0]+'</span>'+
            '<span class="dsp_cents">.'+num.split(".")[1]+'</span>';
    }
	return "$" + num;
}
function formatTime(num){
    var secs = num % 60;
    var mins = Math.floor(num / 60) % 60;
    var hour = Math.floor(num / (60 * 60));
    return String(hour).padStart(2,'0') + ':' + 
           String(mins).padStart(2,'0') + ':' + 
           String(secs.toFixed(0)).padStart(2,'0');
}
function incrementTimer(){
    tte = tte+(1/10);
    updateTimerDisplay();
}

function toggleTimer(){
    if(! taf){
        taf = setInterval(incrementTimer, 100);
        $("#btn_clock").html('Pause');
    } else {
        clearInterval(taf);
        taf = undefined;
        $("#btn_clock").html('Start');
    }
}
function resetTimer(){
    if(taf){
        clearInterval(taf);
        taf = undefined;
    }
    tte = 0;
    updateTimerDisplay();
}

function updateTimerDisplay(){
    $("#dsp_clock").html( formatCurrency(tte*tcpm) );
    $("#dsp_clock_actualtime").html( formatTime(tte) );
}

function addParticipantRow(i){
    $('#tbl_participants tbody').append('<tr id="participant_'+i.hash+'"><td>'+i.name+'</td><td><button class="btn btn-danger" onclick="removeParticipantRow(\''+i.hash+'\');">&times; Remove</button></td><tr>');
    setTCPM();
}

function removeParticipantRow(hash){
    delete party[hash];
    $("#participant_"+hash).remove();
    setTCPM();
}

function calcParticipantDisplay(t, amt){
    if(! isNaN(amt) ){
        if(t == 'annual'){
            $("#add_hourly").val( (amt / (weeks * hours)).toFixed(2) );
            return true;
        }
        if(t == 'hourly'){
            $("#add_annual").val( (amt * weeks * hours).toFixed(2) );
            return true;
        }
        return false;
    }
}

function addNewParticipant(){
    var record = {'hash': "id"+(new Date).getTime()};
    record['name'] = $("#add_name").val();
    record['basesalary'] = parseInt($("#add_annual").val());

    party[record['hash']] = record['basesalary'];
    addParticipantRow(record);

    $("#add_name").val('');
    $("#add_annual").val(0);
    $("#add_hourly").val(0);
}

var participants;
$(document).ready(function(){
    participants = new Bloodhound({
        datumTokenizer: function(datum) { return Bloodhound.tokenizers.whitespace(datum.name); },
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        prefetch: { url: './static/employees.json'},
        //remote: { url: '/search/%QUERY', wildcard: '%QUERY' }
    });
    participants.clearPrefetchCache();
    participants.initialize();
    $('.typeahead').typeahead(null, { 
        limit: 10, 
        minLength: 3,
        displayKey: 'name',
        source: participants,
        templates: {
            suggestion: function(d){
                item = '<div><span class="ps_name">'+d.name+'</span> ';
                if (! d.jobtitle == undefined) {
                    item += ' - <span class="jobtitle">' + d.jobtitle + '</span> ';
                } 
                item += ' <span class="organization">(';
                if (! d.department == undefined) {
                    item += d.department + ' - '; 
                }
                item += d.organization + ')</span> ';
                item += '<span class="ps_source">[' + d.source + ']</span></div>';
                return item;
            }
        }
    });
    $('.typeahead').on('typeahead:selected', function(evt, item) {
        party[item['hash']] = item['basesalary'];
        addParticipantRow(item);
        $('.typeahead').typeahead('val','');
    });

    $('[data-toggle="tooltip"]').tooltip();

    slogans = ["Display the True Cost of Meetings",
        "Put your money where your mouth is",
        "&quot;Lost time is never found again.&quot; - Benjamin Franklin",
        "&quot;You may delay, but time will not.&quot; - Benjamin Franklin"
    ];
    $("#site_slogan").html( slogans[Math.floor(Math.random() * slogans.length)] );
});


