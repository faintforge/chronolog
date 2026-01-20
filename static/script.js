async function displayEvents() {
    const timestamps = await fetch("api/timestamps", {method: "GET"})
        .then(res => res.json())
    // Add a temporary timestamp of current time so you get up-to-date data on
    // the current activity.
        timestamps.push({
            "posix": Date.now() / 1000.0,
            "activity": "qwerty"
        })

    const container = document.getElementById("logged_activities")
    while (container.lastChild) {
        container.removeChild(container.lastChild)
    }

    for (let i = timestamps.length - 2; i >= 0; i--) {
        let curr = timestamps[i]
        let next = timestamps[i + 1]

        let total = next.posix - curr.posix

        let seconds = Math.floor(total % 60);
        let minutes = Math.floor((total / 60) % 60)
        let hours = Math.floor((total / 3600) % 60)

        let div = document.createElement("div")
        div.classList.add("logged-activity")

        let header = document.createElement("h2")
        header.innerText = curr.activity
        div.append(header)

        let time = document.createElement("p")
        if (hours > 0) {
            time.innerText += hours.toString() + " hrs"
        }
        if (minutes > 0) {
            if (time.innerHTML.length > 0) {
                time.innerHTML += " "
            }
            time.innerHTML += minutes.toString() + " mins"
        }
        if (time.innerHTML.length > 0) {
            time.innerHTML += " "
        }
        time.innerHTML += seconds.toString() + " secs"
        div.append(time)

        container.append(div)
    }
}

async function newTimestamp(ev) {
    let activity = ev.target.id
    await fetch("/api/activity", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({"activity": activity})
    })
    await displayEvents()
}

function buildActivitySelector(activities) {
    const activity_container = document.getElementById("activity_container")
    activities.forEach((activity) => {
        let container = document.createElement("div")
        container.classList.add("activity")

        let input = document.createElement("input")
        input.type = "radio"
        input.name = "activity"
        input.id = activity
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
        .then(data => data.activity)
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
]
buildActivitySelector(ACTIVITIES)
setCurrentActivity()
displayEvents()

/**
 * @param {Date} day
 */
async function daysEvents(day) {
    /** @type {Array} */
    const timestamps = await fetch("api/timestamps", {method: "GET"})
        .then(res => res.json())
    // Add a temporary timestamp of current time so you get up-to-date data on
    // the current activity.
    timestamps.push({
        "posix": Date.now() / 1000.0,
        "activity": "qwerty"
    })

    let midnight = new Date(day);
    midnight.setHours(0, 0, 0, 0)
    let midnightPosix = midnight.getTime() / 1000.0
    const SECONDS_IN_DAY = 24*60*60;

    let total_time_tracked = 0
    let total_activity_time = new Map()
    for (let i = 0; i < timestamps.length - 1; i++) {
        let curr = timestamps[i];
        let next = timestamps[i+1];

        // This event is irrelevant
        if (next.posix < midnightPosix ||
            curr.posix >= midnightPosix + SECONDS_IN_DAY) {
            continue;
        }

        // This activity crosses the midnight boundry
        if (curr.posix < midnightPosix && next.posix > midnightPosix) {
            curr.posix = midnightPosix;
        }

        // Next activity crosses into next day
        if (next.posix > midnightPosix + SECONDS_IN_DAY - 1) {
            next.posix = midnightPosix + SECONDS_IN_DAY - 1;
        }

        let seconds_elasped = next.posix - curr.posix
        if (!total_activity_time.has(curr.activity)) {
            total_activity_time.set(curr.activity, seconds_elasped);
        } else {
            let old = total_activity_time.get(curr.activity);
            total_activity_time.set(curr.activity, old + seconds_elasped);
        }
        total_time_tracked += seconds_elasped
    }

    total_activity_time.forEach((total, activity) => {
        let seconds = Math.floor(total % 60);
        let minutes = Math.floor((total / 60) % 60)
        let hours = Math.floor((total / 3600) % 60)
        let percent = Math.round(total / total_time_tracked * 1000) / 10

        console.log(activity, percent, `${hours} hrs ${minutes} mins ${seconds} secs`)
    })
}

const SECONDS_IN_DAY = 24*60*60;
daysEvents(new Date(Date.now() - (SECONDS_IN_DAY*2)*1000))
