# Technical Notes
This file contains some notes on some more technical details about this project.

### 1. Fetching names from Rate My Prof (RMP)
Since the URLs for professors on RMP are not related to their names, we use the search feature on the website to list the top 8 names returned from the result. The URL to search the website is `https://www.ratemyprofessors.com/search/professors/1452?q=` and append the name at the end. `1452` is the ID for the University of Ottawa on RMP, so we can narrow down the name search to just this school.

### 2. Getting the best results from an RMP search
UOZone might list a professors middle name or a hyphonated name. I find that for best results we should ignore the middle name, and take the first part of a hyphonated name. For names that contain accented letters, it seems to be best to remove the accents on letters.

### 3. Caching results
The extension caches results from RMP in local storage. The data is stored with a timestamp so that we can reuse data from the last hour, otherwise fetch new data.