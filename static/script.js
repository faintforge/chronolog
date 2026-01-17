async function newTimestamp(ev) {
    let activity = ev.target.id
    let response = await fetch("/api/activity", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({"activity": activity})
    })
        .then(res => res.json())
    console.log(response)
}

function buildActivitySelector(activities) {
    const activity_container = document.getElementById("activity_container")
    activities.forEach((activity) => {
        let container = document.createElement("div")
        container.classList.add("activity")

        let input = document.createElement("input")
        input.type = "radio"
        input.name = "activity"
        input.id = activity;
        input.onclick = newTimestamp
        container.appendChild(input)

        let label = document.createElement("label")
        label.setAttribute("for", activity)
        label.innerHTML = activity
        container.appendChild(label)

        activity_container.appendChild(container)
    })
}

async function setCurrentActivity() {
    const current_activity = await fetch("api/activity", {method: "GET"})
        .then(res => res.json())
        .then(data => data["activity"])
    let to_be_checked = document.getElementById(current_activity)
    to_be_checked.clicked = true
    to_be_checked.click()
}

const ACTIVITIES = [
    "uncategorized",
    "programming",
    "reading",
    "piano",
    "studying",
    "youtube",
    "reddit",
    "porn",
];
buildActivitySelector(ACTIVITIES)
setCurrentActivity()
