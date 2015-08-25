#!/usr/bin/env node

var til = process.argv[2];
var ms;

function get_from_time(t)
{
    var match = t.match(/^(\d+):(\d+)(?::(\d+))?(?:\s*(am|pm))?$/i);
    var d, h, m, dm, cm;
    
    if (match) {
        d = new Date();
        
        h = parseInt(match[1], 10);
        m = parseInt(match[2], 10);
        s = parseInt(match[3], 10);
        
        if (typeof s !== "number" || isNaN(s)) {
            s = d.getSeconds();
        }
        
        /// 12 is really 0.
        if (h === 12) {
            h = 0;
        }
        
        /// 12 hour
        if (match[4] && match[4].toLowerCase() === "pm") {
            h += 12;
        }
        
        dm = (new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, s, d.getMilliseconds())).valueOf();
        cm = d.valueOf();
        
        if (dm < cm) {
            /// Add 24 hours if it's for tomorrow.
            dm += 24 * 60 * 60 * 1000;
        }
        
        return dm - cm;
    }
}

if (!til) {
    console.log("Need a time.");
    console.log("");
    console.log("Usage: sleep_til TIME");
    console.log("  TIME can be the following:");
    console.log("  A timestamp:");
    console.log("       1:00      (assumes AM)");
    console.log("      14:30      (24 hour)");
    console.log("       4:33am");
    console.log("       1:30PM");
    console.log("       1:30:01PM (with seconds)");
    console.log("  One of the following time words:");
    console.log("       noon");
    console.log("       midnight");
    console.log("  Time to wait:");
    console.log("       1s     (seconds)");
    console.log("       5m     (minutes)");
    console.log("       5min   (can use longer words)");
    console.log("       3H     (hours, case insensitive)");
    console.log("       3days  (days)");
    console.log("");
    console.log("NOTE: When using a timestamp, it will use the current time's second value if not specified.");
    console.log("NOTE: The maximum time to wait is about 24 days.");
    return;
}

til = til.toLowerCase();

til = til.replace(/\bnoon\b/g, "12:00pm");
til = til.replace(/\bmidnight\b/g, "12:00am");

til = til.replace(/(\d)days?$/, "$1d");
til = til.replace(/(\d)hours?$/, "$1h");
til = til.replace(/(\d)min(?:ute)?s?$/, "$1m");
til = til.replace(/(\d)sec(?:ond)?s?$/, "$1s");

var last = til.slice(-1).toLowerCase();

if (last === "d") {
    ms = parseFloat(til) * 24 * 60 * 60 * 1000;
} else if (last === "h") {
    ms = parseFloat(til) * 60 * 60 * 1000;
} else if (last === "m" && !/[pa]m$/i.test(til)) {
    ms = parseFloat(til) * 60 * 1000;
} else if (last === "s" && !/[pa]m$/i.test(til)) {
    if (til.slice(-2, -1).toLowerCase() === "m") {
        ms = parseFloat(til);
    } else {
        ms = parseFloat(til) * 1000;
    }
} else {
    ms = get_from_time(til);
}

if (isNaN(ms) || ms < 0) {
    if (!isNaN(til)) {
        ms = parseFloat(til);
    } else {
        return console.log("Invalid time");
    }
}

///NOTE: 2147483648 will overflow and be the same as 0.
///      2147483647 will not; however, doing any thing close to 2147483647 still make node use a significant amount of CPU for some mysterious reason.
if (ms > 2147400000) {
    return console.log("Too long, sorry.");
}

function human_readable_time(t)
{
    var unit;
    if (t < 1000) {
        unit = "millisecond";
    } else {
        t /= 1000;
        if (t < 60) {
            unit = "second";
        } else {
            t /= 60;
            if (t < 60) {
                unit = "minute";
            } else {
                t /= 60;
                if (t < 24) {
                    unit = "hour";
                } else {
                    t /= 24;
                    unit = "day";
                }
            }
        }
    }
    
    t = Math.round(t);
    
    return t + " " + unit + (t === 1 ? "" : "s");
}

console.log("Waiting for about " + human_readable_time(ms) + ".");

setTimeout(function () {}, ms);
