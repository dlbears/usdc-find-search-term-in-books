/** 
 * RECOMMENDATION
 * 
 * To test your code, you should open "tester.html" in a web browser.
 * You can then use the "Developer Tools" to see the JavaScript console.
 * There, you will see the results unit test execution. You are welcome
 * to run the code any way you like, but this is similar to how we will
 * run your code submission.
 * 
 * The Developer Tools in Chrome are available under the "..." menu, 
 * futher hidden under the option "More Tools." In Firefox, they are 
 * under the hamburger (three horizontal lines), also hidden under "More Tools." 
 */

function checkHyphenBreak(str) {
    return str[str.length - 1] === '-'
}

function intRangeInclusive(start, end) {
    return Array.from({ length: (end + 1) - start }).map((_, i) => i + start)
}

function lookAhead(contentArray, initialIndex, initialPosition, lookaheadAmount) {
    const initHyphenBreak = checkHyphenBreak(contentArray[initialIndex]["Text"])
    console.log(" Lookahead amount = " + lookaheadAmount, "  Remaining = " + (contentArray[initialIndex]["Text"].length - (initialPosition + (initHyphenBreak ? 1 : 0))))
    if (lookaheadAmount <= contentArray[initialIndex]["Text"].length - (initialPosition + (initHyphenBreak ? 1 : 0))) {
        return contentArray[initialIndex]["Text"].slice(initialPosition, initialPosition + lookaheadAmount)
    } else {
        let content = contentArray[initialIndex]["Text"].slice(initialPosition, contentArray[initialIndex]["Text"].length - (initHyphenBreak ? 1 : 0)),
            prevHyphen = initHyphenBreak,
            remainingLookahead = lookaheadAmount - (contentArray[initialIndex]["Text"].length - (initialPosition + (initHyphenBreak ? 1 : 0))),
            currentIndex = initialIndex,
            contentAdd = ""
        while (remainingLookahead > 0 && currentIndex + 1 < contentArray.length) {
            currentIndex++
            contentAdd = (prevHyphen ? "" : " ")
            remainingLookahead -= (prevHyphen ? 0 : 1)
            prevHyphen = checkHyphenBreak(contentArray[currentIndex]["Text"])
            contentAdd += (contentArray[currentIndex]["Text"].length > remainingLookahead
                            ? contentArray[currentIndex]["Text"].slice(0, remainingLookahead)
                            : contentArray[currentIndex]["Text"].slice(0, contentArray[currentIndex]["Text"].length - (prevHyphen ? 1 : 0)))
            remainingLookahead -= contentAdd.length
            content += contentAdd
            contentAdd = ""
        }
        console.log("content = ", content)
        return {
            matchString: content,
            matchRange: intRangeInclusive(initialIndex, currentIndex)
        }
    }
}

// Assume if that new lines do not start with a space between words from the preceeding line
// function mergeLines(acc, line) {
//     const lineHyphenBreak = line[line.length - 1] === '-'
//     return acc + (lineHyphenBreak ? line.splice(0, line.length - 1) : line + " ")
// }

/**
 * Searches for matches in scanned text.
 * @param {string} searchTerm - The word or term we're searching for. 
 * @param {JSON} scannedTextObj - A JSON object representing the scanned text.
 * @returns {JSON} - Search results.
 * */ 
// Assuming scanned content array is ordered first by Page and then by Line 
// Assuming If a match is found early in a piece of content early termination is not an option since it may also contain a leading (prefix) match into the next content which on its own may not contain a contiguous match
function findSearchTermInBooks(searchTerm, scannedTextObj) {
    /** You will need to implement your search and 
     * return the appropriate object here. */
    return scannedTextObj.reduce((searchRes, currentDoc) => {
        const ISBN = currentDoc["ISBN"],
              Content = currentDoc["Content"]

        const totalCharacters = Content.reduce((p, c) => p + (c["Text"][c["Text"].length - 1] === '-' ? c["Text"].length - 1 : c["Text"].length + 1), 0) // Add all characters, minus 1 for hyphenated linebreaks, plus 1 for spaces between lines
        let contentMatches = new Set()
        let remainingCharacters = totalCharacters
        let searchPos = 0,
            contentPos = 0,
            currentContent = Content[contentPos]["Text"]
        console.log("Pre for")
        for (let i = 0; i < currentContent.length;) {
            if (remainingCharacters < searchTerm.length) break; // Base case, not enough characters to get a match
            if (contentMatches.size === Content.length) break; // Base case, if all content is matched no further search is necessary
            if (currentContent[i] === searchTerm[searchPos]) {
                console.log("Pre lookahead")
                const lookAheadResult = lookAhead(Content, contentPos, i, searchTerm.length)
                console.log("Lookahead res = " + JSON.stringify(lookAheadResult))
                if (typeof lookAheadResult === "string") {
                    if (searchTerm === lookAheadResult) {
                        contentMatches.add(contentPos)
                         //Skip Ahead logic
                    } 
                    i++
                } else {
                    const { matchString, matchRange } = lookAheadResult
                    if (searchTerm === matchString) {
                        matchRange.forEach(x => contentMatches.add(x))
                         //Skip Ahead logic
                    }
                    i++
                }
            } else {
                i++
            }
            if (i >= currentContent.length && contentPos + 1 < Content.length) {
                contentPos++
                currentContent = Content[contentPos]["Text"]
                i = 0
            }
        } 
        return {
            "SearchTerm": searchRes["SearchTerm"],
            "Results": [...searchRes["Results"], ...Array.from(contentMatches).map(i => ({ "ISBN": ISBN, "Page": Content[i]["Page"], "Line": Content[i]["Line"]}))]
        }
        // return Content.reduce((docRes, currentContent, currentIndex) => {
        //     //matchOverContent(searchTerm, currentIndex, contentArray)
        //     currentContent.reduce((ms, char) => {

        //     }, [])
        //     let matches = []
        //     let trackingMatch = false
        //     let searchIndex = 0
        //     for (let contentIndex = 0; contentIndex < currentContent.length; contentIndex++) {
        //         let isFinalChar = contentIndex === currentContent.length - 1
        //         if (trackingMatch && isFinalChar) {
        //             if (currentContent[contentIndex] === '-') {

        //             } else if (currentContent[contentIndex] === searchTerm[searchIndex]) {
        //                 searchIndex++
        //             }
        //         }
        //     }
        //     return matches
        // }, [])
    }, {
        "SearchTerm": searchTerm,
        "Results": []
    })
}

