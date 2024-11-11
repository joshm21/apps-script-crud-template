# apps-script-crud-template
A starter project for turning any spreadsheet into a crud app

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
5. copy server.gs, list.html, show.html, form.html, and redirect.html to your script project
6. define your model definitions (see example at top of server.gs)
7. deploy the script as a web app

# url format
your-web-app-url/sheet-name...
  - /list
  - /show/some-id
  - /add
  - /edit/some-id
