//for testing
document.getElementById("totalButtonReset").addEventListener("click", (event) => {
    localStorage.clear();
    currentSessionHolder(true);
    location.reload()
})


//as per the function name
function getRandomDateWithin24Hours(inputDate) {
    const inputTime = inputDate.getTime();
    const maxOffset = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const randomOffset = random() * maxOffset;
    const randomTime = inputTime + randomOffset;
    return new Date(randomTime);
}

//takes a start and end Date object
//start must be less than end date
//the total duration between start and must be less than 24 hours
//returns a time between the start in the hh:mm:ss format
//does NOT work as intended
function getRandomInputInRange(start, end, isInRange) {
    const startTime = start.getTime();
    const endTime = end.getTime();

    let randomTime;
    if (isInRange) {
        randomTime = random() * Math.abs(endTime - startTime) + startTime;
        return new Date(randomTime).toTimeString().slice(0, 8);
    }
    else
        return getRandomInputInRange(end, start, true);
}

//takes a yyyy,mm,dd and generates random time
//returns a Date object
function getRandomDate(yyyy, mm, dd) {
    const randomHours = Math.floor(random() * 24);      // 0 to 23
    const randomMinutes = Math.floor(random() * 60);    // 0 to 59
    const randomSeconds = Math.floor(random() * 60);    // 0 to 59
    const randomTime = new Date(yyyy, mm - 1, dd, randomHours, randomMinutes, randomSeconds);
    return randomTime;
}

//get random int from 0 to max
function getRandomInt(max) {
    return Math.floor(random() * max);
}
//seeds the random number
// Takes any integer
let m_w = 123456789;
let m_z = 987654321;
const mask = 0xffffffff;
function seed(tmp) {
    const i = Date.now() + tmp
    m_w = (123456789 + i) & mask;
    m_z = (987654321 - i) & mask;
}
// Returns number between 0 (inclusive) and 1.0 (exclusive),
// just like Math.random().
function random() {
    m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & mask;
    m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & mask;
    var result = ((m_z << 16) + (m_w & 65535)) >>> 0;
    result /= 4294967296;
    return result;
}



//generates startDate and endDate that may or may not be on the same day
//the startDate is always less than the endDate
//user input is randomly generated between them
//does NOT work as intended
function automatedTimeComparisonTesting() {
    //set the startDate
    const startDate = getRandomDate(2023, 6, 22);
    //seed the random
    seed(startDate.getHours());
    const endDate = getRandomDateWithin24Hours(startDate);

    //randomly generate user input
    let inRangeCheck = true;
    if (Date.now() % 2 === 0)
        inRangeCheck = false;

    const userInput = getRandomInputInRange(startDate, endDate, inRangeCheck);
    console.log(new Array(startDate, endDate, userInput));
    console.log("hours difference: " + (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60))
    console.log(inRangeCheck + " " + inputInRange(startDate, endDate, userInput));
}

//manuel values for time testing
//same day, between two values in the pm
const testTimeValues1 = [new Date(2023, 08, 08, 23, 00, 00), new Date(2023, 08, 08, 23, 07, 00), "23:05:01"];
//same day, between two values in the am
const testTimeValues2 = [new Date(2023, 08, 08, 00, 59, 59), new Date(2023, 08, 08, 10, 01, 00), "07:00:00"];
//same day, not between them
const testTimeValues3 = [new Date(2023, 08, 08, 23, 00, 00), new Date(2023, 08, 08, 23, 30, 00), "01:29:01"];
//not same day, between them in the pm
const testTimeValues4 = [new Date(2023, 08, 08, 23, 59, 59), new Date(2023, 08, 09, 00, 01, 00), "00:00:01"];
//not same day, between them in the am
const testTimeValues5 = [new Date(2023, 08, 08, 23, 00, 00), new Date(2023, 08, 09, 5, 01, 00), "00:00:01"];
//not same day, between them on 12 am
const testTimeValues6 = [new Date(2023, 08, 08, 23, 00, 00), new Date(2023, 08, 09, 17, 01, 00), "00:00:01"];
//not same day, between them on 12 am
const testTimeValues7 = [new Date(2023, 08, 08, 23, 00, 00), new Date(2023, 08, 09, 23, 01, 00), "00:00:00"];
//not same day, not between them
const testTimeValues8 = [new Date(2023, 08, 08, 23, 07, 00), new Date(2023, 08, 09, 23, 01, 00), "23:05:01"];

const arrayTester = [testTimeValues1, testTimeValues2, testTimeValues3, testTimeValues4, testTimeValues5, testTimeValues6, testTimeValues7, testTimeValues8]
const expectedValues = [true, true, false, true, true, true, true, false]

function testTimeComparison(arrayForTesting, expectedValuesOfArray) {
    arrayForTesting.forEach((dateArray, index) => {
        const t1 = new Date(dateArray[0]).getTime();
        const t2 = new Date(dateArray[1]).getTime();
        console.log(dateArray);
        console.log("Results: " + inputInRange(t1, t2, dateArray[2]));
        console.log("Expected results: " + expectedValuesOfArray[index]);
    });
}