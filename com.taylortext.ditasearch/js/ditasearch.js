
/* TO DO:
 * Refactor out all "h5help" code
 * Refactor (if reasonable) jQuery dependencies
 * Refactor out code for Google search
 * Refactor out facets stuff unless I can use it
 * Add/check init code to create search box
 * Add minimal default CSS to format search box & results
 * Test code to ensure it's not dependent on flat file structure
 * Add code to init when loaded
 * Add custom settings, etc. to JS when html is built so not a separate load step?
 * Test
 */

// BUILD REFACTORING TO DO:
// h5help.params.searchconfig.exceptionalforms ==> ditasearch.configs.exceptionalforms
// h5help.params.searchconfig.synonyms ==> ditasearch.configs.synonyms
// add helpindex.json and searchconfigs.json into this file so no separate load ??
// note: searchconfigs.json was previously loaded by require.js before loading the search code
// add minify step to improve loading for the search js?

var ditasearch = {
    configs : {
        exceptionalforms : [],
        synonyms : []
    },
    "init"      : function(){
                    ditasearch.results.hide();
                    $.getJSON('helpindex.json')
                        .done( function( data ){
                            h5help.helpindex = data;
                            ditasearch.porter2.exceptionlist = ditasearch.configs.exceptionalforms; // override porter2 defaults 
                            ditasearch.handlers();
                        })
                        .fail( function( data, status, xhr ){
                            console.log("Couldn't load search index.", status, xhr);
                            ditasearch.remove();
                        });
                    $.getJSON('topicsummaries.json')
                        .done( function( data ) { h5help.topicsummaries = data; } )
                        .fail( function( data, status, xhr ){
                            console.log("Couldn't load topic summaries.", status, xhr);
                            ditasearch.remove();
                        });
    },
    "timer"     : null,
    "handlers"  : function() {
                    $("body, div#feedback, div#feedback a").on("click topicTouch", ditasearch.results.hide);
                    $("div.resultslist").on("click", "a", ditasearch.results.hide);
                    $("a#clearsearch").on("click", ditasearch.query.clear);
                    $("div#searchbox").on("click", function(event) { event.stopPropagation(); });
                    $("div#searchbox").one("focus click", "input", ditasearch.results.show); 
                    $("div#searchbox").on("keyup cut paste", "input", ditasearch.delaySearch);
                    $("div#searchbox").on("input", "input", ditasearch.delaySearch);
                    $("div#searchbox").one("input", "input", function(){
                        // If input event is supported, don't listen for keyup, cut, paste
                        $("div#searchbox").off("keyup cut paste", "input", ditasearch.delaySearch);
                    });
                    $("div#searchbox").on("change","div.searchfacets select, div.searchfacets input", ditasearch.filterfacets);
    },
    "delaySearch" : function() {
                        window.clearTimeout(ditasearch.timer);
                        ditasearch.timer = window.setTimeout(ditasearch.search,500);
                        ditasearch.results.pending();
    },
    "query"     : {
        "value" : "",
        "digits2words" : function( instring ) {
                    var ones = instring.replace(/([a-z])1/,"$1one").replace(/1([a-z])/,"one$1");
                    var tos = ones.replace(/([a-z])2/,"$1to").replace(/2([a-z])/,"to$1");
                    var fors = tos.replace(/([a-z])4/,"$1for").replace(/4([a-z])/,"for$1");
                    return fors;
        },
        "get"   : function() {
                    var facetquery = $("div.searchfacets input:radio[name=resultstab]:checked").val() || '';
                    var query = $("div#searchbox input").val();
                    query = ditasearch.query.digits2words(query);
                    query = query.replace(/[^'"a-zA-Z]+/," ");
                    query = query.replace(/(^\s+|\s+$)/g,'');
                    return [query,facetquery];
        },
        "clear" : function() {
                    ditasearch.query.value = "";
                    $("div#searchbox > input").val('');
                    $("div.searchresults > div.resultslist > ol").empty();
                    ditasearch.results.done();
        }
    },
    "comparestrings" : function( stringa, stringb ) {
                    // need to normalize spaces or remove ellipses?
                    var stringa = stringa || '';
                    var stringb = stringb || '';
                    var a = stringa.trim();
                    var b = stringb.trim();
                    if (a == b) {
                        return 100;
                    }
                    else {
                        var l = Math.min(a.length, b.length);
                        a = a.substr(0,l);
                        b = b.substr(0,l);
                        for (var i = 0; a.substr(0,i) == b.substr(0,i); i++) {}
                        return Math.round(i*100/l);
                    }
    },
    "search"    : function(){
                      var query = ditasearch.query.get()[0];
                      query = query.replace(/"/g,"");
                      var terms = query.split(" ");
                      ditasearchStems = [];
                      for (var i = 0; i < terms.length; i++) { // stem each search term
                          ditasearchStems.push(ditasearch.porter2.stem(terms[i]));
                      }
                      ditasearchStems = ditasearchStems.concat(ditasearch.getSynonyms(ditasearchStems));
                      
                      var results = [];
                      for (var i = 0; i < ditasearchStems.length; i++) { // each search stem (including synonyms)
                          var termbonus = (i >= terms.length ? 100 : 1000 ); // reduced bonus for synonyms
                          var stem = ditasearchStems[i];
                          if ( typeof(h5help.helpindex[stem]) != 'undefined' ) {
                              for (var j = 0; j < h5help.helpindex[stem].length; j++) { // each result for the term
                                  var thishref = Object.keys(h5help.helpindex[stem][j])[0];
                                  var thissummary = h5help.topicsummaries[thishref] || {"searchtitle":"","shortdesc": ""};
                                  var thistitle = (thissummary.searchtitle.length > 0) ? thissummary.searchtitle.replace(/[<>]/gi,'') : "[no title]";
                                  var thisdesc = (thissummary.shortdesc.length > 0) ? thissummary.shortdesc.replace(/[<>]/gi,'') : "";
                                  
                                  var thisresult = {
                                      "labels"    : "",
                                      "title"     : thistitle,
                                      "href"      : thishref,
                                      "context"   : "",
                                      "shortdesc" : thisdesc,
                                      "terms"     : stem,
                                      "score"     : parseInt(h5help.helpindex[stem][j][thishref]) + termbonus
                                      };
                                  if (ditasearchStems.length > 1) { // combine dups
                                      var matched = results.filter(function(item){ return item.href == thishref; }); 
                                      if (matched.length == 1) { // matched.length can be 0 or 1
                                          var unmatched = results.filter(function(item){ return item.href != thishref; }); 
                                          thisresult.terms += " " + matched[0].terms;
                                          thisresult.score += matched[0].score;
                                          results = unmatched;
                                      }
                                  }
                                  results.push(thisresult);
                              }
                          }
                      }
                      if ( results.length == 0 ) {
                          results.push({ "title" : "No topics found" });
                      } else {
                          results.sort(function(a,b) {return b.score - a.score});
                      }
                      ditasearch.results.clear();
                      ditasearch.results.toHTML(results);
        
    },
    "initfacets"    : function() {
                    var facetHTML = '<hr>';
                    for (var i = 0; i < ditasearch.labels.length; i++) {
                        facetHTML += '<span><input type="radio" name="resultstab" id="label' + i + '" '
                                        + 'data-query="' + ditasearch.labels[i].queryterm + '" '
                                        + 'value="' + ditasearch.labels[i].facet + '" tabindex="0"/>'
                                        + '<label for="label' + i + '">'
                                        + ditasearch.labels[i].display + '</label></span>';
                    }
                    $("div.searchfacets").html(facetHTML);
                    $("input:radio[name=resultstab][value="+h5help.params.google_cse_refinement+"]")
                            .prop("checked",true);
                    ditasearch.filterfacets();
                    ditasearch.results.done();
    },
    "filterfacets" : function() {
                    var facet = $("div.searchfacets input:radio[name=resultstab]:checked").val();
                    $("div.searchresults li[data-labels ~= '"+facet+"']").show();
                    $("div.searchresults li:not([data-labels ~= '"+facet+"'])").hide();
                    ditasearch.search();
    },
    "getSynonyms"   : function(stemlist){
                        var synonyms = [];
                        for (var i = 0; i < stemlist.length; i++) {
                            for (var j = stemlist.length; j >= i; j--) { // find longest matching phrase from end
                                var phrase = stemlist.slice(i,j+1).join('_');
                                if ( phrase in ditasearch.configs.synonyms ) {
                                    synonyms = synonyms.concat(ditasearch.configs.synonyms[phrase]);
                                }
                            }
                        }
                        // remove duplicates
                        for (var i = 0; i < synonyms.length; i++) { 
                            for (var j = 0; j < stemlist.length; j++) {
                                if (synonyms[i] == stemlist[j]) { synonyms.splice(i,1); }
                            }
                        }
                        for (var i = 0; i < synonyms.length; i++) { 
                            for (var j = i+1; j < synonyms.length; j++) {
                                if (synonyms[i] == synonyms[j]) { synonyms.splice(j,1); }
                            }
                        }
                        return synonyms;
    },
    "results"       : {
        "pending"   : function() {
                    $("div.resultslist").addClass("spinner");
        },
        "done"      : function() {
                    $("div.resultslist").removeClass("spinner");
        },
        "toHTML"    : function (results) {
                    /* results data structure :
                              "labels"    : string,
                              "title"     : string,
                              "href"      : string,
                              "context"   : string,
                              "shortdesc" : string,
                              "terms"     : string,
                              "score"     : number 
                       some items might not be specified */
                                          
                    var resultsHTML = "";
                    for (var i = 0; i < results.length; i++) {
                        var scoreattr = labelsattr = stemsattr = '';
                        var targetattr = ' target="h5topicframe"';
                        if (typeof results[i].score == "number")  { scoreattr = ' data-score="' + results[i].score + '"'; }
                        if (typeof results[i].terms == "string")  { stemsattr = ' data-stems="' + results[i].terms + '"'; }
                        if (typeof results[i].labels == "string") { labelsattr = ' data-labels="' + results[i].labels + '"';}
                        if (results[i].labels !== h5help.params.google_cse_refinement) { targetattr = ' target="_blank"'; }
                        var alink = (typeof results[i].href == "string" && results[i].href.length > 0) 
                            ? '<a' + targetattr + ' href="' + results[i].href + '">' + results[i].title + '</a>'
                            : '<p>' + results[i].title + '</p>';
                        var shortdesc = (typeof results[i].shortdesc == "string" && results[i].shortdesc.length > 0)
                                    ? '<p class="shortdesc">' + results[i].shortdesc + '</p>'
                                    : '';
                        
                        resultsHTML += '<li' + targetattr + scoreattr + labelsattr + stemsattr + '>'
                                        + alink + shortdesc + '</li>';
                    }
                    ditasearch.results.done();
                    $("div.resultslist > ol").append(resultsHTML);
        },
        "show"      : function() {
                    $("div.searchresults").show();
                    $("a#clearsearch").removeClass("hidden");
        },
        "hide"      : function() {
                    $("div#searchbox").one("focus click", "input", ditasearch.results.show);
                    $("div.searchresults").hide();
                    $("a#clearsearch").addClass("hidden");
        },
        "clear"     : function() {
                    $("div.searchresults > div.resultslist > ol").empty();
        }
    },
    "remove"        : function() {
                    $("div#searchbox").remove();
    },
    "porter2"       : {
        apos            : "",
        nonwordchars    : "[^a-z']",
        exceptionlist : [
            {"skis" : "ski"},
            {"skies" : "sky" },
            {"dying" : "die" },
            {"lying" : "lie" },
            {"tying" : "tie" },
            {"idly" : "idl" },
            {"gently" : "gentl" },
            {"ugly" : "ugli" },
            {"early" : "earli" },
            {"only" : "onli" },
            {"singly" : "singl" },
            {"sky" : "sky" },
            {"news" : "news" },
            {"howe" : "howe" },
            {"atlas" : "atlas" },
            {"cosmos" : "cosmos" },
            {"bias" : "bias" },
            {"andes" : "andes" }
        ],
        post_s1a_exceptions : [
            {"inning" : "inning"},
            {"outing" : "outing"},
            {"canning" : "canning"},
            {"herring" : "herring"},
            {"earring" : "earring"},
            {"proceed" : "proceed"},
            {"exceed" : "exceed"},
            {"succeed" : "succeed"}
        ],
        s0_sfxs         : /('|'s|'s')$/,
        s1a_replacements : [
            { "suffix" : "sses", "with" : "ss" },
            { "suffix" : "ied", "with" : "i|ie", "complexrule" : "s1a" },
            { "suffix" : "ies", "with" : "i|ie", "complexrule" : "s1a" },
            { "suffix" : "us", "with" : "us" },
            { "suffix" : "ss", "with" : "ss" },
            { "suffix" : "s", "with" : "", "ifprecededby" : "[aeiouy].+" }
        ],
        s1b_replacements : [
                { "suffix" : "eedly", "with" : "ee", "ifin" : "R1" },
                { "suffix" : "ingly", "with" : "", "ifprecededby" : "[aeiouy].*", "complexrule" : "s1b" },
                { "suffix" : "edly", "with" : "", "ifprecededby" : "[aeiouy].*", "complexrule" : "s1b" },
                { "suffix" : "eed", "with" : "ee", "ifin" : "R1" },
                { "suffix" : "ing", "with" : "", "ifprecededby" : "[aeiouy].*", "complexrule" : "s1b" },
                { "suffix" : "ed", "with" : "", "ifprecededby" : "[aeiouy].*", "complexrule" : "s1b" }
        ],
        s2_replacements : [
                { "suffix" : "ization", "with" : "ize", "ifin" : "R1" },
                { "suffix" : "ational", "with" : "ate", "ifin" : "R1" },
                { "suffix" : "fulness", "with" : "ful", "ifin" : "R1" },
                { "suffix" : "ousness", "with" : "ous", "ifin" : "R1" },
                { "suffix" : "iveness", "with" : "ive", "ifin" : "R1" },
                { "suffix" : "tional", "with" : "tion", "ifin" : "R1" },
                { "suffix" : "biliti", "with" : "ble", "ifin" : "R1" },
                { "suffix" : "lessli", "with" : "less", "ifin" : "R1" },
                { "suffix" : "entli", "with" : "ent", "ifin" : "R1" },
                { "suffix" : "ation", "with" : "ate", "ifin" : "R1" },
                { "suffix" : "alism", "with" : "al", "ifin" : "R1" },
                { "suffix" : "aliti", "with" : "al", "ifin" : "R1" },
                { "suffix" : "ousli", "with" : "ous", "ifin" : "R1" },
                { "suffix" : "iviti", "with" : "ive", "ifin" : "R1" },
                { "suffix" : "fulli", "with" : "ful", "ifin" : "R1" },
                { "suffix" : "enci", "with" : "ence", "ifin" : "R1" },
                { "suffix" : "anci", "with" : "ance", "ifin" : "R1" },
                { "suffix" : "abli", "with" : "able", "ifin" : "R1" },
                { "suffix" : "izer", "with" : "ize", "ifin" : "R1" },
                { "suffix" : "ator", "with" : "ate", "ifin" : "R1" },
                { "suffix" : "alli", "with" : "al", "ifin" : "R1" },
                { "suffix" : "bli", "with" : "ble", "ifin" : "R1" },
                { "suffix" : "ogi", "with" : "og", "ifin" : "R1", "ifprecededby" : "l" },
                { "suffix" : "li", "with" : "", "ifin" : "R1", "ifprecededby" : "[cdeghkmnrt]" }
        ],
        s3_replacements : [
                { "suffix" : "ational", "with" : "ate", "ifin" : "R1" },
                { "suffix" : "tional", "with" : "tion", "ifin" : "R1" },
                { "suffix" : "alize", "with" : "al", "ifin" : "R1" },
                { "suffix" : "ative", "with" : "", "ifin" : "R1,R2" },
                { "suffix" : "icate", "with" : "ic", "ifin" : "R1" },
                { "suffix" : "iciti", "with" : "ic", "ifin" : "R1" },
                { "suffix" : "ical", "with" : "ic", "ifin" : "R1" },
                { "suffix" : "ness", "with" : "", "ifin" : "R1" },
                { "suffix" : "ful", "with" : "", "ifin" : "R1" }
        ],
        s4_replacements : [
                { "suffix" : "ement", "with" : "", "ifin" : "R2" },
                { "suffix" : "ance", "with" : "", "ifin" : "R2" },
                { "suffix" : "ence", "with" : "", "ifin" : "R2" },
                { "suffix" : "able", "with" : "", "ifin" : "R2" },
                { "suffix" : "ible", "with" : "", "ifin" : "R2" },
                { "suffix" : "ment", "with" : "", "ifin" : "R2" },
                { "suffix" : "ant", "with" : "", "ifin" : "R2" },
                { "suffix" : "ate", "with" : "", "ifin" : "R2" },
                { "suffix" : "ent", "with" : "", "ifin" : "R2" },
                { "suffix" : "ion", "with" : "", "ifin" : "R2", "ifprecededby" : "[st]" },
                { "suffix" : "ism", "with" : "", "ifin" : "R2" },
                { "suffix" : "iti", "with" : "", "ifin" : "R2" },
                { "suffix" : "ive", "with" : "", "ifin" : "R2" },
                { "suffix" : "ize", "with" : "", "ifin" : "R2" },
                { "suffix" : "ous", "with" : "", "ifin" : "R2" },
                { "suffix" : "ic", "with" : "", "ifin" : "R2" },
                { "suffix" : "er", "with" : "", "ifin" : "R2" },
                { "suffix" : "al", "with" : "", "ifin" : "R2" }
        ],
        s5_replacements : [
                { "suffix" : "e", "with" : "", "complexrule" : "s5" },
                { "suffix" : "l", "with" : "", "ifin" : "R2", "ifprecededby" : "l" }
        ],
        R1 : function(thisword) {
            var exceptions = /^(gener|commun|arsen)/;
            var r1base = /^.*?[aeiouy][^aeiouy]/;
            if (exceptions.test(thisword)) {
                return thisword.replace(exceptions,"");
            } else if (r1base.test(thisword)) {
                return thisword.replace(r1base,"");
            } else {
                return "";
            }
        },
        R2 : function(thisword) {
            thisword = porter2.R1(thisword);
            var r1base = /^.*?[aeiouy][^aeiouy]/;
            if (r1base.test(thisword)) {
                return thisword.replace(r1base,"");
            } else {
                return "";
            }
        },
        endsWithShortSyllable : function(thisword) {
            var eSS = /([^aeiouy][aeiouy][^aeiouywxY]$|^[aeiouy][^aeiouy]$)/;
            return eSS.test(thisword);
        },
        isShort : function(thisword) {
            return (porter2.R1(thisword).length == 0 && porter2.endsWithShortSyllable(thisword));
        },
        keyMatches : function(object) {
            // object is the array object passed from porter2.firstMatch
            var thisword = this[0];
            var wholeword = this[1];
            var suffix = object.suffix || Object.keys(object)[0]; 
            var regex = new RegExp(wholeword ? "^"+ suffix + "$" : suffix + "$");
            if (regex.test(thisword)) {
            }
            return regex.test(thisword);
        },
        firstMatch : function(array,thisword,wholeword) {
            var wholeword = wholeword || false;
            var data = [thisword,wholeword];
            return array.filter(porter2.keyMatches,data)[0] || [];
        },
        stem : function(thisword) {
            // note: porter2.stemOrException subsumed into porter2.stem
            
            thisword = thisword.toLowerCase().replace(porter2.nonwordchars,"");
            var exception = porter2.firstMatch(porter2.exceptionlist,thisword,true); 
            //  exception = array containing first matching object or nothing
            if (thisword.length <= 2) {
                return thisword;
            } else if (exception.length != 0) {
                return exception[thisword];
            } else {
                return porter2.getStem(thisword);
            }
        },
        replace_suffix : function(thisword,array) {
            var replacearray = porter2.firstMatch(array,thisword);
            if (typeof(replacearray) == 'undefined' || replacearray.length == 0) { // no matches
                return thisword;
            }
            var replace = replacearray;
            
            var restrictions = '';
            if (replace.hasOwnProperty("ifin")) {
                restrictions += (replace.ifin.indexOf('R1') > -1 ? 'R1' : '');
                restrictions += (replace.ifin.indexOf('R2') > -1 ? 'R2' : '');
            }
            if (replace.hasOwnProperty("ifprecededby")) {
                restrictions += (replace.ifprecededby.length > 0 ? 'PrecededBy' : '');
            }
            if (replace.hasOwnProperty("complexrule")) {
                restrictions += (replace.complexrule.length > 0 ? 'ComplexRule_'+replace.complexrule : '');
            }
            var suffix = new RegExp(replace.suffix + '$');
            var precededsuffix = new RegExp(replace.ifprecededby + suffix.source);
            
            switch (restrictions) {
                // no restrictions
                case "":
                    thisword = thisword.replace(suffix,replace.with);
                    break;
                    
                // restrictions
                case "R1":
                    if (porter2.R1(thisword).search(suffix) > -1) {
                        thisword = thisword.replace(suffix,replace.with);
                    }
                    break;
                case "R2":
                    if (porter2.R2(thisword).search(suffix) > -1) {
                        thisword = thisword.replace(suffix,replace.with);
                    }
                    break;
                case "R1R2":
                    if (porter2.R1(thisword).search(suffix) > -1 && porter2.R2(thisword).search(suffix) > -1) {
                        thisword = thisword.replace(suffix,replace.with);
                    }
                    break;
                case "PrecededBy":
                    if (thisword.search(precededsuffix) > -1) {
                        thisword = thisword.replace(suffix,replace.with);
                    }
                    break;
                case "R1PrecededBy":
                    if (porter2.R1(thisword).search(suffix) > -1 && thisword.search(precededsuffix) > -1) {
                        thisword = thisword.replace(suffix,replace.with);
                    }
                    break;
                case "R2PrecededBy":
                    if (porter2.R2(thisword).search(suffix) > -1 && thisword.search(precededsuffix) > -1) {
                        thisword = thisword.replace(suffix,replace.with);
                    }
                    break;
                // complex rules
                case "ComplexRule_s1a":
                    precededsuffix = new RegExp('..'+suffix.source);
                    if (thisword.search(precededsuffix) > -1) {
                        thisword = thisword.replace(suffix,'i');
                    } else {
                        thisword = thisword.replace(suffix,'ie');
                    }
                    break;
                case "PrecededByComplexRule_s1b":
                    if (thisword.search(precededsuffix) > -1) {
                        thisword = thisword.replace(suffix,'');
                        if (thisword.search(/(at|bl|iz)$/) > -1) {
                            thisword = thisword + 'e';
                        } else if (thisword.search(/(bb|dd|ff|gg|mm|nn|pp|rr|tt)$/) > -1) {
                            thisword = thisword.replace(/.$/,'');
                        } else if (porter2.isShort(thisword)) {
                            thisword = thisword + 'e';
                        } 
                    }
                    break;
                case "ComplexRule_s5":
                    if ((porter2.R2(thisword).search(suffix) > -1) || (porter2.R1(thisword).search(suffix) > -1) && !(porter2.endsWithShortSyllable(thisword.replace(suffix,'')))) {
                        thisword = thisword.replace(suffix,'');
                    }
                    break;
            }
            return thisword;
        },
        getStem : function(word) {
            var noinitpostrophes = word.replace(/^'/,'');
            var consonantY = noinitpostrophes.replace(/(^|[aeiouy])y/,'$1Y');
            var s0 = consonantY.replace(porter2.s0_sfxs,'');
            var s1a = porter2.replace_suffix(s0,porter2.s1a_replacements);
            var s1b = porter2.replace_suffix(s1a,porter2.s1b_replacements);
            var s1c = s1b.replace(/(.[^aeiouy])[yY]$/,'$1i');
            var s2 = porter2.replace_suffix(s1c,porter2.s2_replacements);
            var s3 = porter2.replace_suffix(s2,porter2.s3_replacements);
            var s4 = porter2.replace_suffix(s3,porter2.s4_replacements);
            var s5 = porter2.replace_suffix(s4,porter2.s5_replacements);
            var post_s1a_exception = porter2.firstMatch(porter2.post_s1a_exceptions,s1a,true);
            if (post_s1a_exception.length != 0) {
                return post_s1a_exception[s1a];
            } else {
                return s5.toLowerCase();
            }
        }
    }
};
