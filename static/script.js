import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
mermaid.initialize({ theme: "dark" })

let timestamps = []
let displayed_day = new Date(Date.now())

Date.prototype.getWeekNumber = function() {
    let date = new Date(this);
    date.setTime(date.getTime() - (date.getISODay())*24*60*60*1000)
    let year_start = new Date()
    year_start.setHours(0, 0, 0)
    year_start.setFullYear(date.getFullYear(), 0, 1)

    let diff = date.getTime() - year_start.getTime()
    let MILLISECONDS_IN_WEEK = 1000*60*60*24*7
    return Math.ceil(diff / MILLISECONDS_IN_WEEK + 1)
}

Date.prototype.getDayString = function () {
    // I'm sorry for this
    return [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday"
    ][this.getISODay()]
}

// ISO 8601 says Monday is the first day (which it is).
Date.prototype.getISODay = function() {
    return (this.getDay() + 6) % 7
}

function displayEvents() {
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
        let hours = Math.floor((total / 3600))

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

    timestamps.pop()
}

/**
 * @param {Date} start
 * @param {Date} end
 */
function getEventsInSpan(start, end) {
    // Add a temporary timestamp of current time so you get up-to-date data on
    // the current activity.
    timestamps.push({
        "posix": Date.now() / 1000.0,
        "activity": "qwerty"
    })

    const start_time = start.getTime() / 1000.0
    const end_time = end.getTime() / 1000.0

    let events = []
    for (let i = 0; i < timestamps.length - 1; i++) {
        let curr = timestamps[i]
        let next = timestamps[i+1]

        if (next.posix < start_time) {
            continue
        }

        if (curr.posix > end_time) {
            break
        }

        // Clone the event since it's passed by reference by default so if an
        // event gets truncated then it will update the global timestamps array
        // too.
        let clone = structuredClone(curr)
        events.push(clone)
    }

    timestamps.pop();

    return events
}

/**
 * @param {Date} day
 */
function displayDaysEvents(day) {
    let midnight = new Date(day)
    midnight.setHours(0, 0, 0, 0)
    const MILLISECONDS_IN_DAY = 24*60*60*1000
    let next_day = new Date(midnight.getTime() + MILLISECONDS_IN_DAY)

    let events = getEventsInSpan(midnight, next_day)
    if (events.length > 0) {
        events[0].posix = midnight.getTime() / 1000.0
    }
    let min_posix = Math.min(Date.now() / 1000.0, next_day.getTime() / 1000.0)
    events.push({"activity": "qwerty", "posix": min_posix})

    let total_time_tracked = 0
    let total_activity_time = new Map()
    for (let i = 0; i < events.length - 1; i++) {
        let curr = events[i]
        let diff = events[i+1].posix - curr.posix
        total_time_tracked += diff
        let old = total_activity_time.get(curr.activity)
        if (old == undefined) {
            old = 0.0
        }
        total_activity_time.set(curr.activity, old + diff)
    }
    total_activity_time = new Map([...total_activity_time.entries()].sort())

    let day_container = document.getElementById("day")
    while (day_container.lastChild) {
        day_container.removeChild(day_container.lastChild)
    }

    let header = document.createElement("div")
    header.classList.add("header")

    let prev_p = document.createElement("p")
    prev_p.innerHTML = "&lt;"
    prev_p.onclick = () => changeDay(-1)
    header.append(prev_p)

    let date_h2 = document.createElement("h2")
    let year_str = String(midnight.getFullYear()).padStart(2, "0")
    let month_str = String(midnight.getMonth() + 1).padStart(2, "0")
    let day_str = String(midnight.getDate()).padStart(2, "0")
    date_h2.innerText = `${year_str}/${month_str}/${day_str}`
    header.append(date_h2)

    let next_p = document.createElement("p")
    next_p.innerHTML = "&gt;"
    next_p.onclick = () => changeDay(1)
    header.append(next_p)

    day_container.append(header)

    let pie_src = "pie"
    total_activity_time.forEach((total, activity) => {
        pie_src += `\n    "${activity}":${total}`

        let container = document.createElement("div")
        container.classList.add("activity")

        let activity_p = document.createElement("p")
        activity_p.innerText = activity
        container.append(activity_p)

        let percent_p = document.createElement("p")
        let percent = Math.round(total / total_time_tracked * 1000) / 10
        percent_p.innerText = `${percent.toString()}%`
        container.append(percent_p)

        let time_p = document.createElement("p")
        let minutes = Math.floor((total / 60) % 60)
        let hours = Math.floor(total / 3600 * 10) / 10
        if (hours >= 1) {
            time_p.innerText = `${hours} hrs`
        } else if (minutes > 0) {
            time_p.innerText = `${minutes} mins`
        } else {
            time_p.innerText = `${minutes} sec`
        }
        container.append(time_p)

        day_container.append(container)
    })

    // Only render pie chart if we have data
    if (pie_src != "pie") {
        let pie_pre = document.createElement("pre")
        pie_pre.classList.add("mermaid")
        pie_pre.innerHTML = pie_src
        day_container.append(pie_pre)
        mermaid.run()
    }
}

