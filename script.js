/*
storedParticipant = {
    name: Nahif,
    ID: 23103243,
    Category: Senior,
    handle: Nahif_Reza_99
}
*/

let startDateUnix = null;
let endDateUnix = null;
let seniorCategoryData = [];
let femaleCategoryData = [];
let juniorCategoryData = [];

async function loadData() {
    const response = await fetch('cp_data.json');
    const data = await response.json();
        
    seniorCategoryData = data.seniorCategoryData;
    juniorCategoryData = data.juniorCategoryData;
    femaleCategoryData = data.femaleCategoryData;

    console.log("HI");
}

function setDefaultDates() {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    const startDate = new Date(today);
    endDateUnix = Math.floor(today.getTime() / 1000); // Convert endDate to UNIX

    startDate.setMonth(today.getMonth() - 1);
    const startDateString = startDate.toISOString().split('T')[0]; 
    startDateUnix = Math.floor(startDate.getTime() / 1000);
    
    document.getElementById('start-date').value = startDateString;
    document.getElementById('end-date').value = endDate;
}

window.addEventListener('load', loadData);
window.addEventListener('load', setDefaultDates);

document.getElementById('stats-form').addEventListener('submit', function (e) {
    e.preventDefault(); 

    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('loading').classList.add('show');
  
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    fetchData()
      .then(data => displayResults(data))
      .catch(error => displayError(error));
});

async function getDataFromCodeforces(handle) {
    const api = `https://codeforces.com/api/user.status?handle=${handle}&from=1&count=200`;
    const response = await fetch(api);
    const data = await response.json();

    let solvedProblem = 0;
    let totalScore = 0;
    let solvedProblemList = [];

    if(data.status === "OK") {
        for(const problem of data.result) {
            if(problem.creationTimeSeconds >= startDateUnix && problem.creationTimeSeconds <= endDateUnix) {
                solvedProblemList.push(problem.problem.name);
                solvedProblem += 1;
                if(problem.problem.rating !== "N/A") {
                    totalScore += (problem.problem.rating / 100);
                }
            }   
        }
    }
    else if(data.comment ===`handle: User with handle ${handle} not found`) {
        return {
            totalSolved: ' ',
            totalScore: ' ',
            solvedProblemList: []
        }
    }
    
    return {
        totalSolved: solvedProblem,
        totalScore: totalScore,
        solvedProblemList: solvedProblemList
    };
}
async function categoryWiseResult(data) {
    const fetchedData = []
    for(const participant of data) {
        const tempParticipant = await getDataFromCodeforces(participant.handle);
        tempParticipant.name = participant.name;
        tempParticipant.handle = participant.handle;
        tempParticipant.ID = participant.ID;
        fetchedData.push(tempParticipant);
    }
    return fetchedData;
}
async function fetchData() {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('loading').classList.add('show');

    let seniorResult = await categoryWiseResult(seniorCategoryData)
    let juniorResult = await categoryWiseResult(juniorCategoryData)
    let femaleResult = await categoryWiseResult(femaleCategoryData)


    return {
        seniorResult,
        juniorResult,
        femaleResult
    }
}
/*
participant = {
    name: Nahif Reza (string),
    handle: Nahif_Reza_99 (string),
    totalSolved: 10 (int),
    totalScore: 10 (int),
    solvedProblemList: [] (array)
}
*/

function displayResults(data) {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('loading').style.display = 'none';

    document.getElementById('results').classList.remove('hidden');
    document.getElementById('results').style.display = 'block';

    data.seniorResult.sort((a, b) => b.totalScore - a.totalScore);
    data.juniorResult.sort((a, b) => b.totalScore - a.totalScore);
    data.femaleResult.sort((a, b) => b.totalScore - a.totalScore);

    const categoryMap = {
        seniorResult: 'category-1-results',
        juniorResult: 'category-2-results',
        femaleResult: 'category-3-results'
    };

    for (const [categoryKey, elementId] of Object.entries(categoryMap)) {
        const categoryData = data[categoryKey];
        const tableBody = document.querySelector(`#${elementId} tbody`);
        
        tableBody.innerHTML = '';

        if (categoryData.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 5;
            cell.textContent = 'No participants in this category.';
            row.appendChild(cell);
            tableBody.appendChild(row);
            continue;
        }

        for (const participant of categoryData) {
            const row = document.createElement('tr');

            const nameCell = document.createElement('td');
            if(participant.totalScore !== ' ') {
                nameCell.textContent = participant.name;
            }
            else {
                nameCell.textContent = "User Not Found";
            }

            const idCell = document.createElement('td');
            idCell.textContent = participant.ID || 'N/A'; 

            const handleCell = document.createElement('td');
            handleCell.textContent = participant.handle;

            const solvedCell = document.createElement('td');
            solvedCell.textContent = participant.totalSolved;

            const scoreCell = document.createElement('td');
            scoreCell.textContent = participant.totalScore;

            row.appendChild(nameCell);
            row.appendChild(idCell);
            row.appendChild(handleCell);
            row.appendChild(solvedCell);
            row.appendChild(scoreCell);

            tableBody.appendChild(row);
        }
    }
}


function displayError(error) {
    const errorElement = document.getElementById('error');
    errorElement.textContent = 'An error occurred: ' + error.message;
    errorElement.classList.remove('hidden');
}
