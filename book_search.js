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

function checkLeadingPunctuation(str) {
    return ['.', ',', '?', '!', ':', ';', "'", '"'].some(c => c === str[0])
}

function intRangeInclusive(start, end) {
    return Array.from({ length: (end + 1) - start }).map((_, i) => i + start)
}

function skipAhead(nextUnmatchPosition, contentArray, lookbackAmount) {

    let remainLookback = lookbackAmount - (checkLeadingPunctuation(contentArray[nextUnmatchPosition]["Text"]) || checkHyphenBreak(contentArray[nextUnmatchPosition - 1]["Text"]) ? 1 : 2)
    let skipContentPosition = nextUnmatchPosition,
        skipContentIndex = 0
    if (remainLookback <= 0) return [skipContentPosition, skipContentIndex]
    while (remainLookback > 0) {
        skipContentPosition--
        if (skipContentPosition === 0) {
            let offset = checkHyphenBreak(contentArray[skipContentPosition]["Text"]) ? 2 : 1
            skipContentIndex = contentArray[0]["Text"].length - (remainLookback + offset)
            remainLookback = 0
        } else {
            let offset = 0
            // console.log("pos = " + skipContentPosition)
            if (contentArray[skipContentPosition]["Text"].trim() === "") {
                continue
            }
            if (checkHyphenBreak(contentArray[skipContentPosition]["Text"])) offset++
            if (checkLeadingPunctuation(contentArray[skipContentPosition]["Text"])) offset--
            if (remainLookback <= contentArray[skipContentPosition]["Text"].length - offset) {
                skipContentIndex = contentArray[skipContentPosition]["Text"].length - (remainLookback + offset)
                remainLookback = 0
            } else {
                remainLookback -= (contentArray[skipContentPosition]["Text"].length - offset)
                //skipContentPosition-- 
            }
        }
    }

    return [
        skipContentPosition, 
        skipContentIndex
    ]
}

function lookAhead(contentArray, initialIndex, initialPosition, lookaheadAmount) {
    const initHyphenBreak = checkHyphenBreak(contentArray[initialIndex]["Text"])
    // console.log(" Lookahead amount = " + lookaheadAmount, "  Remaining = " + (contentArray[initialIndex]["Text"].length - (initialPosition + (initHyphenBreak ? 1 : 0))))
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
            if (contentArray[currentIndex]["Text"].trim() === "") continue
            contentAdd = (prevHyphen || checkLeadingPunctuation(contentArray[currentIndex]["Text"]) ? "" : " ")
            remainingLookahead -= (prevHyphen || checkLeadingPunctuation(contentArray[currentIndex]["Text"]) ? 0 : 1)
            prevHyphen = checkHyphenBreak(contentArray[currentIndex]["Text"])
            contentAdd += (contentArray[currentIndex]["Text"].length > remainingLookahead
                            ? contentArray[currentIndex]["Text"].slice(0, remainingLookahead)
                            : contentArray[currentIndex]["Text"].slice(0, contentArray[currentIndex]["Text"].length - (prevHyphen ? 1 : 0)))
            remainingLookahead -= contentAdd.length
            content += contentAdd
            contentAdd = ""
        }
        // console.log("content = ", content)
        return {
            matchString: content,
            matchRange: intRangeInclusive(initialIndex, currentIndex)
        }
    }
}