async function newTimestamp(activity) {
    timestamps = await fetch("/api/activity", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({"activity": activity})
    }).then(res => res.json())
    displayEvents()
    displayDaysEvents(displayed_day)
}

function buildActivitySelector(activities) {
    const activity_selector = document.getElementById("activity_selector")
    activities.forEach((activity) => {
        let input = document.createElement("input")

        input.type = "button"
        input.name = "activity"
        input.value = activity
        input.id = activity
        input.onclick = (ev) => {
            let currently_active = document.querySelector("input[disabled].active")
            currently_active.disabled = false;
            currently_active.classList.remove("active")

            ev.target.classList.add("active")
            ev.target.disabled = true

            newTimestamp(ev.target.id)
        }

        activity_selector.appendChild(input)
    })
}

function setCurrentActivity() {
    if (timestamps.length == 0) {
        return;
    }

    let current_activity = timestamps[timestamps.length - 1].activity
    let to_be_checked = document.getElementById(current_activity)
    to_be_checked.classList.add("active")
    to_be_checked.disabled = true
}

function changeDay(delta) {
    const MILLISECONDS_IN_DAY = 24*60*60*1000;
    displayed_day = new Date(displayed_day.getTime() + MILLISECONDS_IN_DAY*delta)
    displayDaysEvents(displayed_day)

    weekAverage()
}

function getDateString(date) {
    let year_str = String(date.getFullYear()).padStart(2, "0")
    let month_str = String(date.getMonth() + 1).padStart(2, "0")
    let day_str = String(date.getDate()).padStart(2, "0")
    return `${year_str}/${month_str}/${day_str}`
}

function weekAverage() {
    let today = displayed_day
    let day_of_week = today.getISODay()

    let first_day_of_week = new Date(today.getTime() - (day_of_week)*24*60*60*1000)
    first_day_of_week.setHours(0, 0, 0)

    let last_day_of_week = new Date(first_day_of_week.getTime() + 7*24*60*60*1000)

    let span_start = first_day_of_week
    let span_end
    if (last_day_of_week.getTime() < Date.now()) {
        span_end = last_day_of_week
    } else {
        span_end = new Date()
    }

    let days_passed = span_end.getTime() - span_start.getTime()
    days_passed /= 1000*60*60*24

    let events = getEventsInSpan(span_start, span_end)
    if (events.length > 0) {
        events[0].posix = span_start.getTime() / 1000.0
    }
    events.push({"activity": "qwerty", "posix": span_end.getTime() / 1000})

    let weekly_activity = new Map()
    for (let i = 0; i < events.length - 1; i++) {
        let curr = events[i]
        let diff = events[i+1].posix - curr.posix
        let old = weekly_activity.get(curr.activity)
        if (old == undefined) {
            old = 0.0
        }
        weekly_activity.set(curr.activity, old + diff)
    }
    weekly_activity = new Map([...weekly_activity.entries()].sort())

    let week_container = document.getElementById("week")
    while (week_container.lastChild) {
        week_container.removeChild(week_container.lastChild)
    }

    let header = document.createElement("div")
    header.classList.add("header")

    let date_h2 = document.createElement("h2")
    if (span_end.getTime() < Date.now()) {
        span_end.setTime(span_end.getTime() - 24*60*60*1000)
    }
    date_h2.innerText = `${getDateString(span_start)} to ${getDateString(span_end)}`
    header.append(date_h2)

    week_container.append(header)

    weekly_activity.forEach((total, activity) => {
        let container = document.createElement("div")
        container.classList.add("activity")

        let activity_p = document.createElement("p")
        activity_p.innerText = activity
        container.append(activity_p)

        let percent_p = document.createElement("p")
        let percent = Math.round(total / (days_passed*24*60*60) * 1000) / 10
        percent_p.innerText = `${percent.toString()}%`
        container.append(percent_p)

        let avg_p = document.createElement("p")
        let avg = total / days_passed
        let minutes = Math.floor((avg / 60) % 60)
        let hours = Math.floor(avg / 3600 * 10) / 10
        if (hours >= 1) {
            avg_p.innerText = `${hours} hrs`
        } else if (minutes > 0) {
            avg_p.innerText = `${minutes} mins`
        }
        container.append(avg_p)

        week_container.append(container)
    })
}

fetch("api/activity", {method: "GET"})
    .then(res => res.json()).then(data => {
    timestamps = data
    const ACTIVITIES = [
        "uncategorized",
        "sleep",
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
    displayDaysEvents(displayed_day)
    weekAverage()
})
