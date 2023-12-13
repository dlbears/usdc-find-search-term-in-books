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

/**
 * Simple Assert which checks a condition and throws and error with the specified message if false
 * @param {number} condition - Check condition. 
 * @param {number} end - Error message to throw if false.
 * @returns {null} 
 * */ 
function assert(condition, message) {
  if (!condition) throw "AssertionError: " + message
}

/**
 * Checks if a string/line ends in a hyphen, indicating a hyphenated linebreak.
 * @param {number} str - String to check for hyphen termination. 
 * @returns {boolean} - True if string ends in a hyphen otherwise false.
 * */ 
function checkHyphenBreak(str) {
  return str.length !== 0 && str[str.length - 1] === '-'
}

/**
 * Checks if a string/line starts with any of the defined punctuation marks.
 * @param {string} str - string representing a line to check against leading punctuation marks. 
 * @returns {boolean} - True indicating presence and False indicating no presence.
 * */ 
function checkLeadingPunctuation(str) {
    return str.length !== 0 && ['.', ',', '?', '!', ':', ';', "'", '"'].some(c => c === str[0])
}

/**
 * Creates an array representing the inclusive range between two non-negative integers, where start <= end.
 * @param {number} start - The non-negative start index. 
 * @param {number} end - The last non-negative index to include.
 * @returns {Array} - An inclusive range of indicies from start to end including all integers in between.
 * */ 
function intRangeInclusive(start, end) {
    assert(start <= end, "Invalid range")
    return Array.from({ length: (end + 1) - start }).map((_, i) => i + start)
}

/**
 * Looks back from the next unmatched line position and returns the precise line and character index to resume search from
 * it makes sure to take into account line boundaries when looking back as well the possibility of multi line matches.
 * @param {number} nextUnmatchPosition - The index representing the next unmatched line. 
 * @param {Array} contentArray - An array of all the lines for the current document.
 * @param {number} lookbackAmount - The amount of characters to lookback.
 * @returns {Array} - Of size two where the first is the line to start at and the second is the character index to continue search from.
 * */ 
function skipAhead(nextUnmatchPosition, contentArray, lookbackAmount) {
    let remainLookback = lookbackAmount - (checkLeadingPunctuation(contentArray[nextUnmatchPosition]["Text"]) || checkHyphenBreak(contentArray[nextUnmatchPosition - 1]["Text"]) ? 1 : 2)
    let skipContentPosition = nextUnmatchPosition,
        skipContentIndex = 0
    if (remainLookback <= 0) return [skipContentPosition, skipContentIndex] // Short lookback only from first character to start of line (which potentially contains a space)
    while (remainLookback > 0) { // Lookback spans back one or more lines
        skipContentPosition--
        if (skipContentPosition === 0) {
            let offset = checkHyphenBreak(contentArray[skipContentPosition]["Text"]) ? 2 : 1
            skipContentIndex = contentArray[0]["Text"].length - (remainLookback + offset)
            remainLookback = 0
        } else {
            let offset = 0
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
            }
        }
    }

    return [
        skipContentPosition, 
        skipContentIndex
    ]
}

/**
 * Looks ahead in the content to get accumulate a string to match against the search term.
 * @param {Array} contentArray - The content array of lines of the current document.
 * @param {number} initialIndex - The line index to start looking from.
 * @param {number} initialPosition - The index within the current line to start looking from.
 * @param {number} lookaheadAmount - The amount of characters to accumulate.
 * @returns {object || string} - An object representing a match spanning multiple lines or a string representing a substring of the current line to be matched against.
 * */ 
function lookAhead(contentArray, initialIndex, initialPosition, lookaheadAmount) {
    const initHyphenBreak = checkHyphenBreak(contentArray[initialIndex]["Text"])
    if (lookaheadAmount <= contentArray[initialIndex]["Text"].length - (initialPosition + (initHyphenBreak ? 1 : 0))) { // lookahead fits in the current line
        return contentArray[initialIndex]["Text"].slice(initialPosition, initialPosition + lookaheadAmount)
    } else { // lookahead spans multiple lines
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
        return {
            matchString: content,
            matchRange: intRangeInclusive(initialIndex, currentIndex)
        }
    }
}

/**
 * A reducer function to count up characters across lines while accounting for line boundaries.
 * @param {number} p - The current count of characters.
 * @param {object} c - A JS Object representing a single line of content from a documents.
 * @param {number} i - Current index through the array being reduced.
 * @param {Array} arr - A readonly reference to the array being iterated through.
 * @returns {number} - The new or current count of characters.
 * */ 