/** Example input object. */
const twentyLeaguesIn = [
    {
        "Title": "Twenty Thousand Leagues Under the Sea",
        "ISBN": "9780000528531",
        "Content": [
            {
                "Page": 31,
                "Line": 8,
                "Text": "now simply went on by her own momentum.  The dark-"
            },
            {
                "Page": 31,
                "Line": 9,
                "Text": "ness was then profound; and however good the Canadian\'s"
            },
            {
                "Page": 31,
                "Line": 10,
                "Text": "eyes were, I asked myself how he had managed to see, and"
            } 
        ] 
    }
]
    
/** Example output object */
const twentyLeaguesOut = {
    "SearchTerm": "the",
    "Results": [
        {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 9
        }
    ]
}

/*
 _   _ _   _ ___ _____   _____ _____ ____ _____ ____  
| | | | \ | |_ _|_   _| |_   _| ____/ ___|_   _/ ___| 
| | | |  \| || |  | |     | | |  _| \___ \ | | \___ \ 
| |_| | |\  || |  | |     | | | |___ ___) || |  ___) |
 \___/|_| \_|___| |_|     |_| |_____|____/ |_| |____/ 
                                                      
 */

/* We have provided two unit tests. They're really just `if` statements that 
 * output to the console. We've provided two tests as examples, and 
 * they should pass with a correct implementation of `findSearchTermInBooks`. 
 * 
 * Please add your unit tests below.
 * */

/** We can check that, given a known input, we get a known output. */
const test1result = findSearchTermInBooks("the", twentyLeaguesIn);
if (JSON.stringify(twentyLeaguesOut) === JSON.stringify(test1result)) {
    console.log("PASS: Test 1");
} else {
    console.log("FAIL: Test 1");
    console.log("Expected:", twentyLeaguesOut);
    console.log("Received:", test1result);
}

/** We could choose to check that we get the right number of results. */
const test2result = findSearchTermInBooks("the", twentyLeaguesIn); 
if (test2result.Results.length == 1) {
    console.log("PASS: Test 2");
} else {
    console.log("FAIL: Test 2");
    console.log("Expected:", twentyLeaguesOut.Results.length);
    console.log("Received:", test2result.Results.length);
}

console.log("Test 1 = " + JSON.stringify(test1result, null, 2))
console.log("Test 2 = " + JSON.stringify(test2result, null, 2))
console.log("Test 3 = " + JSON.stringify(findSearchTermInBooks("darkness", twentyLeaguesIn), null, 2))
console.log("Test 4 = " + JSON.stringify(findSearchTermInBooks("the Canadian\'s eyes", twentyLeaguesIn), null, 2))
console.log("Test 5 = " + JSON.stringify(findSearchTermInBooks("  The darkness was then profound; and however good the Canadian\'s eyes were,", twentyLeaguesIn), null, 2))

// Positive Test Cases
/*
- Empty Search Term => Empty Result
- Empty Search Space => Empty Result
- Single-word search, normal and along the hyphenated linebreak
- Single-word search, hyphenated compound, both where the word is within a line(s) and where it is on a hyphenated linebreak "well-\n-known"
- Multi-word search term that is only present in one line
- Multi-word search term that spans multiple lines (with and without hyphenated linebreaks)
*/
// Negative Test Cases
/*
- Incorrect search space schema 
- Inproperly hyphenated linebreak on compound word (edge case - improperly normalized search space)
- Line breaks in the search string (edge case - single line search term)
- hyphenated compound with unhyphenated search term (edge case - sensitive to special characters)
- whitespace discrepancy between words either in search space or term (edge case - precise/exact search not a similarity search; would be more challenging/complex and require tuning of how to weigh case-sensitivity in similar matches)
- Expectation of multiple results on the same line; justification allows for faster unique search over shorter terms, can simply be added on via matchAll (edge case - at most one result per line)
*/
// Case Sensitive Test Cases
// Single word (matching and non matching)
// Multi word (matching, non matching, and spanning)
