function setDefaultDates() {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    const startDate = new Date(today);
    startDate.setMonth(today.getMonth() - 6);
    const startDateString = startDate.toISOString().split('T')[0]; 
  
    document.getElementById('start-date').value = startDateString;
    document.getElementById('end-date').value = endDate;
}
window.onload = setDefaultDates;

document.getElementById('stats-form').addEventListener('submit', function (e) {
    e.preventDefault(); 
  
    const handle = document.getElementById('handle').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    fetchCodeforcesStats(handle, startDate, endDate)
      .then(data => displayResults(data))
      .catch(error => displayError(error));
});

async function fetchCodeforcesStats(handle, startDate, endDate) {
    const apiUrl = `https://codeforces.com/api/user.status?handle=${handle}`;
    
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.status !== 'OK') {
            throw new Error("Failed to fetch data from Codeforces API");
        }

        const submissions = data.result;

        const startTimestamp = new Date(startDate).getTime() / 1000;
        const endTimestamp = new Date(endDate).getTime() / 1000;

        const solvedSet = new Set();
        const solvedProblems = [];

        submissions.forEach(sub => {
            const isCorrect = sub.verdict === 'OK';
            const creationTime = sub.creationTimeSeconds;

            if (isCorrect && creationTime >= startTimestamp && creationTime <= endTimestamp) {
                const problemId = `${sub.problem.contestId}-${sub.problem.index}`;
                if (!solvedSet.has(problemId)) {
                    solvedSet.add(problemId);

                    solvedProblems.push({
                        name: `${sub.problem.name}`,
                        rating: sub.problem.rating || "N/A",
                        solveTime: new Date(creationTime * 1000).toLocaleString()
                    });
                }
            }
        });

        return {
            handle: handle,
            solvedCount: solvedProblems.length,
            totalScore: solvedProblems.reduce((acc, p) => acc + (p.rating !== "N/A" ? (p.rating / 100) : 0), 0),
            problems: solvedProblems
        };

    } catch (error) {
        throw new Error("Error fetching Codeforces stats: " + error.message);
    }
}

function displayResults(data) {
    document.getElementById('results').classList.remove('hidden');
    document.getElementById('results').style.display = 'block';

    document.getElementById('user-handle').textContent = data.handle;
    document.getElementById('solved-count').textContent = data.solvedCount;
    document.getElementById('total-score').textContent = data.totalScore;

    const tbody = document.getElementById('problems-tbody');
    tbody.innerHTML = ''; 

    data.problems.forEach(problem => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${problem.name}</td>
            <td>${problem.rating}</td>
            <td>${problem.solveTime}</td>
        `;
        tbody.appendChild(row);
    });

}

function displayError(error) {
    const errorElement = document.getElementById('error');
    errorElement.textContent = 'An error occurred: ' + error.message;
    errorElement.classList.remove('hidden');
}
