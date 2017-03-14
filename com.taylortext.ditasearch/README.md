# ditasearch plugin

Indexes HTML5 help topics

## Testing
* searchtitle still works?
* works with @copy-to?
* works with branch processing/filtering?


## TO DO

* Use OT method to define strings for extensibility
  * http://www.dita-ot.org/dev/dev_ref/plugin-addgeneratedtext.html
  * strings include:
    * Search
    * Loading
    * No results
    * No title (in stemmer.xsl) 
  * Add the resulting strings to ditsearch.js

## Future Enhancements
* When changing search query, scroll to top of results
* Pass current search terms to loaded topic so can reuse existing search
* Use @words to highlight instances in the found topics
* Sort combined user/default synonyms etc (if useful)