function getRemainingCharacters(p, c, i, arr) {
    assert(typeof c === "object", `Document->Content[${i}] is not an object`)
    assert(typeof c["Text"] === "string", `Document->Content[${i}]->Text is not a string`) 
    assert(typeof c["Page"] === "number", `Document->Content[${i}]->Page is not a number`)
    assert(typeof c["Line"] === "number", `Document->Content[${i}]->Line is not a number`)
    const ct = c["Text"]
    if (ct.trim() === "") return p
    if (i === 0 || checkHyphenBreak(arr[i - 1]["Text"]) || !checkLeadingPunctuation(ct)) {
        return p + (checkHyphenBreak(ct) ? ct.length - 1 : ct.length + 1) 
    } else {
        return p + (checkHyphenBreak(ct) ? ct.length - 2 : ct.length - 1)
    }
}


/**
 * Searches for matches in scanned text.
 * @param {string} searchTerm - The word or term we're searching for. 
 * @param {JSON} scannedTextObj - A JSON object representing the scanned text.
 * @returns {JSON} - Search results.
 * */ 
function findSearchTermInBooks(searchTerm, scannedTextObj) {
    assert(typeof searchTerm === "string", "searchTerm is not a string")
    assert(typeof scannedTextObj === "object", "scannedTextObj is not an object")
    
    const emptyResult = {
        "SearchTerm": searchTerm,
        "Results": []
    }

    if (searchTerm.trim() === "") return emptyResult // Empty Search case
    
    return scannedTextObj.reduce((searchRes, currentDoc, k) => {
        assert(typeof currentDoc === "object", `Document[${k}] is not an object`)
        assert(typeof currentDoc["ISBN"] === "string", `Document[${k}]->ISBN is not a string`)
        assert(typeof currentDoc["Title"] === "string", `Document[${k}]->Title is not a string`)
        assert(Array.isArray(currentDoc["Content"]), `Document[${k}]->Content is not an array`)
        const ISBN = currentDoc["ISBN"],
              Content = currentDoc["Content"]

        const totalCharacters = Content.reduce(getRemainingCharacters, 0) // Add all characters, minus 1 for hyphenated linebreaks, plus 1 for spaces between lines
        let contentMatches = new Set()
        let remainingCharacters = totalCharacters
        if (remainingCharacters === 0 || remainingCharacters < searchTerm.length) return searchRes // Initial Base case, not enough characters for search
        let searchPos = 0,
            contentPos = 0,
            currentContent = Content[contentPos]["Text"]
        while (currentContent.trim() === "") {
            contentPos++
            currentContent = Content[contentPos]["Text"] 
        }
        for (let i = 0; i < currentContent.length;) {
            if (remainingCharacters < searchTerm.length || contentMatches.size === Content.length) break; // Iterative Base case, not enough characters to get a match or all content is matched no further search is necessary
            const matchOnLinebreak = (i === 0 && contentPos > 0 && !checkHyphenBreak(Content[contentPos - 1]["Text"]) && !checkLeadingPunctuation(Content[contentPos]["Text"]) && searchTerm[searchPos] === " ")
            if (currentContent[i] === searchTerm[searchPos] || matchOnLinebreak) {
                const lookAheadResult = lookAhead(Content, contentPos, i, searchTerm.length - (matchOnLinebreak ? 1 : 0))
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

const CaseSensitiveTestCases = [
  ["Eyes", twentyLeaguesIn, {
    "SearchTerm": "Eyes",
    "Results": []
  }],
  ["Now simply went on by her own momentum.  The darkness was then profound", highSkipDuplicateSpace, {
    "SearchTerm": "Now simply went on by her own momentum.  The darkness was then profound",
    "Results": []
  }],
  ["I", twentyLeaguesIn, {
    "SearchTerm": "I",
    "Results": [
      {
        "ISBN": "9780000528531",
        "Page": 31,
        "Line": 10
      }
    ]
  }],
  ["The darkness", interspersedEmptyLineSpace, {
    "SearchTerm": "The darkness",
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
  ["The", highSkipDuplicateSpace, {
    "SearchTerm": "The",
    "Results": [
      {
        "ISBN": "9780000528531",
        "Page": 31,
        "Line": 8
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
        "Line": 12
      }
    ]
  }]
]

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
    console.log("Case Sensitive Test Cases")
    CaseSensitiveTestCases.forEach(testRunner)
}

runAllTests()
