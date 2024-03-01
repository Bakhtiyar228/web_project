document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if(!token || localStorage.getItem('username') !== 'admin'){
        window.location.replace('/');
    }
    if (token) {
        get_counts();
        fetchRegionCounts().then(regionCounts => {
            generateTableRows(regionCounts);
        });
       document.getElementById('aboutus_footer').textContent = localStorage.getItem('aboutText').split(/[.!?]/).slice(0, 2).join('. ');;
        } 
        
});

async function get_counts() {
    try {
        const response = await fetch('/get_counts');
        const data = await response.json();
        document.getElementById('users_count').textContent = data.users_count;
        document.getElementById('orders_count').textContent = data.orders_count;    
        document.getElementById('profit').textContent = `$${data.profit}`;    
        document.getElementById('subscribers_count').textContent = `+${data.subscribers_count}`;    
    } catch(error) {
        console.log("Error occurred", error);
    }
}

async function fetchRegionCounts() {
    try {
        const response = await fetch('/region_counts');
        if (!response.ok) {
            throw new Error('Failed to fetch region counts');
        }
        return await response.json();
    } catch (error) {
        console.error('Error occurred while fetching region counts:', error);
        return [];
    }
}

function generateTableRows(regionCounts) {
    const tbody = document.getElementById("regionTableBody");
    tbody.innerHTML = ""; 
    regionCounts.sort((a, b) => b.count - a.count);
    regionCounts.forEach(({ _id, count }) => {
        const row = document.createElement("tr");
        const flagCell = document.createElement("td");
        const flagImg = document.createElement("img");
        flagImg.classList.add('flag-icon');
        flagImg.src = `images/flags/${regionFlagMapping[_id]}`; 
        flagCell.appendChild(flagImg);
        row.appendChild(flagCell);
        const countryCell = document.createElement("td");
        countryCell.textContent = _id;
        row.appendChild(countryCell);
        const countCell = document.createElement("td");
        countCell.classList.add("text-right");
        countCell.textContent = count;
        row.appendChild(countCell);
        tbody.appendChild(row);
    });
}
const regionFlagMapping = {
    "USA": "US.png",
    "Kazakhstan": "KZ.png",
    "Andorra": "AD.png",
    "United Arab Emirates": "AE.png",
    "Antigua and Barbuda": "AG.png",
    "Armenia": "AM.png",
    "Canada": "CA.png",
    "Democratic Republic of the Congo": "CD.png",
    "Republic of the Congo": "CG.png",
    "Switzerland": "CH.png",
    "Algeria": "DZ.png",
    "Estonia": "EE.png",
    "Egypt": "EG.png",
    "Spain": "ES.png"
};