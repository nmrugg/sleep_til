sleep_til: A better sleep

Usage: sleep_til TIME[-TIME[-r] PROGRAM [ARGS1 ... ARGSn]]

  TIME can be the following:
  A timestamp:
     1:00      (assumes AM)
    14:30      (24 hour)
     4:33am
     1:30PM
     1:30:01PM (with seconds)
  One of the following time words:
     noon
     midnight
  Time to wait:
     1s     (seconds)
     5m     (minutes)
     5min   (can use longer words)
     3H     (hours, case insensitive)
     3days  (days)

  If a range is specified, it will execute a program for the specified amount of time:
    sleep_til 11:00PM-6:00AM wget -c http://example.com/largefile.zip
  (This will run "wget" (with the following args) from 11:00PM to 6:00AM)

  If you don't specifiy a range, you will want to chain this with another program, like this:
    sleep_til 5minutes; wget ...

Repeated tasks:
  If the time range ends with -r or -repeat, it will retry to run the process until it exists without an error.
  If the program does not exit at all, it will sleep again for the specified times.
  If the program exists with an error, it will pause momentarily and rerun the program.
  Here's an example to download a file over night and continue the next day if it does not finish:
    sleep_til 11:00PM-6:00AM-r wget -c http://example.com/largefile.zip

NOTE: When using a timestamp, it will use the current time's second value if not specified.
NOTE: The maximum time to wait is about 24 days.
