/**
 * @OnlyCurrentDoc
 */

const Config = (() => {
  ns = {}

  ns.fieldTypes = {
    text: "text", number: "number", date: "date", multiline: "multiline", select: "select"
  }

  ns.modelDefs = {
    "books": {
      fields: {
        "id": { type: ns.fieldTypes.text, readonly: true },
        "title": { type: ns.fieldTypes.text, required: true },
        "author": { type: ns.fieldTypes.text },
        "pages": { type: ns.fieldTypes.number },
        "genre": {
          type: ns.fieldTypes.select,
          options: ["Romance", "Mystery", "Non-fiction"]
        },
        "published": { type: ns.fieldTypes.date },
        "notes": { type: ns.fieldTypes.multiline },

      },
      displayText: (res) => {
        return `${res.title} by ${res.author}`
      }
    }
  }

  return ns
})()

const doGet = (e) => {
  console.log(`New GET Request. e = ${JSON.stringify(e)}`)
  return Router.route(e)
}

const doPost = (e) => {
  console.log(`New POST Request. e = ${JSON.stringify(e)}`)
  return Router.route(e)
}

const Router = (() => {
  ns = {}

  ns.route = (ctx) => {
    if (ctx.pathInfo.startsWith("admin/")) {
      [_, ctx.type, ctx.action, ctx.id = null] = ctx.pathInfo.split("/")
      return Controller[ctx.action](ctx)
    }
    return HtmlService.createHtmlOutput("404 - Not Found")
  }

  ns.buildAdminLink = (type, action, id = null) => {
    let link = `${ScriptApp.getService().getUrl()}/admin/${type}/${action}`
    if (id != null) {
      link += `/${id}`
    }
    return link
  }

  return ns
})()

const Controller = (() => {
  ns = {}

  ns.list = (ctx) => {
    ctx.resources = Model.read(ctx.type)
    ctx.resources.forEach(res => res.showLink = Router.buildAdminLink(ctx.type, "show", res.id))
    ctx.addLink = Router.buildAdminLink(ctx.type, "add")
    return renderTemplate("v/list", ctx)
  }

  ns.show = (ctx) => {
    ctx.resource = Model.read(ctx.type, ctx.id)
    ctx.editLink = Router.buildAdminLink(ctx.type, "edit", ctx.id)
    ctx.deleteLink = Router.buildAdminLink(ctx.type, "delete", ctx.id)
    return renderTemplate("v/show", ctx)
  }

  ns.add = (ctx) => {
    ctx.resource = Model.read(ctx.type)[0]
    Object.keys(ctx.resource).forEach(key => {
      ctx.resource[key] = null // keep the keys and sheet column order for rendering in the form, but null the value
    })
    ctx.formLink = Router.buildAdminLink(ctx.type, "create")
    return renderTemplate("v/form", ctx)
  }

  ns.edit = (ctx) => {
    ctx.resource = Model.read(ctx.type, ctx.id)
    ctx.formLink = Router.buildAdminLink(ctx.type, "update", ctx.id)
    return renderTemplate("v/form", ctx)
  }

  ns.json = (ctx) => {
    const resources = Model.read(ctx.type)
    return renderJson(resources)
  }

  ns.create = (ctx) => {
    ctx.resource = Model.create(ctx.type, [ctx.parameter])[0]
    ctx.redirectText = "View new resource"
    ctx.redirectLink = Router.buildAdminLink(ctx.type, "show", ctx.resource.id)
    return renderTemplate("v/redirect", ctx)
  }

  ns.update = (ctx) => {
    Model.update(ctx.type, [ctx.parameter])
    ctx.redirectText = "View updated resource"
    ctx.redirectLink = Router.buildAdminLink(ctx.type, "show", ctx.id)
    return renderTemplate("v/redirect", ctx)
  }

  ns.delete = (ctx) => {
    Model.delete(ctx.type, [ctx.id])
    ctx.redirectText = `View ${ctx.type} list`
    ctx.redirectLink = Router.buildAdminLink(ctx.type, "list")
    return renderTemplate("v/redirect", ctx)
  }

  ns.batchCreate = (ctx) => {
    const resources = Model.create(ctx.type, JSON.parse(ctx.postData.contents).resources)
    return renderJson(resources)
  }

  ns.batchUpdate = (ctx) => {
    const resources = Model.update(ctx.type, JSON.parse(ctx.postData.contents).resources)
    return renderJson(resources)
  }

  ns.batchDelete = (ctx) => {
    Model.delete(ctx.type, JSON.parse(ctx.postData.contents).ids)
    return renderJson(ids)
  }


  const renderTemplate = (page, ctx) => {
    console.log(`Rendering ${page}. ctx = ${JSON.stringify(ctx)}`)
    const template = HtmlService.createTemplateFromFile(page)
    template.ctx = ctx
    const innerHtml = template.evaluate().getContent()
    const outerHtml = HtmlService.createTemplateFromFile("v/base").evaluate().getContent()
    return HtmlService.createHtmlOutput(outerHtml.replace("!!INNERHTML!!", innerHtml))
  }

  const renderJson = (jsObj) => {
    return ContentService.createTextOutput(JSON.stringify(jsObj)).setMimeType(ContentService.MimeType.JSON)
  }

  return ns
})()

