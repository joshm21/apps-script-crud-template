# apps-script-crud-template
Turn any sheet into a web crud app in 5 minutes.

# features
* 5 minute setup (see below)
* create, read, update, delete
* locks to prevent concurrent edits
* text, textarea, number, date, and select fields supported
* easy to understand (~200 lines of code + html)
* bootstrap 5.3 for simple, mobile-friendly styling

# quickstart
1. create your Google Sheet (use lowercase sheet name)
2. add headers in row 1
3. (optional) add data to sheet
4. start apps script project (from sheet > extensions > apps script)
5. copy server.gs and html files to your script project (prefix html files with "v/" eg v/base)
6. define your model definitions (see example at top of server.gs)
7. deploy the script as a web app

# url format
your-web-app-url/sheet-name...
  - /list
  - /show/some-id
  - /add
  - /edit/some-id
