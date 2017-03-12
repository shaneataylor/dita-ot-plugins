# ditasearch plugin

Indexes HTML5 help topics

## Testing
* works with @copy-to?
* works with branch processing/filtering?


## TO DO

* Pass current search terms to loaded topic so can reuse existing search
* When changing search query, scroll to top of results
* Use OT method to define strings (search/loading/noresults) for extensibility
  * http://www.dita-ot.org/dev/dev_ref/plugin-addgeneratedtext.html
  * Add the resulting strings to ditsearch.js
* Index numbers such as 1540 or 15.4.0 or 1,540 
  * Each of these examples should be indexed as identical
  * Keep only the string of digits
  * Update ditasearch.js as well

## Future / Maybe
* Stem words with hyphens (plug-in) by first removing the hyphen
  Is that preferable to treating the parts as two separate words? 
* When indexing adds @words, remove duplicates (stemmer.xsl)
* Use @words to highlight instances in the found topics
* Sort combined user/default synonyms etc (if useful)