function getRemainingCharacters(p, c, i, arr) {
    // Add assertions for all Content here
    const ct = c["Text"]
    if (ct.trim() === "") return p
    if (i === 0 || checkHyphenBreak(arr[i - 1]["Text"]) || !checkLeadingPunctuation(ct)) {
        return p + (checkHyphenBreak(ct) ? ct.length - 1 : ct.length + 1) 
    } else {
        return p + (checkHyphenBreak(ct) ? ct.length - 2 : ct.length - 1)
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
    const emptyResult = {
        "SearchTerm": searchTerm,
        "Results": []
    }

    if (searchTerm.trim() === "") return emptyResult 
    
    return scannedTextObj.reduce((searchRes, currentDoc) => {
        const ISBN = currentDoc["ISBN"],
              Content = currentDoc["Content"]

        const totalCharacters = Content.reduce(getRemainingCharacters, 0) // Add all characters, minus 1 for hyphenated linebreaks, plus 1 for spaces between lines
        let contentMatches = new Set()
        let remainingCharacters = totalCharacters
        if (remainingCharacters === 0 || remainingCharacters < searchTerm.length) return searchRes
        let searchPos = 0,
            contentPos = 0,
            currentContent = Content[contentPos]["Text"]
        while (currentContent.trim() === "") {
            contentPos++
            currentContent = Content[contentPos]["Text"] 
        }
        // console.log("Pre for")
        for (let i = 0; i < currentContent.length;) {
            // console.log("i = " + i + " remaining chars = " + remainingCharacters)
            if (remainingCharacters < searchTerm.length || contentMatches.size === Content.length) break; // Base case, not enough characters to get a match or all content is matched no further search is necessary
            const matchOnLinebreak = (i === 0 && contentPos > 0 && !checkHyphenBreak(Content[contentPos - 1]["Text"]) && !checkLeadingPunctuation(Content[contentPos]["Text"]) && searchTerm[searchPos] === " ")
            if (currentContent[i] === searchTerm[searchPos] || matchOnLinebreak) {
                // console.log("Pre lookahead")
                const lookAheadResult = lookAhead(Content, contentPos, i, searchTerm.length - (matchOnLinebreak ? 1 : 0))
                // console.log("Lookahead res = " + JSON.stringify(lookAheadResult))
                if (typeof lookAheadResult === "string") {
                    if (searchTerm === (matchOnLinebreak ? " " : "") + lookAheadResult) {
                        contentMatches.add(contentPos)
                        if (contentPos + 1 >= Content.length) break
                        const [skipContentPos, skipI] = skipAhead(contentPos + 1, Content, searchTerm.length) 
                        contentPos = skipContentPos
                        currentContent = Content[contentPos]["Text"]
                        i = skipI 
                        if (contentPos === 0) {
                            remainingCharacters = [ { ...Content[0], "Text": Content[0]["Text"].slice(i) } ].concat(Content.slice(1)).reduce(getRemainingCharacters, 0)
                        } else if (contentPos === Content.length - 1) {
                            remainingCharacters = currentContent.length + (i === 0 ? ((checkHyphenBreak(Content[contentPos - 1]["Text"]) || checkLeadingPunctuation(Content[contentPos]["Text"])) ? 0 : 1) : currentContent.slice(i).length)
                        } else {
                            remainingCharacters = [ { ...Content[contentPos], "Text": Content[contentPos]["Text"].slice(i) } ].concat(Content.slice(contentPos + 1)).reduce(getRemainingCharacters, (i === 0 && !(checkHyphenBreak(Content[contentPos - 1]["Text"]) || checkLeadingPunctuation(Content[contentPos]["Text"]))) ? 1 : 0) 
                        }
                        //remainingCharacters = (contentPos < Content.length - 1 ? Content.slice(contentPos + 1) : Content.slice(contentPos)).reduce(getRemainingCharacters, ) //resuse reducer
                        //Skip Ahead logic
                         continue
                    } 
                } else {
                    const { matchString, matchRange } = lookAheadResult
                    if (searchTerm === (matchOnLinebreak ? " " : "") + matchString) {
                        matchRange.forEach(x => contentMatches.add(x))
                        if (matchRange[matchRange.length - 1] + 1 >= Content.length) break
                        const [skipContentPos, skipI] = skipAhead(matchRange[matchRange.length - 1] + 1, Content, searchTerm.length)
                        contentPos = skipContentPos
                        currentContent = Content[contentPos]["Text"]
                        i = skipI
                        //remainingCharacters = // reuse reducer 
                        //Skip Ahead logic
                        if (contentPos === 0) {
                            remainingCharacters = [ { ...Content[0], "Text": Content[0]["Text"].slice(i) } ].concat(Content.slice(1)).reduce(getRemainingCharacters, 0)
                        } else if (contentPos === Content.length - 1) {
                            remainingCharacters = currentContent.length + (i === 0 ? ((checkHyphenBreak(Content[contentPos - 1]["Text"]) || checkLeadingPunctuation(Content[contentPos]["Text"])) ? 0 : 1) : currentContent.slice(i).length)
                        } else {
                            remainingCharacters = [ { ...Content[contentPos], "Text": Content[contentPos]["Text"].slice(i) } ].concat(Content.slice(contentPos + 1)).reduce(getRemainingCharacters, (i === 0 && !(checkHyphenBreak(Content[contentPos - 1]["Text"]) || checkLeadingPunctuation(Content[contentPos]["Text"]))) ? 1 : 0) 
                        }
                         continue
                    }
                }
            }
            if ((i + 1 >= currentContent.length || (currentContent[i + 1] === '-' && i + 1 === currentContent.length - 1)) && contentPos + 1 < Content.length) {
                remainingCharacters--
                if (remainingCharacters < searchTerm.length) continue
                contentPos++
                currentContent = Content[contentPos]["Text"]
                i = 0
                while (currentContent.trim() === "") {
                    contentPos++
                    currentContent = Content[contentPos]["Text"]
                }
                continue
            }
            i++
            remainingCharacters--
        } 
        return {
            "SearchTerm": searchRes["SearchTerm"],
            "Results": [...searchRes["Results"], ...Array.from(contentMatches).map(i => ({ "ISBN": ISBN, "Page": Content[i]["Page"], "Line": Content[i]["Line"]}))]
        }
    }, emptyResult)
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

const emptySearchSpace = [],
      missingContentSpace = [
        {
            "Title": "Twenty Thousand Leagues Under the Sea",
            "ISBN": "9780000528531",
            "Content": [] 
        }
      ],
      unhyphenatedPunctuationBreakSpace = [
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
                    "Text": "ness was then profound; and however 'good the Canadian\'s"
                },
                {
                    "Page": 31,
                    "Line": 10,
                    "Text": "  "
                },
                {
                    "Page": 31,
                    "Line": 11,
                    "Text": "' eyes were, I asked myself how he had managed to see, and"
                } 
            ] 
        }
      ],
      emptyLineSpace = [
        {
            "Title": "Twenty Thousand Leagues Under the Sea",
            "ISBN": "9780000528531",
            "Content": [
                {
                    "Page": 31,
                    "Line": 8,
                    "Text": ""
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
      ],
      interspersedEmptyLineSpace = [{
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
                "Text": ""
            },
            {
                "Page": 31,
                "Line": 10,
                "Text": "  "
            },
            {
                "Page": 31,
                "Line": 11,
                "Text": "ness was then profound; and however good the Canadian\'s"
            },
            {
                "Page": 31,
                "Line": 12,
                "Text": "eyes were, I asked myself how he had managed to see, and"
            } 
        ] 
    }],
    highSkipDuplicateSpace = [{
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
                "Text": ""
            },
            {
                "Page": 31,
                "Line": 10,
                "Text": "  "
            },
            {
                "Page": 31,
                "Line": 11,
                "Text": "ness was then profound; and however good the Canadian\'s now sim-"
            },
            {
                "Page": 31,
                "Line": 12,
                "Text": "ply went on by her own momentum.  The darkness was then profound"
            }, 
        ] 
    },
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
                "Text": ""
            },
            {
                "Page": 31,
                "Line": 10,
                "Text": "  "
            },
            {
                "Page": 31,
                "Line": 11,
                "Text": "ness was then profound; and however good the Canadian\'s now sim-"
            },
            {
                "Page": 31,
                "Line": 12,
                "Text": "ply went on by her own momentum.  The darkness was then profound"
            }, 
        ] 
    }],
    notEnoughContentSpace = [{
        "Title": "Twenty Thousand Leagues Under the Sea",
        "ISBN": "9780000528531",
        "Content": [
            {
                "Page": 31,
                "Line": 8,
                "Text": "ey"
            }
        ] 
    }]
    
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
const PositiveTestCases = [
    ["the", twentyLeaguesIn, twentyLeaguesOut],
    ["darkness", twentyLeaguesIn, {
        "SearchTerm": "darkness",
        "Results": [
          {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 8
          },
          {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 9
          }
        ]
      }],
    ["the Canadian\'s eyes", twentyLeaguesIn, {
        "SearchTerm": "the Canadian's eyes",
        "Results": [
          {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 9
          },
          {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 10
          }
        ]
      }],
    ["  The darkness was then profound; and however good the Canadian\'s eyes were,", twentyLeaguesIn, {
        "SearchTerm": "  The darkness was then profound; and however good the Canadian's eyes were,",
        "Results": [
          {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 8
          },
          {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 9
          },
          {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 10
          }
        ]
      }],
    ["a", twentyLeaguesIn, {
        "SearchTerm": "a",
        "Results": [
          {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 8
          },
          {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 9
          },
          {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 10
          }
        ]
      }],
    [" eyes", twentyLeaguesIn, {
        "SearchTerm": " eyes",
        "Results": [
          {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 10
          }
        ]
      }],
      ["ness", emptyLineSpace, {
        "SearchTerm": "ness",
        "Results": [
          {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 9
          }
        ]
      }], 
      ["darkness", interspersedEmptyLineSpace, {
        "SearchTerm": "darkness",
        "Results": [
          {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 8
          },
          {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 9
          },
          {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 10
          },
          {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 11
          }
        ]
      }],
      ["'good the Canadian\'s'", unhyphenatedPunctuationBreakSpace, {
        "SearchTerm": "'good the Canadian\'s'",
        "Results": [
          {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 9
          },
          {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 10
          },
          {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 11
          }
        ]
      }],
      ["now simply went on by her own momentum.  The darkness was then profound", highSkipDuplicateSpace, {
        "SearchTerm": "now simply went on by her own momentum.  The darkness was then profound",
        "Results": [
          {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 8
          },
          {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 9
          },
          {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 10
          },
          {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 11
          },
          {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 12
          },
          {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 8
          },
          {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 9
          },
          {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 10
          },
          {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 11
          },
          {
            "ISBN": "9780000528531",
            "Page": 31,
            "Line": 12
          }
        ]
      }]


]

