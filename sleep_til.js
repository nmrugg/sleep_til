#!/usr/bin/env node

var til = process.argv[2];
var start;
var stop;
var after_wait;
var repeat_it;

function run_program()
{
    var spawn = require("child_process").spawn,
        i,
        len = process.argv.length,
        program = process.argv[3],
        args = [],
        exec,
        run_it,
        retry_delay;
    
    function onerror(e)
    {
        console.error("Error detected:");
        console.error(e);
        console.log("Waiting to retry...");
        retry_delay = setTimeout(function ()
        {
            console.log("Rerunning process.");
            run_it();
        }, 1000);
    }
    
    function onclose(code)
    {
        if (code) {
            onerror(new Error("Error code: " + code));
        }
    }
    
    for (i = 4; i < len; i += 1) {
        args.push(process.argv[i]);
    }
    
    run_it = function ()
    {
        exec = spawn(program, args, {stdio: [0, 1, 2], cwd: process.cwd(), env: process.env});
        
        if (repeat_it) {
            exec.on("error", onerror);
            exec.on("close", onclose);
        }
    };
    
    run_it();
    
    setTimeout(function after_final_wait()
    {
        clearTimeout(retry_delay);
        exec.kill(); /// SIGTERM is sent by default.
        
        if (repeat_it) {
            /// Reset the values.
            start     = undefined;
            stop      = undefined;
            repeat_it = undefined;
            wait();
        }
    }, stop).unref(); /// unref() it because we don't need to stop it if it stops before the time.
}

function get_from_time(t, start_from)
{
    var match = t.match(/^(\d+):(\d+)(?::(\d+))?(?:\s*(am|pm))?$/i);
    var d, h, m, dm, cm;
    
    if (match) {
        if (typeof start_from === "undefined") {
            d = new Date();
        } else {
            d = new Date(start_from);
        }
        
        h = parseInt(match[1], 10);
        m = parseInt(match[2], 10);
        s = parseInt(match[3], 10);
        
        if (typeof s !== "number" || isNaN(s)) {
            s = d.getSeconds();
        }
        
        /// 12 is really zero.
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

function help()
{
    console.log("Usage: sleep_til TIME[-TIME[-r] PROGRAM [ARGS1 ... ARGSn]]");
    console.log("");
    console.log("  TIME can be the following:");
    console.log("  A timestamp:");
    console.log("     1:00      (assumes AM)");
    console.log("    14:30      (24 hour)");
    console.log("     4:33am");
    console.log("     1:30PM");
    console.log("     1:30:01PM (with seconds)");
    console.log("  One of the following time words:");
    console.log("     noon");
    console.log("     midnight");
    console.log("  Time to wait:");
    console.log("     1s     (seconds)");
    console.log("     5m     (minutes)");
    console.log("     5min   (can use longer words)");
    console.log("     3H     (hours, case insensitive)");
    console.log("     3days  (days)");
    console.log("");
    console.log("  If a range is specified, it will execute a program for the specified amount of time:");
    console.log("    sleep_til 11:00PM-6:00AM wget -c http://example.com/largefile.zip");
    console.log("  (This will run \"wget\" (with the following args) from 11:00PM to 6:00AM)");
    console.log("");
    console.log("  If you don't specifiy a range, you will want to chain this with another program, like this:");
    console.log("    sleep_til 5minutes; wget ...");
    console.log("");
    console.log("Repeated tasks:");
    console.log("  If the time range ends with -r or -repeat, it will retry to run the process until it exists without an error.");
    console.log("  If the program does not exit at all, it will sleep again for the specified times.");
    console.log("  If the program exists with an error, it will pause momentarily and rerun the program.");
    console.log("  Here's an example to download a file over night and continue the next day if it does not finish:");
    console.log("    sleep_til 11:00PM-6:00AM-r wget -c http://example.com/largefile.zip");
    console.log("");
    console.log("NOTE: When using a timestamp, it will use the current time's second value if not specified.");
    console.log("NOTE: The maximum time to wait is about 24 days.");
}

function parse_time(til, start_from)
{
    var last = til.slice(-1).toLowerCase(),
        ms;
    
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
        ms = get_from_time(til, start_from);
    }
    
    if (isNaN(ms) || ms < 0) {
        if (!isNaN(til)) {
            ms = parseFloat(til);
        }
    }
    
    return ms;
}

function get_times(til)
{
    var parts = til.split("-");
    
    start = parse_time(parts[0]);
    if (parts[1]) {
        ///TODO: We need this to be time AFTER start.
        ///      1s-1s would be the same, but
        ///      11:00AM-10:00AM would be 11:00AM one day and 10:00AM the next day.
        stop = parse_time(parts[1], new Date().valueOf() + start);
        
        if (parts[2] === "r" || parts[2] === "repeat") {
            repeat_it = true;
        }
    }
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

function wait()
{
    get_times(til);
    
    ///NOTE: 2147483648 will overflow and be the same as 0.
    ///      2147483647 will not; however, doing any thing close to 2147483647 still make node use a significant amount of CPU for some mysterious reason.
    if (start > 2147400000) {
        return console.error("Too long, sorry.");
    }
    if (typeof stop === "number" &&  stop > 2147400000) {
        return console.error("End time too long, sorry.");
    }
    
    if (isNaN(start)) {
        if (!/--?help/.test(til)) {
            console.error("Invalid time");
        }
        help();
        process.exit(2);
    }
    
    console.log("Waiting for about " + human_readable_time(start) + ".");
    if (typeof stop === "number") {
        if (typeof process.argv[3] === "undefined") {
            console.error("ERROR: A range needs a program to execute.");
            process.exit(3);
        }
        console.log("Stopping about " + human_readable_time(stop) + " after that.");
        if (repeat_it) {
            console.log("Repeating until process exists properly.");
        }
    }
    
    if (typeof stop !== "number") {
        after_wait = function () {};
    } else {
        after_wait = run_program;
    }
    
    setTimeout(after_wait, start);
}


/// Prep
if (!til) {
    console.error("Need a time.");
    process.exit(1);
}

til = til.toLowerCase();

til = til.replace(/\bnoon\b/g, "12:00pm");
til = til.replace(/\bmidnight\b/g, "12:00am");

til = til.replace(/(\d)days?$/, "$1d");
til = til.replace(/(\d)hours?$/, "$1h");
til = til.replace(/(\d)min(?:ute)?s?$/, "$1m");
til = til.replace(/(\d)sec(?:ond)?s?$/, "$1s");

wait();
