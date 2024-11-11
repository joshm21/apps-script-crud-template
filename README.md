# apps-script-crud-template
Turn any sheet into a crud app + rest api in 5 minutes.

# features
* 5 minute setup (see below)
* create, read, update, delete via webpage or rest api
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

# web app urls
your-web-app-url/admin/sheet-name...
  - /list
  - /show/some-id
  - /add
  - /edit/some-id

# rest api urls
your-web-app-url/admin/sheet-name...
  - /json (GET request)
  - /create (POST request, application/x-www-form-urlencoded)
  - /update (POST request, application/x-www-form-urlencoded)
  - /delete (POST request, application/x-www-form-urlencoded)
  - /batchCreate (POST request, json body {resources: [...]} without ids)
  - /batchUpdate (POST request, json body {resources: [...]})
  - /batchCreate (POST request, json body {ids: []})

# possible enhancements
* filtering, sorting, pagination on /list and /json endpoints
* middleware (logging, limit requests, whitelist users)