const NegativeTestCases = [["", twentyLeaguesIn, {
    "SearchTerm": "",
    "Results": []
  }],
  ["   ", twentyLeaguesIn, {
    "SearchTerm": "   ",
    "Results": []
  }],
  ["eyes", emptySearchSpace, {
    "SearchTerm": "eyes",
    "Results": []
  }],
  ["eyes", missingContentSpace, {
    "SearchTerm": "eyes",
    "Results": []
  }], 
["eyes", notEnoughContentSpace, {
    "SearchTerm": "eyes",
    "Results": []
  }]]

const testRunner = (val, i) => {
    const [term, space, expected] = val
    const result = findSearchTermInBooks(term, space)
    const testTag = ` [Test ${(i + 1)}]: `,
          equalityTest = JSON.stringify(result) === JSON.stringify(expected),
          lengthTest = result["Results"].length === expected["Results"].length
    
    if (equalityTest) console.log("PASS" + testTag + "Result equals Expectation")
    else {
        console.log("FAIL" + testTag + "Results do not equal Expectation")
        console.log(`Expected Result: ${JSON.stringify(expected, null, 2)}\nResult recieved: ${JSON.stringify(result, null, 2)}`)
    }
    
    if (lengthTest) console.log("PASS" + testTag + "Result length equals Expected length")
    else {
        console.log("FAIL" + testTag + "Result length does not equal Expected length")
        console.log(`Expected Length: ${expected["Results"].length}\nResult Length: ${result["Results"].length}`)
    }
}

const runAllTests = () => {
    console.log("Positive Test Cases")
    PositiveTestCases.forEach(testRunner)
    console.log("Negative Test Cases")
    NegativeTestCases.forEach(testRunner)
}

runAllTests()