const Model = (() => {
  ns = {}

  ns.create = (type, resources) => {
    if (lock(type) != true) return
    resources.forEach(res => res.id = Utilities.getUuid())
    const sheet = getSheet(type)
    const headers = sheet.getRange("1:1").getValues()[0]
    const rows = resources.map(res => resToRow(headers, res))
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows)
    unlock(type)
    return resources
  }

  ns.read = (type, id = null) => {
    const values = getSheet(type).getDataRange().getValues()
    const headers = values.shift()
    const resources = values.map(row => rowToRes(headers, row))
    if (id == null) return resources
    for (let res of resources) {
      if (res.id == id) return res
    }
    throw new Error(`Can't read. id='${res.id}' not found.`)
  }

  ns.update = (type, resources) => {
    if (lock(type) != true) return
    const range = getSheet(type).getDataRange()
    let values = range.getValues()
    const headers = values[0]
    const ids = values.map(v => v[headers.indexOf("id")])
    resources.forEach(res => {
      const rowNdx = ids.indexOf(res.id)
      if (rowNdx == -1) {
        throw new Error(`Can't update. id='${res.id}' not found.`)
      }
      values[rowNdx] = resToRow(headers, res)
    })
    range.setValues(values)
    unlock(type)
  }

  ns.delete = (type, ids) => {
    if (lock(type) != true) return
    const range = getSheet(type).getDataRange()
    let values = range.getValues()
    const headers = values[0]
    const idNdx = headers.indexOf("id")
    const sheetIds = values.map(v => v[idNdx])
    ids.forEach(id => {
      const rowNdx = sheetIds.indexOf(id)
      if (rowNdx == -1) {
        throw new Error(`Can't delete. id='${res.id}' not found.`)
      }
      values[rowNdx] = values[rowNdx].map(v => null) // delete this row by setting all data to null
    })
    values.sort((a, b) => {
      // sort id = null rows to end and overwrite previous data
      if (a[idNdx] === null && b[idNdx] !== null) return 1  // Move `a` to the end
      if (a[idNdx] !== null && b[idNdx] === null) return -1 // Keep `a` before `b`
      return 0 // Leave in original order otherwise
    })
    range.setValues(values)
    unlock(type)
  }

  const lock = (type) => {
    const maxRetries = 30
    const props = PropertiesService.getScriptProperties()
    for (let i = 0; i < maxRetries; i++) {
      const lockStatus = props.getProperty(type)
      if (lockStatus === null) unlock(type)  // if never locked/unlocked before, set unlocked
      if (lockStatus === "unlocked") return true // lock is open
      Utilities.sleep(1000) // if "locked", wait 1 second and try again
    }
    throw new Error(`Failed to acquire lock for "${type}" within ${maxRetries} seconds`)
  }

  const unlock = (type) => {
    PropertiesService.getScriptProperties().setProperty(type, "unlocked")
  }

  const getSheet = (name) => {
    return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name)
  }

  const resToRow = (headers, res) => {
    return headers.map(h => res[h] || null)
  }

  const rowToRes = (headers, row) => {
    let res = {}
    row.forEach((val, ndx) => res[headers[ndx]] = val)
    return res
  }

  return ns
})()
