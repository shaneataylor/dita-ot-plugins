# ditasearch plugin

Indexes HTML5 help topics

## Testing
* works with hierarchical file structure
  * Indexes topics in hierarchy (FIXED)
  * Search works from nested topics (TO DO)
* works with @copy-to?
* works with branch processing/filtering?


## TO DO

* Add parameter to skip adding search box & JS to HTML
* Relativize reference to JS for all topics
  * Override processFTR template (in topic.xsl)
  * Override processHDR template also for consistent approach
  * Remove html/footer|header files
  * Update build template 
* Use OT method to define strings (search/loading/noresults) for extensibility
  * http://www.dita-ot.org/dev/dev_ref/plugin-addgeneratedtext.html
  * Add the resulting strings to ditsearch.js
* Index numbers such as 1540 or 15.4.0 or 1,540 
  * Keep only the string of digits
  * Update ditasearch.js as well
* When changing search query, scroll to top of results
* MAYBE: When indexing adds @words, remove duplicates (stemmer.xsl)
* MAYBE: Use @words to highlight instances in the found topics
* MAYBE: Sort combined user/default synonyms etc (if useful)


